import { VideoClip } from '../types/editor';

export interface FilterPreset {
  id: string;
  name: string;
  desc: string;
  badge: string;
  swatchGradient: string;
  adjustments: Partial<VideoClip['adjustments']>;
}

export const DEFAULT_ADJUSTMENTS: VideoClip['adjustments'] = {
  filter: 'none',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  highlights: 0,
  blur: 0,
  hueRotate: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  opacity: 100,
  rotation: 0,
};

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'none',
    name: 'Normal',
    desc: 'Original natural colors',
    badge: 'Clean',
    swatchGradient: 'linear-gradient(135deg, #475569, #94a3b8)',
    adjustments: { ...DEFAULT_ADJUSTMENTS },
  },
  {
    id: 'cinematic',
    name: 'Cinematic Warm',
    desc: 'Golden hour warmth & contrast',
    badge: 'Film',
    swatchGradient: 'linear-gradient(135deg, #b45309, #f59e0b, #fbbf24)',
    adjustments: { ...DEFAULT_ADJUSTMENTS, filter: 'cinematic', brightness: 8, contrast: 24, saturation: 25, sepia: 30, hueRotate: 350 },
  },
  {
    id: 'cyber',
    name: 'Cyberpunk Neon',
    desc: 'Vibrant electric cyan & magenta',
    badge: 'Neon',
    swatchGradient: 'linear-gradient(135deg, #06b6d4, #3b82f6, #ec4899)',
    adjustments: { ...DEFAULT_ADJUSTMENTS, filter: 'cyber', brightness: 12, contrast: 32, saturation: 65, hueRotate: 65 },
  },
  {
    id: 'vintage',
    name: 'Retro 80s',
    desc: 'Nostalgic analog film texture',
    badge: 'Retro',
    swatchGradient: 'linear-gradient(135deg, #78350f, #d97706, #fde68a)',
    adjustments: { ...DEFAULT_ADJUSTMENTS, filter: 'vintage', brightness: 10, contrast: -8, saturation: -18, sepia: 55, blur: 0.5 },
  },
  {
    id: 'noir',
    name: 'Classic Noir',
    desc: 'High-contrast monochrome film',
    badge: 'B&W',
    swatchGradient: 'linear-gradient(135deg, #0f172a, #475569, #cbd5e1)',
    adjustments: { ...DEFAULT_ADJUSTMENTS, filter: 'noir', brightness: -5, contrast: 45, grayscale: 100, saturation: -100 },
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    desc: 'Intense warm orange & red tones',
    badge: 'Vivid',
    swatchGradient: 'linear-gradient(135deg, #991b1b, #ea580c, #facc15)',
    adjustments: { ...DEFAULT_ADJUSTMENTS, filter: 'sunset', brightness: 10, contrast: 26, saturation: 50, sepia: 35, hueRotate: 335 },
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    desc: 'Moody cinematic jade & emerald tint',
    badge: 'Cool',
    swatchGradient: 'linear-gradient(135deg, #064e3b, #059669, #34d399)',
    adjustments: { ...DEFAULT_ADJUSTMENTS, filter: 'emerald', brightness: 6, contrast: 18, saturation: 22, hueRotate: 85 },
  },
  {
    id: 'dreamy',
    name: 'Dreamy Soft',
    desc: 'Diffused ethereal soft focus bloom',
    badge: 'Soft',
    swatchGradient: 'linear-gradient(135deg, #831843, #ec4899, #fbcfe8)',
    adjustments: { ...DEFAULT_ADJUSTMENTS, filter: 'dreamy', brightness: 14, contrast: -12, saturation: 18, blur: 2 },
  },
];

/**
 * Checks whether any color adjustments or filters are active on the clip
 */
export function hasActiveFilter(adj?: VideoClip['adjustments']): boolean {
  if (!adj) return false;
  return Boolean(
    (adj.filter && adj.filter !== 'none') ||
    adj.brightness ||
    adj.contrast ||
    adj.saturation ||
    adj.highlights ||
    adj.blur ||
    adj.hueRotate ||
    adj.sepia ||
    adj.grayscale ||
    adj.invert
  );
}

