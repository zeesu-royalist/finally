'use client';

import React, { useEffect, useRef, useState } from 'react';
import type * as THREE_TYPE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Play, Pause, Compass, Box, X } from 'lucide-react';

interface Model3DViewerProps {
  modelPath?: string;
  className?: string;
  isInteractive?: boolean;
  onExitInteractive?: () => void;
  onEnterInteractive?: () => void;
  onLoaded?: () => void;
}

// Global in-memory cache so subsequent component mounts load instantaneously without network or cache lookups
const memoryBufferCache = new Map<string, ArrayBuffer>();

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const glOptions = { failIfMajorPerformanceCaveat: false };
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2', glOptions) ||
        canvas.getContext('webgl', glOptions) ||
        canvas.getContext('experimental-webgl', glOptions))
    );
  } catch {
    return false;
  }
}

/**
 * Downloads model with chunk streaming to track progress and caches in CacheStorage
 * for instant future page loads without re-downloading.
 */
async function loadModelBufferWithCache(
  url: string,
  onProgress: (loaded: number, total: number) => void,
  signal: AbortSignal
): Promise<ArrayBuffer> {
  // 1. In-memory cache hit
  if (memoryBufferCache.has(url)) {
    const buffer = memoryBufferCache.get(url)!;
    onProgress(buffer.byteLength, buffer.byteLength);
    return buffer;
  }

  // 2. Browser Cache Storage hit
  const cacheName = 'video-editor-3d-model-cache-v1';
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(cacheName);
      const cached = await cache.match(url);
      if (cached) {
        const buffer = await cached.arrayBuffer();
        memoryBufferCache.set(url, buffer);
        onProgress(buffer.byteLength, buffer.byteLength);
        return buffer;
      }
    } catch {
      // Continue to network fetch if CacheStorage is unavailable or restricted
    }
  }

  // 3. Network fetch with streaming progress
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load model: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 36700160; // 35 MB estimated fallback

  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    memoryBufferCache.set(url, buffer);
    onProgress(buffer.byteLength, buffer.byteLength);
    return buffer;
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      onProgress(loaded, total);
    }
  }

  const completeData = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    completeData.set(chunk, offset);
    offset += chunk.length;
  }

  const finalBuffer = completeData.buffer;
  memoryBufferCache.set(url, finalBuffer);

  // Cache in background for instant loads on subsequent visits
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(cacheName);
      await cache.put(
        url,
        new Response(finalBuffer, {
          headers: {
            'content-type': 'model/gltf-binary',
            'content-length': loaded.toString(),
          },
        })
      );
    } catch {
      // Ignore cache storage errors (e.g. quota limits)
    }
  }

  return finalBuffer;
}

