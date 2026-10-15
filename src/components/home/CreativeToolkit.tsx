'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useEffect, useState } from 'react';

interface CreativeToolkitProps {
  /**
   * Put your video URL here later (e.g. videoSrc="/videos/toolkit.mp4" or Cloudinary URL)
   */
  videoSrc?: string;
  /**
   * Placeholder GIF URL used until you add your video
   */
  gifSrc?: string;
}

export default function CreativeToolkit({
  videoSrc,
  gifSrc = 'https://cdn.mos.cms.futurecdn.net/6zd7pLoo4uwDjXvQSCKUrk.jpg',
}: CreativeToolkitProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId: number;
    let currentX = 0;
    let targetX = 0;

    const calculateScroll = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const totalScrollDistance = container.offsetHeight - viewportH;

      if (totalScrollDistance <= 0) return;

      // Progress 0.0 to 1.0 based on how far container has scrolled past viewport top
      const progress = Math.min(Math.max(-rect.top / totalScrollDistance, 0), 1);

      // Total horizontal distance the track needs to translate to reveal full video
      const maxShift = Math.max(0, track.scrollWidth - window.innerWidth + 80);
      targetX = progress * maxShift;
    };

    const renderLoop = () => {
      // Butter-smooth lerp interpolation
      currentX += (targetX - currentX) * 0.12;

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${currentX}px, 0, 0)`;
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    // Find parent scroller if HomePage container has overflow-y-auto
    const scroller = containerRef.current?.closest('.overflow-y-auto') || window;

    scroller.addEventListener('scroll', calculateScroll, { passive: true });
    window.addEventListener('scroll', calculateScroll, { passive: true, capture: true });
    document.addEventListener('scroll', calculateScroll, { passive: true, capture: true });
    window.addEventListener('resize', calculateScroll);

    calculateScroll();
    rafId = requestAnimationFrame(renderLoop);

    return () => {
      scroller.removeEventListener('scroll', calculateScroll);
      window.removeEventListener('scroll', calculateScroll, { capture: true });
      document.removeEventListener('scroll', calculateScroll, { capture: true });
      window.removeEventListener('resize', calculateScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      id="creative-toolkit"
      ref={containerRef}
      className="relative w-full bg-white text-zinc-950 selection:bg-cyan-500/20"
      style={{ height: '220vh' }} // Pin duration for scrolling right to left
    >
      {/* Sticky Full-Screen Viewport Stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center bg-white">
        {/* Horizontal Moving Track */}
        <div
          ref={trackRef}
          className="flex items-center gap-8 sm:gap-12 lg:gap-16 pl-6 sm:pl-12 lg:pl-20 will-change-transform shrink-0"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {/* ============================================================== */}
          {/* LEFT: Typography Headline */}
          {/* ============================================================== */}
          <div className="w-[300px] sm:w-[400px] lg:w-[480px] shrink-0 select-none flex flex-col justify-center">
            <span className="font-mono text-xs sm:text-[13px] text-zinc-400 font-normal tracking-[0.03em] mb-4">
              Your new creative toolkit
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-[3.1rem] font-medium tracking-[-0.035em] text-zinc-950 leading-[1.12]">
              Customize and save your favorite blocks so your team never starts from scratch again.
            </h2>
          </div>

          {/* ============================================================== */}
          {/* RIGHT: Pure 1 Video / GIF Container (No buttons or sub-cards) */}
          {/* Moves smoothly right-to-left as user scrolls down              */}
          {/* ============================================================== */}
          <div className="w-[760px] sm:w-[980px] lg:w-[1180px] h-[440px] sm:h-[530px] lg:h-[600px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#070709] border border-white/10 shadow-2xl relative shrink-0 select-none group">
            {videoSrc ? (
              /* Put your video URL in videoSrc when ready */
              <video
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              /* Placeholder GIF / Image until you add the video */
              <img
                src={gifSrc}
                alt="Creative toolkit video preview"
                className="w-full h-full object-cover"
              />
            )}

            {/* Subtle gloss overlay reflection */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
