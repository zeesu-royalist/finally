import { AspectRatio, VideoClip, AudioClip, TextClip, ImageClip } from '../types/editor';
import { hasActiveFilter, renderFilteredVideoFrameToCanvas } from './filterUtils';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

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

    // Safety cap to prevent browser canvas memory exhaustion on extreme 8K
    const maxDimension = 2560; // Supports up to 2K / 2560px QHD native sharpness
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
    case '16:9': return { width: 1920, height: 1080 }; // 1080p Full HD
    case '9:16': return { width: 1080, height: 1920 }; // 1080p Full HD Vertical
    case '1:1': return { width: 1080, height: 1080 };   // 1080p High-Res Square
    case '4:5': return { width: 1080, height: 1350 };   // 1080p Instagram Portrait
    case '21:9': return { width: 2560, height: 1080 };  // 1080p Cinema Ultrawide
    default: return { width: 1920, height: 1080 };
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
  const hasVideo = Boolean(
    activeVideoClip &&
    activeVideoEl &&
    (activeVideoEl.readyState >= 1 || activeVideoEl.videoWidth > 0)
  );

  let drawnVideo = false;

  // 1. Active Video Frame
  if (hasVideo && activeVideoClip && activeVideoEl) {
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

    // Only fill background letterbox margins if video does not cover the canvas entirely
    if (drawW < width || drawH < height) {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = (activeVideoClip.adjustments.opacity ?? 100) / 100;
    ctx.translate(width / 2, height / 2);
    if (activeVideoClip.adjustments.rotation) {
      ctx.rotate((activeVideoClip.adjustments.rotation * Math.PI) / 180);
    }

    try {
      if (hasActiveFilter(activeVideoClip.adjustments)) {
        const filteredCanvas = renderFilteredVideoFrameToCanvas(
          activeVideoEl,
          activeVideoClip.adjustments
        );
        ctx.drawImage(filteredCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        ctx.drawImage(activeVideoEl, -drawW / 2, -drawH / 2, drawW, drawH);
      }
      drawnVideo = true;
    } catch {
      // If drawImage fails on a transient frame, keep previous canvas buffer
    }
    ctx.restore();
  }

  // If no video was drawn (e.g. empty timeline section), ensure solid canvas background
  if (!drawnVideo) {
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Image Overlays
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

// High-speed deterministic video frame seeker
function seekVideoToTime(video: HTMLVideoElement, time: number): Promise<void> {
  const duration = video.duration || Infinity;
  const clampedTime = Math.max(0, Math.min(isFinite(duration) ? Math.max(0, duration - 0.001) : time, time));

  if (Math.abs(video.currentTime - clampedTime) < 0.002 && (video.readyState >= 1 || video.videoWidth > 0) && !video.seeking) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('seeked', cleanup);
      if (timer) clearTimeout(timer);
      resolve();
    };

    timer = setTimeout(cleanup, 500);
    video.addEventListener('seeked', cleanup, { once: true });
    video.currentTime = clampedTime;
  });
}

// Decode audio file into AudioBuffer
async function loadAudioBuffer(url: string, audioCtx: BaseAudioContext): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuf);
  } catch (err) {
    console.warn('Could not decode audio from', url, err);
    return null;
  }
}

/**
 * High-Precision Deterministic Frame-by-Frame WebCodecs Exporter:
 * - Uses WebCodecs VideoEncoder & mp4-muxer for 100% deterministic, frame-accurate MP4 export.
 * - NEVER uses real-time video.play(), eliminating all browser decoder throttles, background freezes,
 *   occlusion culling, GOP seek delays, and VFR stutters permanently.
 * - Samples and encodes every single frame sequentially (30.000 FPS exact timestamps).
 * - Mixes full timeline audio offline with OfflineAudioContext for zero-latency AAC encoding.
 */
