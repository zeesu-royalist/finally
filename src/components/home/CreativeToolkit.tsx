'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useEffect } from 'react';

interface CreativeToolkitProps {
  videoSrc?: string;
  gifSrc?: string;
  imageSrc?: string;
}

export default function CreativeToolkit({
  videoSrc,
  gifSrc = 'https://cdn.mos.cms.futurecdn.net/6zd7pLoo4uwDjXvQSCKUrk.jpg',
  imageSrc = 'https://cdn.dribbble.com/userupload/18228000/file/original-ba0875b0250403966042e1bc9f03add7.png',
}: CreativeToolkitProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const scroller = container.closest('.overflow-y-auto') || window;
    let target = 0;
    let current = 0;
    let running = false;
    let raf: number;
    let maxShift = 0;
    let totalDistance = 1;

    // Cache metrics on mount & resize (zero forced reflow during scroll)
    const measure = () => {
      maxShift = Math.max(0, track.scrollWidth - window.innerWidth + 7);
      totalDistance = Math.max(container.offsetHeight - window.innerHeight, 1);
    };

    // Buttery-soft damped easing loop that automatically sleeps when idle
    const tick = () => {
      current += (target - current) * 0.16;
      if (Math.abs(target - current) < 0.1) {
        current = target;
        running = false;
      }
      track.style.transform = `translate3d(-${current}px, 0, 0)`;
      if (running) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const progress = Math.min(Math.max(-container.getBoundingClientRect().top / totalDistance, 0), 1);
      target = progress * maxShift;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    measure();
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { measure(); onScroll(); }, { passive: true });

    return () => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="creative-toolkit"
      ref={containerRef}
      className="relative w-full bg-white text-zinc-950 selection:bg-cyan-500/20"
      style={{ height: '240vh' }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center bg-white">
        <div
          ref={trackRef}
          className="flex items-center gap-6 sm:gap-8 lg:gap-10 pl-6 sm:pl-12 lg:pl-20 pr-10 sm:pr-16 lg:pr-24 will-change-transform shrink-0"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {/* Typography Headline */}
          <div className="w-[300px] sm:w-[400px] lg:w-[480px] shrink-0 select-none flex flex-col justify-center">
            <span className="font-mono text-xs sm:text-[13px] text-zinc-400 font-normal tracking-[0.03em] mb-4">
              Pro video editing toolkit
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-[3.1rem] font-medium tracking-[-0.035em] text-zinc-950 leading-[1.12]">
              Arrange tracks, sync audio beats, and craft high-impact video edits in record time.
            </h2>
          </div>

          {/* Main Video / GIF Container */}
          <div className="w-[760px] sm:w-[980px] lg:w-[1180px] h-[440px] sm:h-[530px] lg:h-[600px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#070709] border border-white/10 shadow-2xl relative shrink-0 select-none group transform-gpu">
            {videoSrc ? (
              <video
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={gifSrc}
                alt="Creative video timeline preview"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />
          </div>

          {/* Companion Image */}
          <div className="w-[280px] sm:w-[360px] lg:w-[440px] h-[440px] sm:h-[530px] lg:h-[600px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#070709] border border-black/10 shadow-2xl relative shrink-0 select-none group transform-gpu">
            <img
              src={imageSrc}
              alt="Video editing tools and panels"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/5 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