/**
 * Builds standard, strictly valid CSS filter string from clip adjustments
 */
export function getFilterCssString(adj?: VideoClip['adjustments']): string {
  if (!adj || !hasActiveFilter(adj)) return 'none';

  const brightness = 100 + (adj.brightness || 0) + (adj.highlights ? Math.round(adj.highlights * 0.5) : 0);
  const contrast = 100 + (adj.contrast || 0);
  const saturation = 100 + (adj.saturation || 0);
  const blurVal = adj.blur && adj.blur > 0 ? `blur(${adj.blur}px)` : '';
  const hueDeg = (((adj.hueRotate || 0) % 360) + 360) % 360;
  const hue = hueDeg !== 0 ? `hue-rotate(${hueDeg}deg)` : '';
  const sepia = adj.sepia && adj.sepia > 0 ? `sepia(${adj.sepia}%)` : '';
  const gray = adj.grayscale && adj.grayscale > 0 ? `grayscale(${adj.grayscale}%)` : '';
  const invert = adj.invert && adj.invert > 0 ? `invert(${adj.invert}%)` : '';

  const parts = [
    brightness !== 100 ? `brightness(${brightness}%)` : '',
    contrast !== 100 ? `contrast(${contrast}%)` : '',
    saturation !== 100 ? `saturate(${saturation}%)` : '',
    blurVal,
    hue,
    sepia,
    gray,
    invert,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' ').trim() : 'none';
}

/**
 * TypedArray software fallback grader for devices without WebGL
 */
export function applyColorAdjustmentsToImageData(
  imageData: ImageData,
  adj?: VideoClip['adjustments']
): void {
  if (!adj || !hasActiveFilter(adj)) return;

  const data = imageData.data;
  const len = data.length;

  const brightness = 100 + (adj.brightness || 0) + (adj.highlights ? Math.round(adj.highlights * 0.5) : 0);
  const bFactor = brightness / 100;
  const cFactor = (100 + (adj.contrast || 0)) / 100;
  const satFactor = (100 + (adj.saturation || 0)) / 100;
  const sepiaFactor = (adj.sepia || 0) / 100;
  const grayFactor = (adj.grayscale || 0) / 100;
  const invertFactor = (adj.invert || 0) / 100;

  const hueDeg = (((adj.hueRotate || 0) % 360) + 360) % 360;
  const hueRad = (hueDeg * Math.PI) / 180;
  const cosA = Math.cos(hueRad);
  const sinA = Math.sin(hueRad);

  const h00 = 0.213 + cosA * 0.787 - sinA * 0.213;
  const h01 = 0.715 - cosA * 0.715 - sinA * 0.715;
  const h02 = 0.072 - cosA * 0.072 + sinA * 0.928;
  const h10 = 0.213 - cosA * 0.213 + sinA * 0.143;
  const h11 = 0.715 + cosA * 0.285 + sinA * 0.140;
  const h12 = 0.072 - cosA * 0.072 - sinA * 0.283;
  const h20 = 0.213 - cosA * 0.213 - sinA * 0.787;
  const h21 = 0.715 - cosA * 0.715 + sinA * 0.715;
  const h22 = 0.072 + cosA * 0.928 + sinA * 0.072;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (invertFactor > 0) {
      r = r * (1 - invertFactor) + (255 - r) * invertFactor;
      g = g * (1 - invertFactor) + (255 - g) * invertFactor;
      b = b * (1 - invertFactor) + (255 - b) * invertFactor;
    }
    if (bFactor !== 1) {
      r *= bFactor;
      g *= bFactor;
      b *= bFactor;
    }
    if (cFactor !== 1) {
      r = (r - 128) * cFactor + 128;
      g = (g - 128) * cFactor + 128;
      b = (b - 128) * cFactor + 128;
    }
    if (hueDeg !== 0) {
      const hr = r * h00 + g * h01 + b * h02;
      const hg = r * h10 + g * h11 + b * h12;
      const hb = r * h20 + g * h21 + b * h22;
      r = hr; g = hg; b = hb;
    }
    if (satFactor !== 1 || grayFactor > 0) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (satFactor !== 1) {
        r = lum + (r - lum) * satFactor;
        g = lum + (g - lum) * satFactor;
        b = lum + (b - lum) * satFactor;
      }
      if (grayFactor > 0) {
        r = r * (1 - grayFactor) + lum * grayFactor;
        g = g * (1 - grayFactor) + lum * grayFactor;
        b = b * (1 - grayFactor) + lum * grayFactor;
      }
    }
    if (sepiaFactor > 0) {
      const sr = r * 0.393 + g * 0.769 + b * 0.189;
      const sg = r * 0.349 + g * 0.686 + b * 0.168;
      const sb = r * 0.272 + g * 0.534 + b * 0.131;
      r = r * (1 - sepiaFactor) + sr * sepiaFactor;
      g = g * (1 - sepiaFactor) + sg * sepiaFactor;
      b = b * (1 - sepiaFactor) + sb * sepiaFactor;
    }

    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
}

