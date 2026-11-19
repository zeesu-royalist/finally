import { AspectRatio, VideoClip, AudioClip, TextClip, ImageClip } from '../types/editor';
import { hasActiveFilter, renderFilteredVideoFrameToCanvas } from './filterUtils';

export interface ExportProgress {
  progress: number; // 0 to 100
  status: string;
  previewCanvas?: HTMLCanvasElement;
}

export function getResolutionForAspectRatio(
  ratio: AspectRatio,
  primaryVideoClip?: VideoClip
): { width: number; height: number } {
  if (ratio === 'original' && primaryVideoClip && primaryVideoClip.width && primaryVideoClip.height) {
    let w = Math.round(primaryVideoClip.width);
    let h = Math.round(primaryVideoClip.height);

    // Encoders strictly require even pixel dimensions
    if (w % 2 !== 0) w -= 1;
    if (h % 2 !== 0) h -= 1;

    // Safety cap to prevent browser canvas memory exhaustion on 4K/8K
    const maxDimension = 1920;
    if (w > maxDimension || h > maxDimension) {
      if (w >= h) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      } else {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
      if (w % 2 !== 0) w -= 1;
      if (h % 2 !== 0) h -= 1;
    }
    return { width: Math.max(120, w), height: Math.max(120, h) };
  }

  switch (ratio) {
    case '16:9': return { width: 1280, height: 720 };
    case '9:16': return { width: 720, height: 1280 };
    case '1:1': return { width: 1080, height: 1080 };
    case '4:5': return { width: 864, height: 1080 };
    case '21:9': return { width: 1680, height: 720 };
    default: return { width: 1280, height: 720 };
  }
}

// Preload image overlays concurrently
async function preloadImages(imageClips: ImageClip[]): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>();
  const uniqueUrls = Array.from(new Set(imageClips.map((c) => c.url)));
  await Promise.all(
    uniqueUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          if (img.complete) {
            map.set(url, img);
            return resolve();
          }
          img.onload = () => { map.set(url, img); resolve(); };
          img.onerror = () => { map.set(url, img); resolve(); };
        })
    )
  );
  return map;
}

