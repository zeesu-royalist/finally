/**
 * Generates client-side sample video and audio assets using HTML5 Canvas & Web Audio API.
 * Ensures zero external network dependencies and immediate testability.
 */

// Helper to convert AudioBuffer to WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);  // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // length = 16
  setUint16(1);          // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg bytes/sec
  setUint16(numOfChan * 2);              // block-align
  setUint16(16);                         // 16-bit

  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

/**
 * Generate a synthetic background music track
 */
export async function generateSyntheticAudio(
  preset: 'chill' | 'cinematic' | 'upbeat',
  durationSec: number = 10
): Promise<string> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  const chords = preset === 'chill' 
    ? [220, 261.63, 329.63, 392.00] // Am7
    : preset === 'cinematic'
    ? [130.81, 164.81, 196.00, 246.94] // Cmaj7 deep
    : [293.66, 369.99, 440.00, 554.37]; // Dmaj7 energetic

  // Bass / Pad
  chords.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = preset === 'chill' ? 'triangle' : preset === 'cinematic' ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, 0);

    // subtle vibrato
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 2 + idx;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 2.5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    // Amplitude envelope
    gain.gain.setValueAtTime(0.01, 0);
    gain.gain.linearRampToValueAtTime(0.12 / chords.length, 1.5);
    gain.gain.setValueAtTime(0.12 / chords.length, durationSec - 2);
    gain.gain.linearRampToValueAtTime(0.001, durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(durationSec);
  });

  // Rhythm clicks / pulses
  const beats = durationSec * 2;
  for (let i = 0; i < beats; i++) {
    const time = i * 0.5;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(preset === 'chill' ? 120 : 80, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  const rendered = await ctx.startRendering();
  const blob = audioBufferToWavBlob(rendered);
  return URL.createObjectURL(blob);
}

/**
 * Generate a synthetic video clip with real animations rendered onto canvas and recorded to WebM
 */
export async function generateSyntheticVideo(
  preset: 'sunset' | 'cyber' | 'waves',
  durationSec: number = 8
): Promise<{ url: string; duration: number }> {
  return new Promise((resolve) => {
    const width = 1280;
    const height = 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // MediaRecorder on canvas stream
    const fps = 30;
    const stream = canvas.captureStream(fps);
    let recorder: MediaRecorder;
    let actualMime = 'video/webm';
    try {
      const mimeTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      const chosenMime = mimeTypes.find(
        (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
      );
      if (chosenMime) {
        recorder = new MediaRecorder(stream, { mimeType: chosenMime });
        actualMime = chosenMime;
      } else {
        recorder = new MediaRecorder(stream);
        actualMime = recorder.mimeType || 'video/webm';
      }
    } catch {
      recorder = new MediaRecorder(stream);
      actualMime = recorder.mimeType || 'video/webm';
    }

    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: actualMime });
      const url = URL.createObjectURL(blob);
      resolve({ url, duration: durationSec });
    };

    recorder.start(100);

    let currentFrame = 0;
    const totalFrames = durationSec * fps;
    const frameInterval = 1000 / fps;

    function renderFrame() {
      if (currentFrame >= totalFrames) {
        recorder.stop();
        return;
      }

      const t = currentFrame / fps;

      ctx.clearRect(0, 0, width, height);

      if (preset === 'sunset') {
        // Sunset gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.4, '#831843');
        grad.addColorStop(0.7, '#ea580c');
        grad.addColorStop(1, '#facc15');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Sun
        const sunY = height * 0.45 + Math.sin(t * 0.5) * 40;
        const sunGrad = ctx.createRadialGradient(width / 2, sunY, 10, width / 2, sunY, 140);
        sunGrad.addColorStop(0, '#ffffff');
        sunGrad.addColorStop(0.5, '#fde047');
        sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(width / 2, sunY, 140, 0, Math.PI * 2);
        ctx.fill();

        // Mountain silhouettes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, height * 0.65);
        ctx.lineTo(width * 0.25, height * 0.52);
        ctx.lineTo(width * 0.5, height * 0.68);
        ctx.lineTo(width * 0.78, height * 0.48);
        ctx.lineTo(width, height * 0.7);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Dynamic title
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SUNSET HORIZON', width / 2, height * 0.25);
      } else if (preset === 'cyber') {
        // Cyberpunk dark grid
        ctx.fillStyle = '#05050e';
        ctx.fillRect(0, 0, width, height);

        // Perspective grid lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        const horizonY = height * 0.4;

        // Radiating perspective lines
        for (let x = -width; x <= width * 2; x += 100) {
          ctx.beginPath();
          ctx.moveTo(width / 2, horizonY);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Horizontal moving grid lines
        const gridOffset = (t * 80) % 60;
        for (let y = horizonY; y <= height; y += 30) {
          const actualY = y + gridOffset;
          if (actualY <= height) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${Math.min(1, (actualY - horizonY) / (height - horizonY))})`;
            ctx.beginPath();
            ctx.moveTo(0, actualY);
            ctx.lineTo(width, actualY);
            ctx.stroke();
          }
        }

        // Neon glowing circle
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(width / 2, horizonY, 90 + Math.sin(t * 3) * 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CYBER MATRIX', width / 2, horizonY - 120);
      } else {
        // Fluid waves
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#0284c7');
        grad.addColorStop(1, '#4338ca');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Animated sine waves
        for (let layer = 1; layer <= 4; layer++) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * layer})`;
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 20) {
            const y = height * 0.5 + Math.sin(x * 0.005 * layer + t * 2) * (30 * layer) + (layer * 40);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OCEAN FLOW', width / 2, height * 0.28);
      }

      // Timecode HUD overlay on sample
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(20, height - 60, 200, 40);
      ctx.fillStyle = '#10b981';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`REC ${t.toFixed(2)}s / ${durationSec.toFixed(1)}s`, 35, height - 35);

      currentFrame++;
      setTimeout(renderFrame, frameInterval);
    }

    renderFrame();
  });
}

/**
 * Generates instant client-side sample images/stickers/badges
 */
export async function generateSampleImage(
  type: 'subscribe' | 'verified' | 'cyber' | 'landscape'
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (type === 'subscribe') {
    canvas.width = 600;
    canvas.height = 180;
    // Gradient rounded badge
    const grad = ctx.createLinearGradient(0, 0, 600, 180);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(1, '#dc2626');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(10, 10, 580, 160, 40);
    ctx.fill();

    // Text & bell icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔔 SUBSCRIBE & LIKE', 300, 90);
  } else if (type === 'verified') {
    canvas.width = 400;
    canvas.height = 400;
    // Neon circle badge
    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(200, 200, 170, 0, Math.PI * 2);
    ctx.fill();

    // Checkmark
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(130, 205);
    ctx.lineTo(180, 255);
    ctx.lineTo(275, 150);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED PRO', 200, 330);
  } else if (type === 'cyber') {
    canvas.width = 500;
    canvas.height = 200;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(10, 10, 480, 180, 24);
    ctx.fill();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ CYBER BEAT', 250, 85);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText('HIGH RESOLUTION AUDIO', 250, 130);
  } else {
    // Landscape
    canvas.width = 800;
    canvas.height = 600;
    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(0.5, '#ec4899');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Glowing sun
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(400, 280, 110, 0, Math.PI * 2);
    ctx.fill();

    // Mountain silhouettes
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(180, 380);
    ctx.lineTo(360, 520);
    ctx.lineTo(580, 340);
    ctx.lineTo(800, 600);
    ctx.closePath();
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}
