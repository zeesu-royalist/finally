'use client';

import React from 'react';
import { ArrowUp, Scan } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    // Check if window or scrollable container should be scrolled
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const marqueeText = 'aperios design®';

  return (
    <footer className="relative w-full h-screen min-h-[600px] max-h-screen bg-[#09090b] text-white overflow-hidden select-none border-t border-zinc-800/80 flex flex-col justify-between">
      {/* 1. Top Section: Solid Studio Accent Line + Centered Statement + 4 Clean Columns */}
      <div className="w-full flex flex-col shrink-0">
        {/* Subtle Solid Accent Line */}
        <div className="w-full h-[2px] bg-[#6e6e76]" />

        {/* Top Header & Navigation Columns Section */}
        <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-12 lg:px-16 pt-7 sm:pt-9 pb-6 sm:pb-7">
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
              <a
                href="#work"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Work
              </a>
              <a
                href="#studio"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Studio
              </a>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <a
                href="#archive"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Archive
              </a>
              <a
                href="#journal"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight w-fit cursor-pointer"
              >
                Journal
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
                href="mailto:studio@aperios-design.co.uk"
                className="text-base sm:text-lg text-zinc-300 hover:text-white transition-colors duration-200 font-sans tracking-tight cursor-pointer"
              >
                studio@aperios-design.co.uk
              </a>
            </div>
          </div>
        </div>

        {/* Subtle Dotted Horizontal Divider */}
        <div className="w-full border-b border-dotted border-zinc-800" />
      </div>

      {/* 2. Middle Section: Giant Marquee + Garment Care Stamp */}
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

        {/* Center Care Label / Garment Stamp Section */}
        <div className="w-full flex flex-col items-center justify-center mt-3 sm:mt-5 px-4 text-center select-none shrink-0 pointer-events-auto">
          <span className="text-xs sm:text-sm text-zinc-400 font-sans tracking-wide">
            Handled with
          </span>
          <span className="text-xs sm:text-sm font-bold text-white tracking-widest mt-0.5">
            100% CARE
          </span>

          {/* Laundry Care Icons Cluster */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 my-2 text-zinc-300">
            {/* Symbol 1: Circle with A (Dry clean) */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <text x="12" y="15.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">
                A
              </text>
            </svg>

            {/* Symbol 2: Wash Tub 30° */}
            <svg viewBox="0 0 28 24" className="w-5 h-4 sm:w-6 sm:h-5 stroke-current fill-none" strokeWidth="1.6">
              <path d="M4 8l2.5 12h15l2.5-12z" strokeLinejoin="round" />
              <path d="M4 11c3 1 5-1 8 0s5 1 8 0 3-1 4 0" />
              <text x="14" y="18" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">
                30°
              </text>
            </svg>

            {/* Symbol 3: Iron with dot */}
            <svg viewBox="0 0 26 24" className="w-5 h-4 sm:w-6 sm:h-5 stroke-current fill-none" strokeWidth="1.6">
              <path d="M4 17h18l-3-8H8c-4 0-4 8-4 8z" strokeLinejoin="round" />
              <path d="M8 9V6h10" />
              <circle cx="13" cy="14" r="1" fill="currentColor" />
            </svg>

            {/* Symbol 4: Garment / T-Shirt */}
            <svg viewBox="0 0 26 24" className="w-5 h-4 sm:w-6 sm:h-5 stroke-current fill-none" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M8 4l-5 4 3 4 2-1v8h10v-8l2 1 3-4-5-4c-2 2-6 2-8 0z" />
            </svg>

            {/* Symbol 5: Circle with A (Dry clean) */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <text x="12" y="15.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">
                A
              </text>
            </svg>
          </div>

          {/* Manufacturing Location Lines */}
          <span className="text-[11px] sm:text-xs text-zinc-400 tracking-wider uppercase">
            Designed and
          </span>
          <span className="text-[11px] sm:text-xs text-zinc-300 font-bold tracking-widest uppercase mt-0.5">
            MANUFACTURED IN
          </span>
          <span className="text-[11px] sm:text-xs text-zinc-200 font-bold tracking-widest uppercase mt-0.5">
            CAMBRIDGE, UK
          </span>
        </div>
      </div>

      {/* 3. Bottom Bar: Location, Copyright, Back to Top */}
      <div className="shrink-0 max-w-[1440px] w-full mx-auto px-6 sm:px-12 lg:px-16 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-zinc-500 font-sans border-t border-zinc-900/80">
        <div>Cambridge, UK</div>

        <div>©2026 Aperios Design. All Rights Reserved.</div>

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