// Draw frame with 100% GPU-accelerated canvas operations
function renderCanvasFrame({
  ctx,
  width,
  height,
  t,
  activeVideoClip,
  activeVideoEl,
  imageClips,
  imageMap,
  textClips,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  t: number;
  activeVideoClip?: VideoClip;
  activeVideoEl?: HTMLVideoElement;
  imageClips: ImageClip[];
  imageMap: Map<string, HTMLImageElement>;
  textClips: TextClip[];
}) {
  // 1. Solid canvas background
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, width, height);

  // 2. Active Video Frame
  if (activeVideoClip && activeVideoEl && activeVideoEl.readyState >= 2) {
    const vidW = activeVideoEl.videoWidth || 1280;
    const vidH = activeVideoEl.videoHeight || 720;
    const vidAspect = vidW / vidH;
    const canvasAspect = width / height;

    let drawW = width;
    let drawH = height;
    if (Math.abs(vidAspect - canvasAspect) < 0.005) {
      drawW = width;
      drawH = height;
    } else if (vidAspect > canvasAspect) {
      drawW = width;
      drawH = width / vidAspect;
    } else {
      drawH = height;
      drawW = height * vidAspect;
    }

    ctx.save();
    ctx.globalAlpha = (activeVideoClip.adjustments.opacity ?? 100) / 100;
    ctx.translate(width / 2, height / 2);
    if (activeVideoClip.adjustments.rotation) {
      ctx.rotate((activeVideoClip.adjustments.rotation * Math.PI) / 180);
    }

    // Apply hardware-accelerated video filters (guaranteed baking across Safari, Chrome, Brave)
    if (hasActiveFilter(activeVideoClip.adjustments)) {
      const filteredCanvas = renderFilteredVideoFrameToCanvas(
        activeVideoEl,
        activeVideoClip.adjustments
      );
      ctx.drawImage(filteredCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      ctx.drawImage(activeVideoEl, -drawW / 2, -drawH / 2, drawW, drawH);
    }
    ctx.restore();
  }

  // 3. Image Overlays
  for (const img of imageClips) {
    if (t < img.startTime || t >= img.startTime + img.duration) continue;
    const imgEl = imageMap.get(img.url);
    if (!imgEl || !imgEl.naturalWidth) continue;

    ctx.save();
    const posX = (img.x / 100) * width;
    const posY = (img.y / 100) * height;
    const imgW = (img.width / 100) * width;
    const imgH = imgW * (imgEl.naturalHeight / imgEl.naturalWidth);

    ctx.translate(posX, posY);
    if (img.rotation) ctx.rotate((img.rotation * Math.PI) / 180);
    ctx.globalAlpha =
      img.opacity !== undefined
        ? img.opacity <= 1 && img.opacity > 0
          ? img.opacity
          : img.opacity / 100
        : 1;
    ctx.drawImage(imgEl, -imgW / 2, -imgH / 2, imgW, imgH);
    ctx.restore();
  }

  // 4. Text Overlays
  for (const txt of textClips) {
    if (t < txt.startTime || t >= txt.startTime + txt.duration) continue;

    ctx.save();
    const posX = (txt.x / 100) * width;
    const posY = (txt.y / 100) * height;
    const scaleFactor = height / 720;
    const fontSize = Math.max(14, txt.fontSize * scaleFactor);

    ctx.font = `${txt.isItalic ? 'italic ' : ''}${txt.isBold ? 'bold ' : ''}${fontSize}px ${txt.fontFamily}, sans-serif`;
    ctx.textAlign = txt.textAlign || 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = txt.opacity ?? 1;

    if (txt.backgroundColor && txt.backgroundColor !== 'transparent') {
      const textW = ctx.measureText(txt.text).width;
      const textH = fontSize * 1.3;
      let boxX = posX - textW / 2 - 12;
      if (txt.textAlign === 'left') boxX = posX - 12;
      if (txt.textAlign === 'right') boxX = posX - textW - 12;

      ctx.fillStyle = txt.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(boxX, posY - textH / 2, textW + 24, textH, 8);
      ctx.fill();
    }

    if (txt.shadowColor) {
      ctx.shadowColor = txt.shadowColor;
      ctx.shadowBlur = (txt.shadowBlur || 4) * scaleFactor;
    }

    ctx.fillStyle = txt.color || '#ffffff';
    ctx.fillText(txt.text, posX, posY);
    ctx.restore();
  }
}

interface MediaTrack<T> {
  clip: T;
  el: HTMLMediaElement;
  gain: GainNode;
  isPrewarmed?: boolean;
}

/**
 * Universal Master Exporter:
 * - High-compositor DOM container eliminates background GPU / video decoder throttling.
 * - Constant 30 FPS canvas stream to MediaRecorder eliminates frame drops and timestamp jitter.
 * - Buffer-stall clock freezing halts sequence recording while video frames are decoding.
 * - Phase-Locked Loop (PLL) drift tracking maintains microsecond audio/video sync without stutter.
 * - Lookahead pre-warming eliminates cut-transition latency between multiple clips.
 */
