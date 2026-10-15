'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a || 1e-5), 0, 1);
  return t * t * (3 - 2 * t);
};

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

export default function ScrollExpand({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = '',
  startWidth = 44,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.5,
  useWindowScroll = false,
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}: ScrollExpandProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  const applyProgress = useCallback(
    (p: number) => {
      const frame = frameRef.current;
      const media = mediaRef.current;
      if (!frame || !media) return;

      const e = smoothstep(0, 1, p);
      const w = startWidth + (100 - startWidth) * e;
      const h = startHeight + (100 - startHeight) * e;
      const ix = Math.max(0, (100 - w) / 2);
      const iy = Math.max(0, (100 - h) / 2);
      const r = startRadius + (endRadius - startRadius) * e;

      frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
      media.style.transform = `scale(${mediaZoom + (1 - mediaZoom) * e})`;

      if (scrimRef.current) scrimRef.current.style.opacity = `${overlayScrim * e}`;

      if (titleRef.current) {
        const out = smoothstep(0.35, 0.85, p);
        titleRef.current.style.opacity = `${1 - out}`;
        titleRef.current.style.transform = `translate3d(0, ${-24 * out}px, 0)`;
      }

      if (hintRef.current) {
        const gone = smoothstep(0, 0.15, p);
        hintRef.current.style.opacity = `${1 - gone}`;
        hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
      }

      if (overlayRef.current) {
        const inn = smoothstep(0.65, 1, p);
        overlayRef.current.style.opacity = `${inn}`;
        overlayRef.current.style.transform = `translate3d(0, ${16 * (1 - inn)}px, 0)`;
        overlayRef.current.style.pointerEvents = inn > 0.7 ? 'auto' : 'none';
      }
    },
    [startWidth, startHeight, startRadius, endRadius, mediaZoom, overlayScrim]
  );

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      stageH = useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, scrollDistance) + Math.max(0, holdDistance))}px`;

      const w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.065, 24, 76)}px`);
    };

    const readProgress = () => {
      if (!enabled) return 1;
      const span = stageH * Math.max(0.01, scrollDistance);
      if (useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const k = smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      if (running) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (smoothing <= 0) {
        current = target;
        applyProgress(current);
        return;
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    applyProgress(readProgress());

    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });

    if (useWindowScroll) {
      window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    }
    window.addEventListener('resize', onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      if (useWindowScroll) window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [applyProgress, enabled, holdDistance, scrollDistance, smoothing, useWindowScroll]);

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full bg-white ${
        useWindowScroll
          ? ''
          : 'overflow-y-auto overflow-x-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
      } ${className}`.trim()}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', ...style }}
      {...rest}
    >
      <div ref={trackRef} className="relative w-full">
        <div ref={stageRef} className="sticky top-0 w-full overflow-hidden bg-white [--se-title-size:3.75rem]">
          <div
            ref={frameRef}
            className="absolute inset-0 [clip-path:inset(21%_28%_21%_28%_round_24px)] [will-change:clip-path] bg-zinc-950 overflow-hidden [filter:drop-shadow(0_20px_40px_rgba(0,0,0,0.16))]"
          >
            {mediaType === 'video' ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                className="absolute inset-0 w-full h-full object-cover origin-center select-none"
                src={src}
                poster={poster}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                ref={mediaRef as React.RefObject<HTMLImageElement>}
                className="absolute inset-0 w-full h-full object-cover origin-center select-none"
                src={src}
                alt={alt}
                draggable={false}
              />
            )}

            {/* Subtle base vignette to keep title legible */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/55 via-black/15 to-black/35" />

            {/* Expansion scrim */}
            <div
              ref={scrimRef}
              className="absolute inset-0 opacity-0 pointer-events-none bg-[linear-gradient(to_top,rgba(0,0,0,0.85),rgba(0,0,0,0.35)_50%,rgba(0,0,0,0.6))]"
            />

            {children && (
              <div
                ref={overlayRef}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-[6%] opacity-0 pointer-events-none z-20"
              >
                {children}
              </div>
            )}
          </div>

          {title && (
            <div
              ref={titleRef}
              className="absolute inset-0 flex items-center justify-center m-0 px-[6%] text-center font-medium leading-tight tracking-[-0.035em] text-white [font-size:var(--se-title-size)] [text-shadow:0_2px_30px_rgba(0,0,0,0.7)] pointer-events-none z-10 select-none"
            >
              {title}
            </div>
          )}

          {scrollHint && (
            <div
              ref={hintRef}
              className="absolute inset-x-0 bottom-6 sm:bottom-10 flex flex-col items-center justify-center gap-1.5 text-center pointer-events-none z-10 select-none"
            >
              <div className="px-4 py-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-medium shadow-xl flex items-center gap-2">
                <span>{scrollHint}</span>
                <svg className="w-3.5 h-3.5 text-zinc-300 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
