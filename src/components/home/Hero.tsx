'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Box } from 'lucide-react';
import Model3DViewer from '../ui/Model3DViewer';

export default function Hero() {
  const [isInteractive, setIsInteractive] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Content is only visible when 3D model is loaded AND user is not in 3D interactive mode
  const isContentVisible = isModelLoaded && !isInteractive;

  // Allow ESC key to exit interactive 3D mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInteractive) {
        setIsInteractive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInteractive]);

  return (
    <section className="relative w-full h-screen min-h-[640px] overflow-hidden bg-white flex items-center justify-center selection:bg-zinc-900 selection:text-white">
      {/* 3D Model Canvas:
          When isInteractive: Elevated to z-30 with pointer-events-auto so the user can immediately
          click-drag to rotate and mouse-wheel to zoom without needing any preliminary click.
          When !isInteractive: Placed at z-0 with pointer-events-none so regular page scrolling is unobstructed. */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-300 ${
          isInteractive ? 'z-30 pointer-events-auto' : 'z-0 pointer-events-none'
        }`}
      >
        <Model3DViewer
          modelPath="/3d modal/baker_and_the_bridge.glb"
          className="w-full h-full"
          isInteractive={isInteractive}
          onExitInteractive={() => setIsInteractive(false)}
          onLoaded={() => setIsModelLoaded(true)}
        />
      </div>

      {/* Soft Luminous Ambient Stage:
          Only visible when 3D model is loaded and interactive mode is inactive */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out bg-[radial-gradient(ellipse_65%_55%_at_50%_48%,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.45)_55%,transparent_85%)] ${
          isContentVisible ? 'opacity-100 pointer-events-none z-0' : 'opacity-0 pointer-events-none -z-10'
        }`}
      />

      {/* Heading Text & Buttons - Centered directly over the 3D model:
          Hidden until 3D model is fully loaded, smoothly fades in when ready! */}
      <div
        className={`relative w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center transition-all duration-700 ease-out ${
          isContentVisible
            ? 'opacity-100 scale-100 pointer-events-none z-10'
            : 'opacity-0 scale-95 pointer-events-none invisible select-none -z-10'
        }`}
      >
        {/* Core Content Block */}
        <div className="flex flex-col items-center">
          {/* Main Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[5.5rem] font-medium tracking-[-0.04em] text-zinc-950 leading-[1.06] max-w-4xl select-none drop-shadow-[0_2px_16px_rgba(255,255,255,0.85)]">
            Engineered for Creativity
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-5 text-base sm:text-xl font-normal text-zinc-600 leading-relaxed max-w-xl select-none drop-shadow-[0_1px_8px_rgba(255,255,255,0.8)]">
            Butter, the first video editor you can build on.
          </p>
        </div>

        {/* Centered Buttons */}
        <div
          className={`mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3 ${
            isContentVisible ? 'pointer-events-auto' : 'pointer-events-none invisible'
          }`}
        >
          {/* Get Started Button */}
          <Link
            href="/"
            className="h-11 sm:h-12 px-7 rounded-full bg-zinc-950 hover:bg-black text-white text-sm font-medium transition-all shadow-lg shadow-zinc-900/15 hover:shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center cursor-pointer"
          >
            Get Started
          </Link>

          {/* See 3D Model Button - triggers interactive mode */}
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              setIsInteractive(true);
            }}
            className="h-11 sm:h-12 px-6 rounded-full bg-white/95 hover:bg-white text-zinc-900 border border-zinc-300 hover:border-zinc-400 text-sm font-medium transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 flex items-center gap-2 group backdrop-blur-md cursor-pointer"
          >
            <Box className="w-4 h-4 text-zinc-700 group-hover:rotate-12 transition-transform" />
            <span>See 3D Model</span>
          </button>
        </div>

        {/* Helper hint */}
        <div className="mt-3.5 flex items-center gap-1.5 text-xs text-zinc-500 select-none font-medium">
          <span>Click</span>
          <span className="font-semibold text-zinc-800 underline underline-offset-2">See 3D Model</span>
          <span>to interact & rotate in 360°</span>
        </div>
      </div>
    </section>
  );
}