/* =========================================================================
   HARDWARE-ACCELERATED WEBGL VIDEO FILTER ENGINE (Ultra-Optimized)
   ========================================================================= */

interface WebGLRendererState {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  uResolution: WebGLUniformLocation;
  uBrightness: WebGLUniformLocation;
  uContrast: WebGLUniformLocation;
  uSaturation: WebGLUniformLocation;
  uSepia: WebGLUniformLocation;
  uGrayscale: WebGLUniformLocation;
  uInvert: WebGLUniformLocation;
  uHueCos: WebGLUniformLocation;
  uHueSin: WebGLUniformLocation;
  uBlurRadius: WebGLUniformLocation;
  // Uniform caches to eliminate redundant WebGL driver calls
  lastB: number;
  lastC: number;
  lastS: number;
  lastSepia: number;
  lastGray: number;
  lastInvert: number;
  lastHueDeg: number;
  lastBlur: number;
}

let _glState: WebGLRendererState | null = null;
let _glInitFailed = false;

function createGLShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initWebGLRenderer(): WebGLRendererState | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (_glInitFailed) return null;
  if (_glState) return _glState;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const gl = (
      canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: true,
      }) ||
      canvas.getContext('experimental-webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: true,
      })
    ) as WebGLRenderingContext | null;

    if (!gl) {
      _glInitFailed = true;
      return null;
    }

    const vsSource = `
      attribute vec2 a_pos;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform vec2 u_resolution;

      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_sepia;
      uniform float u_grayscale;
      uniform float u_invert;
      uniform float u_hueCos;
      uniform float u_hueSin;
      uniform float u_blurRadius;

      void main() {
        vec4 color;
        if (u_blurRadius > 0.08) {
          vec2 step = u_blurRadius / u_resolution;
          color = texture2D(u_image, v_texCoord) * 0.152174;
          color += (texture2D(u_image, v_texCoord + vec2(step.x, 0.0)) +
                    texture2D(u_image, v_texCoord - vec2(step.x, 0.0)) +
                    texture2D(u_image, v_texCoord + vec2(0.0, step.y)) +
                    texture2D(u_image, v_texCoord - vec2(0.0, step.y))) * 0.130435;
          color += (texture2D(u_image, v_texCoord + step) +
                    texture2D(u_image, v_texCoord - step) +
                    texture2D(u_image, v_texCoord + vec2(step.x, -step.y)) +
                    texture2D(u_image, v_texCoord + vec2(-step.x, step.y))) * 0.081522;
        } else {
          color = texture2D(u_image, v_texCoord);
        }

        vec3 rgb = color.rgb;
        if (u_invert > 0.0) rgb = mix(rgb, vec3(1.0) - rgb, u_invert);
        if (u_brightness != 1.0) rgb *= u_brightness;
        if (u_contrast != 1.0) rgb = (rgb - 0.5) * u_contrast + 0.5;

        if (u_hueSin != 0.0 || u_hueCos != 1.0) {
          float hr = rgb.r * (0.213 + u_hueCos * 0.787 - u_hueSin * 0.213) +
                     rgb.g * (0.715 - u_hueCos * 0.715 - u_hueSin * 0.715) +
                     rgb.b * (0.072 - u_hueCos * 0.072 + u_hueSin * 0.928);
          float hg = rgb.r * (0.213 - u_hueCos * 0.213 + u_hueSin * 0.143) +
                     rgb.g * (0.715 + u_hueCos * 0.285 + u_hueSin * 0.140) +
                     rgb.b * (0.072 - u_hueCos * 0.072 - u_hueSin * 0.283);
          float hb = rgb.r * (0.213 - u_hueCos * 0.213 - u_hueSin * 0.787) +
                     rgb.g * (0.715 - u_hueCos * 0.715 + u_hueSin * 0.715) +
                     rgb.b * (0.072 + u_hueCos * 0.928 + u_hueSin * 0.072);
          rgb = vec3(hr, hg, hb);
        }

        float lum = dot(rgb, vec3(0.299, 0.587, 0.114));
        if (u_saturation != 1.0) rgb = mix(vec3(lum), rgb, u_saturation);
        if (u_grayscale > 0.0) rgb = mix(rgb, vec3(lum), u_grayscale);

        if (u_sepia > 0.0) {
          vec3 sepiaVec = vec3(
            dot(rgb, vec3(0.393, 0.769, 0.189)),
            dot(rgb, vec3(0.349, 0.686, 0.168)),
            dot(rgb, vec3(0.272, 0.534, 0.131))
          );
          rgb = mix(rgb, sepiaVec, u_sepia);
        }

        gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
      }
    `;

    const vs = createGLShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createGLShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      _glInitFailed = true;
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      _glInitFailed = true;
      return null;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getShaderParameter(program, gl.LINK_STATUS)) {
      _glInitFailed = true;
      return null;
    }

    gl.useProgram(program);

    // Bind geometry buffers once at init
    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW);
    const aTex = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    _glState = {
      canvas,
      gl,
      program,
      texture,
      uResolution: gl.getUniformLocation(program, 'u_resolution')!,
      uBrightness: gl.getUniformLocation(program, 'u_brightness')!,
      uContrast: gl.getUniformLocation(program, 'u_contrast')!,
      uSaturation: gl.getUniformLocation(program, 'u_saturation')!,
      uSepia: gl.getUniformLocation(program, 'u_sepia')!,
      uGrayscale: gl.getUniformLocation(program, 'u_grayscale')!,
      uInvert: gl.getUniformLocation(program, 'u_invert')!,
      uHueCos: gl.getUniformLocation(program, 'u_hueCos')!,
      uHueSin: gl.getUniformLocation(program, 'u_hueSin')!,
      uBlurRadius: gl.getUniformLocation(program, 'u_blurRadius')!,
      lastB: -999,
      lastC: -999,
      lastS: -999,
      lastSepia: -999,
      lastGray: -999,
      lastInvert: -999,
      lastHueDeg: -999,
      lastBlur: -999,
    };

    return _glState;
  } catch (err) {
    _glInitFailed = true;
    return null;
  }
}