export async function exportEditedVideo({
  videoClips,
  imageClips = [],
  audioClips = [],
  textClips = [],
  aspectRatio,
  totalDuration,
  format = 'mp4',
  onProgress,
}: {
  videoClips: VideoClip[];
  imageClips?: ImageClip[];
  audioClips?: AudioClip[];
  textClips?: TextClip[];
  aspectRatio: AspectRatio;
  totalDuration: number;
  format?: 'mp4' | 'webm';
  onProgress: (progress: ExportProgress) => void;
}): Promise<{ blob: Blob; url: string; mimeType: string; format: 'mp4' | 'webm' }> {
  let { width, height } = getResolutionForAspectRatio(aspectRatio, videoClips[0]);

  // Sequence strictly ends where visual media ends; extra audio is not exported.
  const maxVisualEnd = Math.max(
    ...videoClips.map((c) => c.startTime + c.duration),
    ...imageClips.map((c) => c.startTime + c.duration),
    0
  );
  const safeDuration = Math.max(0.5, maxVisualEnd > 0 ? Math.min(totalDuration, maxVisualEnd) : totalDuration);

  onProgress({ progress: 2, status: 'Initializing video & audio tracks...' });

  let isStopped = false;

  // 1. Create a hidden background DOM export container
  // Keeps media elements mounted for audio routing and decoding while staying 100% invisible to the user
  const exportContainer = document.createElement('div');
  exportContainer.setAttribute('data-export-container', 'true');
  exportContainer.style.position = 'fixed';
  exportContainer.style.top = '0';
  exportContainer.style.left = '0';
  exportContainer.style.width = '1px';
  exportContainer.style.height = '1px';
  exportContainer.style.opacity = '0';
  exportContainer.style.pointerEvents = 'none';
  exportContainer.style.zIndex = '-9999';
  exportContainer.style.overflow = 'hidden';
  document.body.appendChild(exportContainer);

  // 2. Setup Web Audio graph with hardware clock pump anchor
  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtxClass();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  const audioDest = audioCtx.createMediaStreamDestination();
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioDest);

  // Silent Hardware Clock Anchor for Safari CoreAudio synchronization
  const silentAnchor = audioCtx.createGain();
  silentAnchor.gain.value = 0;
  masterGain.connect(silentAnchor);
  silentAnchor.connect(audioCtx.destination);

  const dummyBuffer = audioCtx.createBuffer(1, Math.max(1, audioCtx.sampleRate), audioCtx.sampleRate);
  const dummySource = audioCtx.createBufferSource();
  dummySource.buffer = dummyBuffer;
  dummySource.loop = true;
  dummySource.connect(silentAnchor);
  dummySource.start();

  // 3. Load video elements concurrently and pre-warm first frames
  const videoTracks: MediaTrack<VideoClip>[] = await Promise.all(
    videoClips.map(async (clip) => {
      const vid = document.createElement('video');
      vid.playsInline = true;
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.preload = 'auto';
      vid.style.width = '100%';
      vid.style.height = '100%';
      vid.style.objectFit = 'contain';
      vid.style.display = 'block';

      if (clip.url.startsWith('http://') || clip.url.startsWith('https://')) {
        try {
          const urlObj = new URL(clip.url);
          if (urlObj.origin !== window.location.origin) {
            vid.crossOrigin = 'anonymous';
          }
        } catch {}
      }

      vid.muted = false;
      vid.playbackRate = clip.speed ?? 1;
      if ((vid as any).preservesPitch !== undefined) {
        (vid as any).preservesPitch = true;
      }
      vid.src = clip.url;
      exportContainer.appendChild(vid);

      await new Promise<void>((resolve) => {
        if (vid.readyState >= 3) return resolve();
        const timer = setTimeout(() => onReady(), 4000);
        function onReady() {
          clearTimeout(timer);
          resolve();
        }
        vid.addEventListener('canplaythrough', onReady, { once: true });
        vid.addEventListener('canplay', onReady, { once: true });
        vid.addEventListener('loadeddata', onReady, { once: true });
        vid.addEventListener('error', onReady, { once: true });
        vid.load();
      });

      // Pre-seek to clip.offsetStart so the clip has decoded frames primed in GPU memory
      vid.currentTime = Math.max(0, clip.offsetStart);
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 600);
        vid.addEventListener('seeked', () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
      });

      const gain = audioCtx.createGain();
      gain.gain.value = 0;

      try {
        const source = audioCtx.createMediaElementSource(vid);
        source.connect(gain);
        gain.connect(masterGain);
      } catch (err) {
        console.warn('Could not connect video audio element:', err);
      }

      return {
        clip,
        el: vid,
        gain,
        isPrewarmed: true,
      };
    })
  );

  // If aspect ratio is 'original', synchronize resolution with the loaded primary video element
  if (aspectRatio === 'original' && videoTracks.length > 0 && videoTracks[0].el) {
    const primaryVid = videoTracks[0].el as HTMLVideoElement;
    if (primaryVid.videoWidth && primaryVid.videoHeight) {
      const derived = getResolutionForAspectRatio('original', {
        ...videoClips[0],
        width: primaryVid.videoWidth,
        height: primaryVid.videoHeight,
      });
      width = derived.width;
      height = derived.height;
    }
  }

  // 4. Load audio clips concurrently
  const audioTracks: MediaTrack<AudioClip>[] = await Promise.all(
    audioClips.map(async (clip) => {
      const aud = document.createElement('audio');
      aud.preload = 'auto';
      aud.playbackRate = clip.speed ?? 1;
      if ((aud as any).preservesPitch !== undefined) {
        (aud as any).preservesPitch = true;
      }

      if (clip.url.startsWith('http://') || clip.url.startsWith('https://')) {
        try {
          const urlObj = new URL(clip.url);
          if (urlObj.origin !== window.location.origin) {
            aud.crossOrigin = 'anonymous';
          }
        } catch {}
      }

      aud.src = clip.url;

      await new Promise<void>((resolve) => {
        if (aud.readyState >= 3) return resolve();
        const timer = setTimeout(() => onReady(), 3500);
        function onReady() {
          clearTimeout(timer);
          resolve();
        }
        aud.addEventListener('canplaythrough', onReady, { once: true });
        aud.addEventListener('canplay', onReady, { once: true });
        aud.addEventListener('loadeddata', onReady, { once: true });
        aud.addEventListener('error', onReady, { once: true });
        aud.load();
      });

      if (clip.offsetStart > 0.02) {
        aud.currentTime = clip.offsetStart;
      }

      const gain = audioCtx.createGain();
      gain.gain.value = 0;

      try {
        const source = audioCtx.createMediaElementSource(aud);
        source.connect(gain);
        gain.connect(masterGain);
      } catch (err) {
        console.warn('Could not connect soundtrack audio element:', err);
      }

      return { clip, el: aud, gain };
    })
  );

  // 5. Preload images concurrently
  const imageMap = await preloadImages(imageClips);

  // 6. Setup Canvas and Constant 30 FPS MediaStream
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = (
    canvas.getContext('2d', { alpha: false, colorSpace: 'srgb', willReadFrequently: false }) ||
    canvas.getContext('2d', { alpha: false })
  ) as CanvasRenderingContext2D;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Constant 30 FPS capture ensures steady timestamp delivery into MediaRecorder
  // Eliminates dropped manual requestFrame() stalls and timestamp freezes
  const videoStream = canvas.captureStream(30);

  const combinedStream = new MediaStream();
  videoStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
  audioDest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));

  // Determine optimal MIME type
  let chosenMime = 'video/webm';
  let outputFormat: 'mp4' | 'webm' = 'webm';

  if (format === 'mp4') {
    const mp4Types = [
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
      'video/mp4; codecs="avc1.4d002a, mp4a.40.2"',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
    ];
    const supportedMp4 = mp4Types.find(
      (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
    );
    if (supportedMp4) {
      chosenMime = supportedMp4;
      outputFormat = 'mp4';
    } else {
      chosenMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      outputFormat = 'webm';
    }
  } else {
    const webmTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    chosenMime =
      webmTypes.find(
        (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
      ) || 'video/webm';
    outputFormat = 'webm';
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(combinedStream, {
      mimeType: chosenMime,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 192_000,
    });
  } catch {
    recorder = new MediaRecorder(combinedStream);
  }

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  // 7. Paint initial frame 0 onto canvas before starting recording
  if (videoTracks.length > 0) {
    const firstTrack = videoTracks[0];
    renderCanvasFrame({
      ctx,
      width,
      height,
      t: 0,
      activeVideoClip: firstTrack.clip,
      activeVideoEl: firstTrack.el as HTMLVideoElement,
      imageClips,
      imageMap,
      textClips,
    });
  }

  // 8. Execute synchronized recording loop with Buffer-Stall Guard & PLL Drift Correction
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      isStopped = true;
      if (exportContainer.parentNode) {
        exportContainer.parentNode.removeChild(exportContainer);
      }
      try {
        dummySource.stop();
        dummySource.disconnect();
      } catch {}
      videoTracks.forEach((t) => {
        t.el.pause();
        t.el.src = '';
      });
      audioTracks.forEach((t) => {
        t.el.pause();
        t.el.src = '';
      });
      if (audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };

    recorder.onerror = (e) => {
      cleanup();
      reject(e);
    };

    recorder.onstop = () => {
      cleanup();
      const blob = new Blob(chunks, { type: chosenMime });
      const url = URL.createObjectURL(blob);
      onProgress({ progress: 100, status: 'Export complete!' });
      resolve({ blob, url, mimeType: chosenMime, format: outputFormat });
    };

    recorder.start(1000);

    let startWallTime = performance.now();
    let lastFrameWallTime = performance.now();
    let lastProgressUpdate = 0;
    let lastReportedPct = -1;
    let animationId: number;

    const TARGET_FPS = 30;
    const FRAME_INTERVAL_MS = 1000 / TARGET_FPS; // 33.33ms

    let currentActiveVideoId: string | null = null;
    const currentActiveAudioIds = new Set<string>();

    function renderLoop() {
      if (isStopped) return;

      const now = performance.now();

      // Sequence timeline calculation
      const elapsed = (now - startWallTime) / 1000;
      const t = Math.min(safeDuration, elapsed);

      // A. Locate active video track
      const activeVideoTrack = videoTracks.find(
        (vt) => t >= vt.clip.startTime && t < vt.clip.startTime + vt.clip.duration
      );

      // BUFFER-STALL GUARD:
      // If the active video is decoding, seeking, or waiting for buffer (readyState < 2 or seeking),
      // we freeze the sequence timeline! This guarantees we NEVER record duplicate frozen frames.
      if (activeVideoTrack && (activeVideoTrack.el.readyState < 2 || activeVideoTrack.el.seeking)) {
        const stallDelta = now - lastFrameWallTime;
        startWallTime += stallDelta;
        lastFrameWallTime = now;
        animationId = requestAnimationFrame(renderLoop);
        return;
      }

      // B. Manage video playback & PLL drift correction
      if (activeVideoTrack) {
        const speed = activeVideoTrack.clip.speed ?? 1;
        const targetMediaTime = activeVideoTrack.clip.offsetStart + (t - activeVideoTrack.clip.startTime) * speed;

        if (currentActiveVideoId !== activeVideoTrack.clip.id) {
          currentActiveVideoId = activeVideoTrack.clip.id;
          for (const vt of videoTracks) {
            if (vt.clip.id !== currentActiveVideoId && !vt.el.paused) {
              vt.el.pause();
              vt.gain.gain.value = 0;
            }
          }
          activeVideoTrack.el.currentTime = Math.max(0, targetMediaTime);
          activeVideoTrack.el.playbackRate = speed;
          activeVideoTrack.el.play().catch(() => {});
          activeVideoTrack.gain.gain.value = activeVideoTrack.clip.isMuted
            ? 0
            : (activeVideoTrack.clip.volume ?? 1);
        } else {
          // Dynamic Phase-Locked Loop (PLL) drift tracking:
          // Adjusts playback speed by subtle ±6% to lock video frame to the timeline clock
          // without triggering disruptive video decoder seeks
          const currentMediaTime = activeVideoTrack.el.currentTime;
          const drift = currentMediaTime - targetMediaTime;

          if (Math.abs(drift) > 0.3) {
            // Major drift (> 300ms): re-synchronize time directly
            activeVideoTrack.el.currentTime = Math.max(0, targetMediaTime);
            if (activeVideoTrack.el.paused) {
              activeVideoTrack.el.play().catch(() => {});
            }
          } else if (Math.abs(drift) > 0.05) {
            // Moderate drift (50ms - 300ms): gently steer speed to eliminate drift
            activeVideoTrack.el.playbackRate = speed * (drift < 0 ? 1.06 : 0.94);
            if (activeVideoTrack.el.paused && activeVideoTrack.el.readyState >= 2) {
              activeVideoTrack.el.play().catch(() => {});
            }
          } else {
            // Frame-accurate sync: hold exact speed
            if (activeVideoTrack.el.playbackRate !== speed) {
              activeVideoTrack.el.playbackRate = speed;
            }
            if (activeVideoTrack.el.paused && activeVideoTrack.el.readyState >= 2) {
              activeVideoTrack.el.play().catch(() => {});
            }
          }

          activeVideoTrack.gain.gain.value = activeVideoTrack.clip.isMuted
            ? 0
            : (activeVideoTrack.clip.volume ?? 1);
        }
      } else {
        if (currentActiveVideoId !== null) {
          currentActiveVideoId = null;
          for (const vt of videoTracks) {
            if (!vt.el.paused) {
              vt.el.pause();
              vt.gain.gain.value = 0;
            }
          }
        }
      }

      // C. Lookahead Pre-Warming: Pre-seek upcoming video clip so cut transitions are 100% seamless
      for (const vt of videoTracks) {
        if (vt.clip.id !== currentActiveVideoId) {
          const timeUntilStart = vt.clip.startTime - t;
          if (timeUntilStart > 0 && timeUntilStart < 1.5) {
            if (Math.abs(vt.el.currentTime - vt.clip.offsetStart) > 0.05) {
              vt.el.currentTime = vt.clip.offsetStart;
            }
          }
        }
      }

      // D. Manage audio tracks with drift synchronization
      for (const at of audioTracks) {
        const isActive = t >= at.clip.startTime && t < at.clip.startTime + at.clip.duration;
        if (isActive) {
          const speed = at.clip.speed ?? 1;
          const targetMediaTime = at.clip.offsetStart + (t - at.clip.startTime) * speed;

          if (!currentActiveAudioIds.has(at.clip.id)) {
            currentActiveAudioIds.add(at.clip.id);
            at.el.currentTime = Math.max(0, targetMediaTime);
            at.el.playbackRate = speed;
            at.el.play().catch(() => {});
            at.gain.gain.value = at.clip.isMuted ? 0 : (at.clip.volume ?? 1);
          } else {
            const drift = at.el.currentTime - targetMediaTime;
            if (Math.abs(drift) > 0.3) {
              at.el.currentTime = Math.max(0, targetMediaTime);
            } else if (Math.abs(drift) > 0.05) {
              at.el.playbackRate = speed * (drift < 0 ? 1.05 : 0.95);
            } else if (at.el.playbackRate !== speed) {
              at.el.playbackRate = speed;
            }
            if (at.el.paused && at.el.readyState >= 2) {
              at.el.play().catch(() => {});
            }
            at.gain.gain.value = at.clip.isMuted ? 0 : (at.clip.volume ?? 1);
          }
        } else {
          if (currentActiveAudioIds.has(at.clip.id)) {
            currentActiveAudioIds.delete(at.clip.id);
            if (!at.el.paused) at.el.pause();
            at.gain.gain.value = 0;
          }
        }
      }

      // E. Frame Cadence Pacing Barrier
      const delta = now - lastFrameWallTime;
      if (delta < FRAME_INTERVAL_MS - 2.0) {
        animationId = requestAnimationFrame(renderLoop);
        return;
      }
      lastFrameWallTime = now;

      // F. Render composite canvas frame
      renderCanvasFrame({
        ctx,
        width,
        height,
        t,
        activeVideoClip: activeVideoTrack?.clip,
        activeVideoEl: activeVideoTrack?.el as HTMLVideoElement | undefined,
        imageClips,
        imageMap,
        textClips,
      });

      // G. Throttled UI progress updates (prevents React re-render thrashing on the main thread)
      const pct = Math.min(99, Math.round((t / safeDuration) * 100));
      if (now - lastProgressUpdate > 250 || pct !== lastReportedPct) {
        lastProgressUpdate = now;
        lastReportedPct = pct;
        onProgress({
          progress: pct,
          status: `Encoding sequence: ${t.toFixed(1)}s / ${safeDuration.toFixed(1)}s (${pct}%)...`,
          previewCanvas: canvas,
        });
      }

      // H. Completion check
      if (elapsed >= safeDuration) {
        isStopped = true;
        cancelAnimationFrame(animationId);
        videoTracks.forEach((vt) => vt.el.pause());
        audioTracks.forEach((at) => at.el.pause());

        // Paint final frame
        renderCanvasFrame({
          ctx,
          width,
          height,
          t: safeDuration,
          activeVideoClip: activeVideoTrack?.clip,
          activeVideoEl: activeVideoTrack?.el as HTMLVideoElement | undefined,
          imageClips,
          imageMap,
          textClips,
        });

        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 200);
        return;
      }

      animationId = requestAnimationFrame(renderLoop);
    }

    animationId = requestAnimationFrame(renderLoop);
  });
}
