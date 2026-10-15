'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Play, Pause, Compass, Sparkles, Box, Info, X } from 'lucide-react';

interface Model3DViewerProps {
  modelPath?: string;
  className?: string;
  isInteractive?: boolean;
  onExitInteractive?: () => void;
  onEnterInteractive?: () => void;
}

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

export default function Model3DViewer({
  modelPath = '/3d modal/baker_and_the_bridge.glb',
  className = '',
  isInteractive = false,
  onExitInteractive,
  onEnterInteractive,
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [downloadedMb, setDownloadedMb] = useState('0.0');
  const [totalMb, setTotalMb] = useState('35.0');
  const [autoRotate, setAutoRotate] = useState(true);
  const [webglError, setWebglError] = useState<string | null>(null);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  const isInteractiveRef = useRef(isInteractive);
  const modelCenterYRef = useRef(0);
  const modelOverviewYRef = useRef(0);
  const initialCamPosRef = useRef(new THREE.Vector3(20, 14, 25));
  const initialTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Sync isInteractive ref and update OrbitControls state without re-creating scene
  useEffect(() => {
    isInteractiveRef.current = isInteractive;
    if (controlsRef.current) {
      controlsRef.current.enabled = isInteractive;
      if (!isInteractive) {
        controlsRef.current.autoRotate = true;
        setAutoRotate(true);
        if (resetCameraRef.current) {
          resetCameraRef.current();
        }
      }
    }
  }, [isInteractive]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!checkWebGLSupport()) {
      setWebglError('WebGL is disabled or unavailable in this environment.');
      setLoading(false);
      return;
    }

    let animationFrameId: number;
    let isDisposed = false;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default',
      });
    } catch (e: unknown) {
      console.warn('WebGL Renderer initialization error:', e);
      setWebglError('Unable to create WebGL context.');
      setLoading(false);
      return;
    }

    // 1. Scene & Camera setup with pure white opaque background for mix-blend-mode: exclusion
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(20, 14, 25);
    cameraRef.current = camera;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff, 1.0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // Camera reset positions
    resetCameraRef.current = () => {
      camera.position.copy(initialCamPosRef.current);
      if (controlsRef.current) {
        const targetY = isInteractiveRef.current
          ? modelCenterYRef.current
          : modelOverviewYRef.current;
        controlsRef.current.target.set(0, targetY, 0);
        controlsRef.current.update();
      }
    };

    // 4. Load GLB Model
    const loader = new GLTFLoader();
    const encodedPath = encodeURI(modelPath);

    loader.load(
      encodedPath,
      (gltf) => {
        if (isDisposed) return;

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

        initialCamPosRef.current.set(fitDistance * 0.82, fitDistance * 0.48, fitDistance * 0.98);
        initialTargetRef.current.set(0, size.y * 0.42, 0);

        camera.position.copy(initialCamPosRef.current);
        camera.lookAt(initialTargetRef.current);

        if (controls) {
          controls.target.copy(initialTargetRef.current);
          controls.minDistance = maxDim * 0.2;
          controls.maxDistance = maxDim * 3.5;
          controls.enabled = isInteractiveRef.current;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.8;
          controls.update();
        }

        setLoading(false);
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setProgress(pct);
          setDownloadedMb((xhr.loaded / (1024 * 1024)).toFixed(1));
          setTotalMb((xhr.total / (1024 * 1024)).toFixed(1));
        } else if (xhr.loaded) {
          const mb = (xhr.loaded / (1024 * 1024)).toFixed(1);
          setDownloadedMb(mb);
          const estPct = Math.min(99, Math.round((xhr.loaded / (35.0 * 1024 * 1024)) * 100));
          setProgress(estPct);
        }
      },
      (err) => {
        console.error('Error loading 3D model:', err);
        setWebglError('Could not load GLB file. Please check file path.');
        setLoading(false);
      }
    );

    // 5. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // 6. Animation loop with smooth target interpolation
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controls) {
        // Smoothly interpolate target Y between overview and interactive mode
        const targetY = isInteractiveRef.current
          ? modelCenterYRef.current
          : modelOverviewYRef.current;
        controls.target.y += (targetY - controls.target.y) * 0.05;
        controls.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // 7. Cleanup
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);

      if (container && renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      controls?.dispose();
      renderer?.dispose();

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
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
        className={`w-full h-full outline-none transition-all duration-300 ${isInteractive
          ? 'cursor-grab active:cursor-grabbing pointer-events-auto'
          : 'pointer-events-none'
          }`}
      />

      {/* Loading Overlay */}
      {loading && !webglError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-md transition-all duration-300 pointer-events-none">
          <div className="relative mb-5">
            <div className="w-14 h-14 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-zinc-900 animate-pulse" />
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

      {/* Exit 3D Mode Floating Button (Top Center, only visible when isInteractive is active) */}
      {isInteractive && onExitInteractive && (
        <div className="absolute top-20 sm:top-24 left-0 right-0 z-40 flex justify-center pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={onExitInteractive}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950/90 hover:bg-black text-white text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md border border-white/15 hover:border-white/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4 text-zinc-300" />
            <span>Exit 3D View</span>
            <kbd className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-mono bg-white/15 rounded text-zinc-200">
              ESC
            </kbd>
          </button>
        </div>
      )}

      {/* Interactive Controls Toolbar (Bottom Right, only visible when isInteractive is true) */}
      {isInteractive && !webglError && !loading && (
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2 animate-in fade-in duration-300 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 text-white text-xs backdrop-blur-md shadow-lg border border-white/10">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin [animation-duration:8s]" />
            <span>Drag to rotate • Scroll to zoom</span>
          </div>

          <button
            type="button"
            onClick={handleToggleAutoRotate}
            title={autoRotate ? 'Pause Rotation' : 'Resume Auto Rotation'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs backdrop-blur-md shadow-lg border border-white/10 transition-all active:scale-95 cursor-pointer"
          >
            {autoRotate ? (
              <>
                <Pause className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Rotate</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset Camera View"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs backdrop-blur-md shadow-lg border border-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