export default function Model3DViewer({
  modelPath = '/3d modal/baker_and_the_bridge.glb',
  className = '',
  isInteractive = false,
  onExitInteractive,
  onLoaded,
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [downloadedMb, setDownloadedMb] = useState('0.0');
  const [totalMb, setTotalMb] = useState('35.0');
  const [autoRotate, setAutoRotate] = useState(true);
  const [webglError, setWebglError] = useState<string | null>(null);

  const controlsRef = useRef<OrbitControlsType | null>(null);
  const cameraRef = useRef<THREE_TYPE.PerspectiveCamera | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  const isInteractiveRef = useRef(isInteractive);
  const modelCenterYRef = useRef(0);
  const modelOverviewYRef = useRef(0);
  const initialCamPosRef = useRef<{ x: number; y: number; z: number }>({ x: 20, y: 14, z: 25 });
  const initialTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  // Sync isInteractive ref and update OrbitControls state without re-creating scene
  useEffect(() => {
    isInteractiveRef.current = isInteractive;
    if (controlsRef.current) {
      controlsRef.current.enabled = isInteractive;
      if (!isInteractive) {
        controlsRef.current.autoRotate = true;
        if (resetCameraRef.current) {
          resetCameraRef.current();
        }
      } else {
        controlsRef.current.update();
      }
    }
    if (isInteractive && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isInteractive]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!checkWebGLSupport()) {
      queueMicrotask(() => {
        setWebglError('WebGL is disabled or unavailable in this environment.');
        setLoading(false);
        onLoadedRef.current?.();
      });
      return;
    }

    let animationFrameId: number;
    let isDisposed = false;
    let isAnimationRunning = false;
    const abortController = new AbortController();

    let renderer: THREE_TYPE.WebGLRenderer | null = null;
    let controls: OrbitControlsType | null = null;
    let scene: THREE_TYPE.Scene | null = null;
    let camera: THREE_TYPE.PerspectiveCamera | null = null;
    let dracoLoader: { dispose: () => void } | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const startAnimation = () => {
      if (isAnimationRunning || isDisposed) return;
      isAnimationRunning = true;
      animate();
    };

    const stopAnimation = () => {
      isAnimationRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    const animate = () => {
      if (!isAnimationRunning || isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      if (controls) {
        // Smoothly interpolate target Y between overview and interactive mode
        const targetY = isInteractiveRef.current
          ? modelCenterYRef.current
          : modelOverviewYRef.current;
        controls.target.y += (targetY - controls.target.y) * 0.05;
        controls.update();
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else if (container) {
        const rect = container.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          startAnimation();
        }
      }
    };

    // Asynchronously load Three.js & dependencies to keep main bundle ultra lightweight
    (async () => {
      try {
        const [
          THREE,
          { GLTFLoader },
          { OrbitControls },
          { DRACOLoader },
        ] = await Promise.all([
          import('three'),
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/controls/OrbitControls.js'),
          import('three/examples/jsm/loaders/DRACOLoader.js'),
        ]);

        if (isDisposed || !container) return;

        // 1. Scene & Camera setup with pure white opaque background for mix-blend-mode: exclusion
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
        camera.position.set(20, 14, 25);
        cameraRef.current = camera;

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          failIfMajorPerformanceCaveat: false,
          powerPreference: 'high-performance',
        });

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0xffffff, 1.0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.outline = 'none';
        container.appendChild(renderer.domElement);

        // 2. OrbitControls
        try {
          controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.8;
          controls.maxPolarAngle = Math.PI / 2 + 0.05;
          controls.enabled = isInteractiveRef.current;
          // Pause auto-rotation as soon as the user starts manually dragging or interacting
          controls.addEventListener('start', () => {
            if (isInteractiveRef.current && controls && controls.autoRotate) {
              controls.autoRotate = false;
              setAutoRotate(false);
            }
          });
          controlsRef.current = controls;
        } catch (e: unknown) {
          console.warn('OrbitControls error:', e);
        }

        // 3. Balanced high-contrast lighting for crisp exclusion inversion
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.25);
        mainLight.position.set(25, 35, 25);
        scene.add(mainLight);

        const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
        cyanRimLight.position.set(-25, 15, -20);
        scene.add(cyanRimLight);

        const purpleBackLight = new THREE.DirectionalLight(0xa855f7, 0.8);
        purpleBackLight.position.set(0, -10, -25);
        scene.add(purpleBackLight);

        // Camera reset function
        resetCameraRef.current = () => {
          if (!camera) return;
          camera.position.set(
            initialCamPosRef.current.x,
            initialCamPosRef.current.y,
            initialCamPosRef.current.z
          );
          if (controlsRef.current) {
            const targetY = isInteractiveRef.current
              ? modelCenterYRef.current
              : modelOverviewYRef.current;
            controlsRef.current.target.set(0, targetY, 0);
            controlsRef.current.update();
          }
        };

        // 4. Load GLB Model with caching & progress tracking
        const loader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        loader.setDRACOLoader(draco);
        dracoLoader = draco;

        const encodedPath = encodeURI(modelPath);

        const buffer = await loadModelBufferWithCache(
          encodedPath,
          (loadedBytes, totalBytes) => {
            if (isDisposed) return;
            if (totalBytes > 0) {
              const pct = Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
              setProgress(pct);
              setDownloadedMb((loadedBytes / (1024 * 1024)).toFixed(1));
              setTotalMb((totalBytes / (1024 * 1024)).toFixed(1));
            } else if (loadedBytes) {
              const mb = (loadedBytes / (1024 * 1024)).toFixed(1);
              setDownloadedMb(mb);
              const estPct = Math.min(99, Math.round((loadedBytes / (35.0 * 1024 * 1024)) * 100));
              setProgress(estPct);
            }
          },
          abortController.signal
        );

        if (isDisposed || !scene || !camera) return;

        loader.parse(
          buffer,
          '',
          (gltf) => {
            if (isDisposed || !scene || !camera) return;

            const model = gltf.scene;

            // Auto-center and fit model precisely
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Center model at origin
            model.position.x = -center.x;
            model.position.y = -box.min.y;
            model.position.z = -center.z;

            scene.add(model);

            // Frame camera significantly closer so the 3D model is much bigger and more prominent
            const maxDim = Math.max(size.x, size.y, size.z);
            const fitDistance = maxDim * 0.85;

            modelCenterYRef.current = size.y * 0.42;
            modelOverviewYRef.current = size.y * 0.42;

            initialCamPosRef.current = {
              x: fitDistance * 0.82,
              y: fitDistance * 0.48,
              z: fitDistance * 0.98,
            };
            initialTargetRef.current = {
              x: 0,
              y: size.y * 0.42,
              z: 0,
            };

            camera.position.set(
              initialCamPosRef.current.x,
              initialCamPosRef.current.y,
              initialCamPosRef.current.z
            );
            camera.lookAt(
              initialTargetRef.current.x,
              initialTargetRef.current.y,
              initialTargetRef.current.z
            );

            if (controls) {
              controls.target.set(
                initialTargetRef.current.x,
                initialTargetRef.current.y,
                initialTargetRef.current.z
              );
              controls.minDistance = maxDim * 0.2;
              controls.maxDistance = maxDim * 3.5;
              controls.enabled = isInteractiveRef.current;
              controls.autoRotate = true;
              controls.autoRotateSpeed = 0.8;
              controls.update();
            }

            setLoading(false);
            onLoadedRef.current?.();
          },
          (parseError) => {
            console.error('Error parsing GLB buffer:', parseError);
            if (!isDisposed) {
              setWebglError('Could not parse GLB file. Please check file format.');
              setLoading(false);
              onLoadedRef.current?.();
            }
          }
        );

        // 5. Handle Resize & Visibility
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 6. IntersectionObserver: Stop animation loop when scrolled offscreen to eliminate CPU/GPU drain
        if (typeof IntersectionObserver !== 'undefined') {
          intersectionObserver = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                startAnimation();
              } else {
                stopAnimation();
              }
            },
            { threshold: 0.01 }
          );
          intersectionObserver.observe(container);
        }

        // Start initial animation
        startAnimation();
      } catch (e: unknown) {
        if (isDisposed) return;
        console.error('Model3DViewer initialization error:', e);
        setWebglError('Unable to initialize 3D viewer.');
        setLoading(false);
        onLoadedRef.current?.();
      }
    })();

    // 7. Thorough Cleanup (releases WebGL context & texture VRAM to prevent leaks)
    return () => {
      isDisposed = true;
      abortController.abort();
      stopAnimation();

      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (container && renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      try {
        dracoLoader?.dispose();
        controls?.dispose();

        if (scene) {
          scene.traverse((child) => {
            if ('geometry' in child && (child as THREE_TYPE.Mesh).geometry) {
              (child as THREE_TYPE.Mesh).geometry.dispose();
            }
            if ('material' in child) {
              const mesh = child as THREE_TYPE.Mesh;
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat) => {
                if (!mat) return;
                for (const key of Object.keys(mat)) {
                  const val = (mat as unknown as Record<string, unknown>)[key];
                  if (val && typeof val === 'object' && typeof (val as { dispose?: () => void }).dispose === 'function') {
                    (val as { dispose: () => void }).dispose();
                  }
                }
                mat.dispose();
              });
            }
          });
        }

        if (renderer) {
          renderer.dispose();
          renderer.forceContextLoss();
        }
      } catch (cleanupError) {
        console.warn('Model3DViewer cleanup warning:', cleanupError);
      }
    };
  }, [modelPath]);

  const handleToggleAutoRotate = () => {
    if (controlsRef.current) {
      const next = !autoRotate;
      controlsRef.current.autoRotate = next;
      setAutoRotate(next);
    }
  };

  const handleResetCamera = () => {
    if (resetCameraRef.current) {
      resetCameraRef.current();
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-transparent ${className}`}>
      {/* 3D WebGL Canvas
          When !isInteractive: pointer-events-none ensures trackpad/wheel scrolls the page effortlessly!
          When isInteractive: pointer-events-auto allows 360 degree drag, pinch, and zoom! */}
      <div
        ref={containerRef}
        tabIndex={isInteractive ? 0 : -1}
        className={`w-full h-full outline-none select-none ${isInteractive
          ? 'cursor-grab active:cursor-grabbing pointer-events-auto touch-none [&>canvas]:cursor-grab [&>canvas]:active:cursor-grabbing [&>canvas]:outline-none'
          : 'pointer-events-none'
          }`}
      />

      {/* Loading Overlay */}
      {loading && !webglError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-md transition-all duration-300 pointer-events-none">
          <div className="relative mb-5">
            <div className="w-14 h-14 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Box className="w-5 h-5 text-zinc-700 group-hover:rotate-12 transition-transform" />
            </div>
          </div>

          <p className="text-sm font-semibold text-zinc-900 tracking-tight mb-1">
            Loading 3D Experience...
          </p>
          <p className="text-xs text-zinc-500 mb-4 font-mono">
            {downloadedMb} MB / {totalMb} MB
          </p>

          <div className="w-48 max-w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all duration-150"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
          <span className="text-xs text-zinc-600 mt-2 font-mono font-medium">{progress}%</span>
        </div>
      )}

      {/* WebGL Fallback (Rendered cleanly on pure white) */}
      {webglError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-white pointer-events-none opacity-40">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3 text-zinc-800 shadow-sm">
            <Box className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 mb-1">3D Experience Active</h3>
        </div>
      )}

      {/* Exit 3D Mode Floating Button (Top Center, minimal, compact) */}
      {isInteractive && onExitInteractive && (
        <div className="absolute top-18 sm:top-22 left-0 right-0 z-40 flex justify-center pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={onExitInteractive}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 hover:bg-white text-zinc-800 border border-black/[0.08] shadow-sm hover:shadow backdrop-blur-md text-[12px] font-medium transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
          >
            <X className="w-3 h-3 text-zinc-500 group-hover:text-zinc-800 transition-colors" />
            <span className="tracking-tight">Exit 3D View</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-black/[0.04] border border-black/[0.04] rounded">
              ESC
            </kbd>
          </button>
        </div>
      )}

      {/* Interactive Controls Toolbar (Bottom Center on mobile, Bottom Right on desktop - ultra-minimal pill) */}
      {isInteractive && !webglError && !loading && (
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-30 flex items-center p-0.5 bg-white/90 backdrop-blur-md border border-black/[0.08] shadow-sm hover:shadow rounded-full gap-0.5 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Interaction hint */}
          <div className="hidden md:flex items-center gap-1.5 pl-2.5 pr-2 py-1 text-[11px] font-medium text-zinc-500 select-none">
            <Compass className="w-3 h-3 text-zinc-400 animate-spin [animation-duration:12s]" />
            <span>Drag to rotate</span>
            <span className="text-zinc-300">•</span>
            <span>Scroll to zoom</span>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-3.5 bg-black/[0.08] my-auto mx-0.5" />

          {/* Auto-Rotate Toggle Button */}
          <button
            type="button"
            onClick={handleToggleAutoRotate}
            title={autoRotate ? 'Pause Rotation' : 'Resume Auto Rotation'}
            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium transition-all cursor-pointer active:scale-95 ${
              autoRotate
                ? 'bg-zinc-100 text-zinc-900 border border-black/[0.05]'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.04]'
            }`}
          >
            {autoRotate ? (
              <>
                <Pause className="w-3 h-3 text-zinc-700" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-zinc-700" />
                <span>Rotate</span>
              </>
            )}
          </button>

          {/* Reset Camera Button */}
          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset Camera View"
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.04] transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3 h-3 text-zinc-500" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