// Reusable 2D fallback canvas
let _fallbackCanvas: HTMLCanvasElement | null = null;
let _fallbackCtx: CanvasRenderingContext2D | null = null;

function renderWithSoftwareFallback(videoEl: HTMLVideoElement, adj?: VideoClip['adjustments']): HTMLCanvasElement {
  const vidW = videoEl.videoWidth || 1280;
  const vidH = videoEl.videoHeight || 720;
  if (!_fallbackCanvas) _fallbackCanvas = document.createElement('canvas');
  if (_fallbackCanvas.width !== vidW || _fallbackCanvas.height !== vidH) {
    _fallbackCanvas.width = vidW;
    _fallbackCanvas.height = vidH;
  }
  if (!_fallbackCtx) {
    _fallbackCtx = _fallbackCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!_fallbackCtx) return _fallbackCanvas;

  _fallbackCtx.drawImage(videoEl, 0, 0, vidW, vidH);
  if (hasActiveFilter(adj)) {
    try {
      const imgData = _fallbackCtx.getImageData(0, 0, vidW, vidH);
      applyColorAdjustmentsToImageData(imgData, adj);
      _fallbackCtx.putImageData(imgData, 0, 0);
    } catch {
      // ignore
    }
  }
  return _fallbackCanvas;
}