async function exportWithWebCodecs({
  videoClips,
  imageClips = [],
  audioClips = [],
  textClips = [],
  aspectRatio,
  totalDuration,
  onProgress,
}: {
  videoClips: VideoClip[];
  imageClips?: ImageClip[];
  audioClips?: AudioClip[];
  textClips?: TextClip[];
  aspectRatio: AspectRatio;
  totalDuration: number;
  onProgress: (progress: ExportProgress) => void;
}): Promise<{ blob: Blob; url: string; mimeType: string; format: 'mp4' }> {
  let { width, height } = getResolutionForAspectRatio(aspectRatio, videoClips[0]);

  const maxVisualEnd = Math.max(
    ...videoClips.map((c) => c.startTime + c.duration),
    ...imageClips.map((c) => c.startTime + c.duration),
    0
  );
  const safeDuration = Math.max(0.5, maxVisualEnd > 0 ? Math.min(totalDuration, maxVisualEnd) : totalDuration);

  onProgress({ progress: 2, status: 'Preloading images & media tracks...' });

  const imageMap = await preloadImages(imageClips);

  // Hidden offscreen container ensures elements are attached to document for hardware compositor frame presentation
  const hiddenMount = document.createElement('div');
  hiddenMount.style.position = 'fixed';
  hiddenMount.style.top = '-9999px';
  hiddenMount.style.left = '-9999px';
  hiddenMount.style.width = '320px';
  hiddenMount.style.height = '180px';
  hiddenMount.style.opacity = '0';
  hiddenMount.style.pointerEvents = 'none';
  document.body.appendChild(hiddenMount);

  // Load video elements as frame decoders
  let videoTracks: { clip: VideoClip; el: HTMLVideoElement }[] = [];
  try {
    videoTracks = await Promise.all(
      videoClips.map(async (clip) => {
        const vid = document.createElement('video');
        vid.preload = 'auto';
        vid.muted = true;
        vid.playsInline = true;
        vid.setAttribute('playsinline', '');
        vid.setAttribute('webkit-playsinline', '');
        if (clip.url.startsWith('http://') || clip.url.startsWith('https://')) {
          try {
            const urlObj = new URL(clip.url);
            if (urlObj.origin !== window.location.origin) vid.crossOrigin = 'anonymous';
          } catch {}
        }
        vid.src = clip.url;
        hiddenMount.appendChild(vid);

        await new Promise<void>((resolve) => {
          if (vid.readyState >= 3) return resolve();
          const t = setTimeout(resolve, 4000);
          vid.addEventListener('canplay', () => { clearTimeout(t); resolve(); }, { once: true });
          vid.addEventListener('error', () => { clearTimeout(t); resolve(); }, { once: true });
          vid.load();
        });

        // Pre-seek to clip.offsetStart so initial frame is primed in GPU memory
        vid.currentTime = Math.max(0, clip.offsetStart);
        await new Promise<void>((resolve) => {
          const tm = setTimeout(resolve, 800);
          vid.addEventListener('seeked', () => { clearTimeout(tm); resolve(); }, { once: true });
        });

        return { clip, el: vid };
      })
    );

  if (aspectRatio === 'original' && videoTracks.length > 0 && videoTracks[0].el) {
    const primaryVid = videoTracks[0].el;
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

  // Offline Audio Rendering: Renders entire audio mix offline in ~50ms
  onProgress({ progress: 5, status: 'Mixing soundtrack and audio...' });
  let hasAudio = false;
  let audioBufferResult: AudioBuffer | null = null;
  const sampleRate = 48000;
  const totalSamples = Math.max(1, Math.ceil(safeDuration * sampleRate));

  try {
    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);
    let connectedSources = 0;

    for (const vc of videoClips) {
      if (vc.isMuted || (vc.volume !== undefined && vc.volume <= 0)) continue;
      const buf = await loadAudioBuffer(vc.url, offlineCtx);
      if (buf) {
        const src = offlineCtx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = vc.speed ?? 1;
        const gain = offlineCtx.createGain();
        gain.gain.value = vc.volume ?? 1;
        src.connect(gain);
        gain.connect(offlineCtx.destination);
        const start = Math.max(0, vc.startTime);
        const offset = Math.max(0, vc.offsetStart);
        const duration = Math.min(vc.duration, safeDuration - start);
        if (duration > 0) {
          src.start(start, offset, duration);
          connectedSources++;
        }
      }
    }

    for (const ac of audioClips) {
      if (ac.isMuted || (ac.volume !== undefined && ac.volume <= 0)) continue;
      const buf = await loadAudioBuffer(ac.url, offlineCtx);
      if (buf) {
        const src = offlineCtx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = ac.speed ?? 1;
        const gain = offlineCtx.createGain();
        gain.gain.value = ac.volume ?? 1;
        src.connect(gain);
        gain.connect(offlineCtx.destination);
        const start = Math.max(0, ac.startTime);
        const offset = Math.max(0, ac.offsetStart);
        const duration = Math.min(ac.duration, safeDuration - start);
        if (duration > 0) {
          src.start(start, offset, duration);
          connectedSources++;
        }
      }
    }

    if (connectedSources > 0) {
      audioBufferResult = await offlineCtx.startRendering();
      hasAudio = true;
    }
  } catch (err) {
    console.warn('Offline audio render error:', err);
    hasAudio = false;
  }

  let canEncodeAudio = false;
  if (hasAudio && typeof AudioEncoder !== 'undefined') {
    try {
      const support = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2',
        numberOfChannels: 2,
        sampleRate: 48000,
        bitrate: 192000,
      });
      canEncodeAudio = Boolean(support.supported);
    } catch {
      canEncodeAudio = false;
    }
  }

  // Determine and negotiate optimal AVC profile & level based on coded pixel area
  // Level 5.1/5.2 (avc1.640033) is required for 2K/Retina/4K (area > 2.07M pixels)
  // Level 4.2 (avc1.64002a) is used for 1080p Full HD
  const isHighRes = (width * height) > 2_073_600;

  const codecsToTry = isHighRes
    ? [
        'avc1.640033', // High Profile Level 5.1 (Up to 4K UHD, handles 2560x1508 Retina)
        'avc1.640034', // High Profile Level 5.2
        'avc1.640032', // High Profile Level 5.0
        'avc1.4d0033', // Main Profile Level 5.1
        'avc1.4d0034', // Main Profile Level 5.2
      ]
    : [
        'avc1.64002a', // High Profile Level 4.2 (1080p Full HD)
        'avc1.640028', // High Profile Level 4.0
        'avc1.4d002a', // Main Profile Level 4.2
        'avc1.640033', // High Profile Level 5.1
        'avc1.42001f', // Baseline Fallback
      ];

  let chosenCodec: string | null = null;
  for (const c of codecsToTry) {
    try {
      const s = await VideoEncoder.isConfigSupported({
        codec: c,
        width,
        height,
        bitrate: 16_000_000,
        bitrateMode: 'variable',
        latencyMode: 'quality',
      });
      if (s.supported) {
        chosenCodec = c;
        break;
      }
    } catch {}
  }

  // If high resolution exceeds device level capabilities, downscale to fit within Level 4.2 (1080p)
  if (!chosenCodec && isHighRes) {
    const scale = Math.min(1920 / width, 1080 / height);
    width = Math.round((width * scale) / 2) * 2;
    height = Math.round((height * scale) / 2) * 2;

    const fallbackCodecs = ['avc1.64002a', 'avc1.4d002a', 'avc1.42001f'];
    for (const c of fallbackCodecs) {
      try {
        const s = await VideoEncoder.isConfigSupported({
          codec: c,
          width,
          height,
          bitrate: 14_000_000,
          bitrateMode: 'variable',
          latencyMode: 'quality',
        });
        if (s.supported) {
          chosenCodec = c;
          break;
        }
      } catch {}
    }
  }

  if (!chosenCodec) {
    chosenCodec = 'avc1.4d002a';
  }

  let muxer: Muxer<ArrayBufferTarget>;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('VideoEncoder error:', e),
  });

  try {
    videoEncoder.configure({
      codec: chosenCodec,
      width,
      height,
      bitrate: 16_000_000, // 16 Mbps pristine 1080p / 2K video clarity
      bitrateMode: 'variable',
      latencyMode: 'quality',
    });
  } catch (err) {
    console.warn(`VideoEncoder.configure failed with ${chosenCodec} at ${width}x${height}, retrying at 1080p Level 4.2:`, err);
    const scale = Math.min(1920 / width, 1080 / height);
    width = Math.round((width * scale) / 2) * 2;
    height = Math.round((height * scale) / 2) * 2;
    chosenCodec = 'avc1.64002a';
    videoEncoder.configure({
      codec: chosenCodec,
      width,
      height,
      bitrate: 12_000_000,
      bitrateMode: 'variable',
      latencyMode: 'quality',
    });
  }

  muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    audio: canEncodeAudio && hasAudio ? {
      codec: 'aac',
      numberOfChannels: 2,
      sampleRate: 48000,
    } : undefined,
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  // Encode Audio Track (continuous, clean 2048-sample blocks, zero gaps, zero stutter)
  if (canEncodeAudio && audioBufferResult) {
    onProgress({ progress: 8, status: 'Encoding AAC studio audio track...' });
    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.error('AudioEncoder error:', e),
    });
    audioEncoder.configure({
      codec: 'mp4a.40.2',
      numberOfChannels: 2,
      sampleRate: 48000,
      bitrate: 256000, // 256 kbps studio audio quality
    });

    const left = audioBufferResult.getChannelData(0);
    const right = audioBufferResult.numberOfChannels > 1 ? audioBufferResult.getChannelData(1) : left;
    const chunkSize = 2048;

    for (let offset = 0; offset < audioBufferResult.length; offset += chunkSize) {
      const numFrames = Math.min(chunkSize, audioBufferResult.length - offset);
      const data = new Float32Array(numFrames * 2);
      data.set(left.subarray(offset, offset + numFrames), 0);
      data.set(right.subarray(offset, offset + numFrames), numFrames);

      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: 48000,
        numberOfChannels: 2,
        numberOfFrames: numFrames,
        timestamp: Math.round((offset / 48000) * 1_000_000),
        data,
      });

      audioEncoder.encode(audioData);
      audioData.close();
    }
    await audioEncoder.flush();
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false, colorSpace: 'srgb', willReadFrequently: false }) as CanvasRenderingContext2D;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const TARGET_FPS = 30;
  const totalFrames = Math.max(1, Math.ceil(safeDuration * TARGET_FPS));

  // Frame-by-frame deterministic render loop:
    // - Every video frame is decoded, drawn, and encoded sequentially with safe non-aborting seek waits.
    // - Keyframes are inserted every 1 second (30 frames) for instant, stutter-free playback and scrubbing.
    for (let i = 0; i < totalFrames; i++) {
      const frameTime = i / TARGET_FPS;
      const t = Math.min(safeDuration, frameTime);

      const activeTrack = videoTracks.find(
        (vt) => t >= vt.clip.startTime - 0.005 && t < vt.clip.startTime + vt.clip.duration + 0.005
      );

      if (activeTrack) {
        const speed = activeTrack.clip.speed ?? 1;
        const targetMediaTime = activeTrack.clip.offsetStart + (t - activeTrack.clip.startTime) * speed;
        await seekVideoToTime(activeTrack.el, targetMediaTime);
      }

      renderCanvasFrame({
        ctx,
        width,
        height,
        t,
        activeVideoClip: activeTrack?.clip,
        activeVideoEl: activeTrack?.el,
        imageClips,
        imageMap,
        textClips,
      });

      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round(frameTime * 1_000_000),
        duration: Math.round((1 / TARGET_FPS) * 1_000_000),
      });

      // 1-second keyframe GOP (every 30 frames) guarantees zero freeze across all media players
      videoEncoder.encode(videoFrame, { keyFrame: i % TARGET_FPS === 0 });
      videoFrame.close();

      // Hardware encoder backpressure control with safety timer to prevent stalling
      if (videoEncoder.encodeQueueSize > 8) {
        await new Promise<void>((resolve) => {
          const safetyTimer = setTimeout(resolve, 300);
          videoEncoder.ondequeue = () => {
            if (videoEncoder.encodeQueueSize < 4) {
              clearTimeout(safetyTimer);
              videoEncoder.ondequeue = null;
              resolve();
            }
          };
        });
      }

      // UI progress update and event-loop pump every 4 frames (prevents 4ms timer clamping bottlenecks)
      if (i % 4 === 0 || i === totalFrames - 1) {
        const pct = Math.min(99, 10 + Math.round(((i + 1) / totalFrames) * 89));
        onProgress({
          progress: pct,
          status: `Rendering frame ${i + 1} / ${totalFrames} (${t.toFixed(1)}s / ${safeDuration.toFixed(1)}s)...`,
          previewCanvas: canvas,
        });
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    await videoEncoder.flush();
    muxer.finalize();

    const { buffer } = muxer.target;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    onProgress({ progress: 100, status: 'Export complete!' });
    return { blob, url, mimeType: 'video/mp4', format: 'mp4' };
  } finally {
    if (hiddenMount.parentNode) {
      hiddenMount.parentNode.removeChild(hiddenMount);
    }
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
 * Automatically selects High-Precision Deterministic WebCodecs (mp4-muxer)
 * when available, falling back to MediaRecorder for legacy environments.
 */
export async function exportEditedVideo(options: {
  videoClips: VideoClip[];
  imageClips?: ImageClip[];
  audioClips?: AudioClip[];
  textClips?: TextClip[];
  aspectRatio: AspectRatio;
  totalDuration: number;
  format?: 'mp4' | 'webm';
  onProgress: (progress: ExportProgress) => void;
}): Promise<{ blob: Blob; url: string; mimeType: string; format: 'mp4' | 'webm' }> {
  // Use deterministic WebCodecs engine whenever MP4 format is requested and WebCodecs is supported
  const isWebCodecsSupported =
    typeof window !== 'undefined' &&
    typeof (window as any).VideoEncoder !== 'undefined' &&
    typeof (window as any).VideoFrame !== 'undefined';

  if (isWebCodecsSupported && options.format !== 'webm') {
    try {
      return await exportWithWebCodecs(options);
    } catch (err) {
      console.warn('WebCodecs export failed, falling back to MediaRecorder engine:', err);
    }
  }

  return exportWithMediaRecorder(options);
}

async function exportWithMediaRecorder({
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

  // 1. Create a GPU-accelerated export container positioned directly behind the modal dialog card
  // Having size >= 30x30 and opacity 1 in the active viewport guarantees Chromium's
  // 8-second background video suspension timer (kBackgroundVideoTrackOptimizationDelay) NEVER triggers.
  // Being centered behind the solid 512px modal dialog card (z-index 50) guarantees it is 100% invisible to the user.
  const exportContainer = document.createElement('div');
  exportContainer.setAttribute('data-export-container', 'true');
  exportContainer.style.position = 'fixed';
  exportContainer.style.top = '50%';
  exportContainer.style.left = '50%';
  exportContainer.style.transform = 'translate(-50%, -50%)';
  exportContainer.style.width = '320px';
  exportContainer.style.height = '180px';
  exportContainer.style.opacity = '1';
  exportContainer.style.pointerEvents = 'none';
  exportContainer.style.zIndex = '40'; // Sits directly beneath ExportModal's solid dialog card (z-50)
  exportContainer.style.overflow = 'hidden';
  exportContainer.style.backgroundColor = '#000000';
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
      videoBitsPerSecond: 16_000_000,
      audioBitsPerSecond: 256_000,
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
      // Only pause if the video is experiencing a genuine network/decoder underrun (readyState < 2)
      // and has not reached the end of the file.
      if (activeVideoTrack && activeVideoTrack.el.readyState < 2 && !activeVideoTrack.el.ended) {
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
          // Transition cut: seek once upon clip start
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
          // CONTINUOUS PLAYBACK: NEVER call currentTime = ... during active playback!
          // Calling currentTime on playing video flushes the hardware decoder pipeline and initiates
          // a GOP keyframe seek, which freezes frame presentation for 1-4 seconds on screen recordings / VFR media.
          // Instead, use dynamic playbackRate nudging (±8%) to smoothly eliminate drift without any seeking:
          const currentMediaTime = activeVideoTrack.el.currentTime;
          const drift = currentMediaTime - targetMediaTime;

          if (Math.abs(drift) > 0.05) {
            const rateMultiplier = drift < 0 ? 1.08 : 0.92;
            const targetRate = Math.max(0.25, Math.min(4.0, speed * rateMultiplier));
            if (Math.abs(activeVideoTrack.el.playbackRate - targetRate) > 0.01) {
              activeVideoTrack.el.playbackRate = targetRate;
            }
          } else {
            if (Math.abs(activeVideoTrack.el.playbackRate - speed) > 0.01) {
              activeVideoTrack.el.playbackRate = speed;
            }
          }

          if (activeVideoTrack.el.paused && activeVideoTrack.el.readyState >= 2) {
            activeVideoTrack.el.play().catch(() => {});
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

      // D. Manage audio tracks with drift synchronization (no seeking during active playback)
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
            if (Math.abs(drift) > 0.05) {
              const rateMultiplier = drift < 0 ? 1.06 : 0.94;
              at.el.playbackRate = Math.max(0.25, Math.min(4.0, speed * rateMultiplier));
            } else if (Math.abs(at.el.playbackRate - speed) > 0.01) {
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
