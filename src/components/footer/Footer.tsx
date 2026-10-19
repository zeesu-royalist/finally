'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    // Check if window or scrollable container should be scrolled
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const marqueeText = 'finally video studio®';

  return (
    <footer className="relative w-full h-screen min-h-[600px] max-h-screen bg-[#09090b] text-white overflow-hidden select-none border-t border-zinc-800/80 flex flex-col justify-between">
      {/* 1. Top Section: Solid Studio Accent Line + Centered Statement + 4 Clean Columns */}
      <div className="w-full flex flex-col shrink-0">
        {/* Subtle Solid Accent Line */}
        <div className="w-full h-[2px] bg-[#6e6e76]" />

        {/* Top Header & Navigation Columns Section */}
        <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-7 sm:pt-9 pb-6 sm:pb-7">
          {/* Centered Top Line: Natural, human studio statement */}
          <div className="w-full text-center mb-6 sm:mb-8">
            <p className="text-sm sm:text-[15px] !text-black font-normal tracking-wide select-none">
              ་
            </p>
          </div>

          {/* 4-Column Layout: Pure, Clean Typographic Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 items-center">
            {/* Column 1 */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <Link
                href="/"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Video Studio
              </Link>
              <a
                href="#features"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Features
              </a>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <a
                href="#workflow"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Timeline
              </a>
              <a
                href="#enterprise"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Enterprise
              </a>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Instagram
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Twitter / X
              </a>
            </div>

            {/* Column 4: Right-Aligned Direct Studio Contact */}
            <div className="flex flex-col justify-center md:items-end col-span-2 md:col-span-1">
              <a
                href="mailto:support@finallyvideo.com"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight cursor-pointer"
              >
                support@finallyvideo.com
              </a>
            </div>
          </div>
        </div>

        {/* Subtle Dotted Horizontal Divider */}
        <div className="w-full border-b border-dotted border-zinc-800" />
      </div>

      {/* 2. Middle Section: Giant Marquee + Spec Stamp */}
      <div className="w-full flex-1 flex flex-col justify-center items-center py-2 overflow-hidden pointer-events-none select-none">
        {/* Giant Infinite Marquee Wordmark (Continuous Left to Right, never pauses on hover) */}
        <div className="relative w-full overflow-hidden py-1 sm:py-2 bg-transparent pointer-events-none">
          <style>{`
            @keyframes marqueeLeftToRight {
              0% { transform: translate3d(-50%, 0, 0); }
              100% { transform: translate3d(0%, 0, 0); }
            }
            .marquee-track-ltr,
            .marquee-track-ltr:hover,
            .marquee-track-ltr:focus,
            .marquee-track-ltr:active {
              display: flex;
              width: max-content;
              animation: marqueeLeftToRight 22s linear infinite !important;
              animation-play-state: running !important;
              will-change: transform;
            }
          `}</style>

          <div className="marquee-track-ltr flex items-center whitespace-nowrap pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-6 sm:gap-12 mx-3 sm:mx-6 shrink-0"
              >
                <span className="text-6xl sm:text-8xl md:text-[9.5rem] lg:text-[11rem] xl:text-[12rem] font-bold tracking-[-0.04em] text-[#8e8e97] leading-none select-none font-sans">
                  {marqueeText}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Specification Stamp Section */}
        <div className="w-full flex flex-col items-center justify-center mt-3 sm:mt-5 px-4 text-center select-none shrink-0 pointer-events-auto">
          <span className="text-xs sm:text-sm text-zinc-400 font-sans tracking-wide">
            Engineered for
          </span>
          <span className="text-xs sm:text-sm font-bold text-white tracking-widest mt-0.5">
            4K 60FPS EDITING
          </span>

          {/* Video Tool Icons Cluster */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 my-2 text-zinc-300">
            {/* Symbol 1: Filmstrip Reel */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="3" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
              <line x1="17" y1="17" x2="22" y2="17" />
            </svg>

            {/* Symbol 2: Trimming Scissors */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>

            {/* Symbol 3: Audio Waveform */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" strokeWidth="1.6" strokeLinecap="round">
              <line x1="3" y1="12" x2="3" y2="12.01" />
              <line x1="7" y1="8" x2="7" y2="16" />
              <line x1="11" y1="5" x2="11" y2="19" />
              <line x1="15" y1="9" x2="15" y2="15" />
              <line x1="19" y1="11" x2="19" y2="13" />
            </svg>

            {/* Symbol 4: Viewport Screen */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <polygon points="10 8 16 10 10 12" fill="currentColor" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>

            {/* Symbol 5: 4K UHD badge */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" strokeWidth="1.6">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="monospace">
                4K
              </text>
            </svg>
          </div>

          {/* Engine Specifications Lines */}
          <span className="text-[11px] sm:text-xs text-zinc-400 tracking-wider uppercase">
            POWERED BY
          </span>
          <span className="text-[11px] sm:text-xs text-zinc-300 font-bold tracking-widest uppercase mt-0.5">
            - Zeesu Royalist -
          </span>
          <span className="text-[11px] sm:text-xs text-zinc-200 font-bold tracking-widest uppercase mt-0.5">
            BROWSER RENDERING ENGINE
          </span>
        </div>
      </div>

      {/* 3. Bottom Bar: Location, Copyright, Back to Top */}
      <div className="shrink-0 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-zinc-500 font-sans border-t border-zinc-900/80">
        <div>Zeesu Royalist ꨄ︎</div>

        <div>© 2026 finally. All Rights Reserved.</div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