/**
 * Universal GPU-accelerated video frame filter renderer.
 * Bakes all CSS color adjustments, presets, and filters directly into canvas pixels.
 * Uses uniform caching to avoid redundant GPU state changes.
 */
export function renderFilteredVideoFrameToCanvas(
  videoEl: HTMLVideoElement,
  adj?: VideoClip['adjustments']
): HTMLCanvasElement {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return (null as unknown) as HTMLCanvasElement;
  }

  const state = initWebGLRenderer();
  if (!state) return renderWithSoftwareFallback(videoEl, adj);

  const vidW = videoEl.videoWidth || 1280;
  const vidH = videoEl.videoHeight || 720;
  const gl = state.gl;

  // Resize canvas & viewport only when resolution changes
  if (state.canvas.width !== vidW || state.canvas.height !== vidH) {
    state.canvas.width = vidW;
    state.canvas.height = vidH;
    gl.viewport(0, 0, vidW, vidH);
    gl.uniform2f(state.uResolution, vidW, vidH);
  }

  // Upload video frame to texture
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoEl);
  } catch {
    return renderWithSoftwareFallback(videoEl, adj);
  }

  // Calculate current parameters
  const b = 100 + (adj?.brightness || 0) + (adj?.highlights ? Math.round(adj.highlights * 0.5) : 0);
  const c = 100 + (adj?.contrast || 0);
  const s = 100 + (adj?.saturation || 0);
  const sepia = adj?.sepia || 0;
  const gray = adj?.grayscale || 0;
  const invert = adj?.invert || 0;
  const rawHue = adj?.hueRotate || 0;
  const hueDeg = ((rawHue % 360) + 360) % 360;
  const blur = adj?.blur || 0;

  // Push uniforms ONLY when values actually change (eliminates 18,000 redundant driver ops / min)
  if (
    state.lastB !== b ||
    state.lastC !== c ||
    state.lastS !== s ||
    state.lastSepia !== sepia ||
    state.lastGray !== gray ||
    state.lastInvert !== invert ||
    state.lastHueDeg !== hueDeg ||
    state.lastBlur !== blur
  ) {
    const hueRad = (hueDeg * Math.PI) / 180;
    gl.uniform1f(state.uBrightness, b / 100);
    gl.uniform1f(state.uContrast, c / 100);
    gl.uniform1f(state.uSaturation, s / 100);
    gl.uniform1f(state.uSepia, sepia / 100);
    gl.uniform1f(state.uGrayscale, gray / 100);
    gl.uniform1f(state.uInvert, invert / 100);
    gl.uniform1f(state.uHueCos, hueDeg === 0 ? 1 : Math.cos(hueRad));
    gl.uniform1f(state.uHueSin, hueDeg === 0 ? 0 : Math.sin(hueRad));
    gl.uniform1f(state.uBlurRadius, blur);

    state.lastB = b;
    state.lastC = c;
    state.lastS = s;
    state.lastSepia = sepia;
    state.lastGray = gray;
    state.lastInvert = invert;
    state.lastHueDeg = hueDeg;
    state.lastBlur = blur;
  }

  gl.drawArrays(gl.TRIANGLES, 0, 6);
  return state.canvas;
}
