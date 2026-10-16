'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Features', href: '#features' },
  { label: '3D Showcase', href: '#interactive-model' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const leftPillRef = useRef<HTMLDivElement>(null);

  // 1. Scroll listener (supports window & nested containers)
  useEffect(() => {
    const handleScroll = (e?: Event) => {
      let scrollPos = 0;
      if (e?.target && e.target !== document && e.target !== window) {
        scrollPos = (e.target as HTMLElement).scrollTop || 0;
      } else {
        scrollPos =
          window.scrollY ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0;
      }

      if (scrollPos > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  // 2. Click outside listener to collapse menu
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (leftPillRef.current && !leftPillRef.current.contains(target)) {
        setIsExpanded(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  // On laptop/desktop (sm: and up): visible at top (!isScrolled) OR when dot is clicked (isExpanded)
  const isDesktopMenuVisible = !isScrolled || isExpanded;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300 px-4 sm:px-6 lg:px-12 pt-3 sm:pt-6">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between">

        {/* ================= LEFT PILL: Brand Logo + Menu Dot ================= */}
        <div ref={leftPillRef} className="relative pointer-events-auto">
          <div
            className="flex items-center h-[46px] sm:h-[50px] bg-[#f0f0f3] hover:bg-[#f5f5f7] text-zinc-900 border border-black/[0.06] shadow-md shadow-black/5 rounded-2xl transition-all duration-300 ease-out px-3 sm:px-4"
          >
            {/* Brand Logo - On desktop links to /home, on mobile clicking toggles dropdown */}
            <div
              onClick={(e) => {
                if (typeof window !== 'undefined' && window.innerWidth < 640) {
                  handleToggleExpand(e);
                }
              }}
              className="flex items-center gap-1 select-none pr-1 cursor-pointer sm:cursor-default"
              title="finally."
            >
              <Link
                href="/home"
                onClick={(e) => {
                  if (typeof window !== 'undefined' && window.innerWidth < 640) {
                    e.preventDefault();
                  }
                }}
              >
                <span className="font-black text-xl sm:text-2xl tracking-tight text-zinc-900 italic font-serif leading-none">
                  finally<span className="text-black not-italic text-sm">.</span>
                </span>
              </Link>
            </div>

            {/* Laptop/Desktop Only: Expandable Horizontal Inline Links (100% UNTOUCHED) */}
            <div
              className={`hidden sm:flex items-center transition-all duration-300 ease-out overflow-hidden ${isDesktopMenuVisible
                ? 'max-w-[480px] opacity-100 pl-3 sm:pl-4 border-l border-zinc-300/80'
                : 'max-w-0 opacity-0 pl-0 border-l-0'
                }`}
            >
              <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-zinc-700 whitespace-nowrap">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="hover:text-black transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Two-Dot Menu Toggle Button */}
            <button
              onClick={handleToggleExpand}
              type="button"
              id="navbar-toggle-btn"
              aria-label="Toggle navigation menu"
              className="ml-2 sm:ml-2.5 p-1 rounded-lg hover:bg-black/[0.08] text-zinc-800 transition-all active:scale-90 flex flex-col items-center justify-center gap-[3px] w-7 h-7 cursor-pointer"
              title={isExpanded ? 'Collapse menu' : 'Expand menu'}
            >
              <span
                className={`w-[3.5px] h-[3.5px] rounded-full bg-zinc-900 transition-all duration-200 ${isExpanded ? 'scale-125 bg-cyan-600' : ''
                  }`}
              />
              <span
                className={`w-[3.5px] h-[3.5px] rounded-full bg-zinc-900 transition-all duration-200 ${isExpanded ? 'scale-125 bg-cyan-600' : ''
                  }`}
              />
            </button>
          </div>

          {/* ================= Mobile Only: Gorgeous Dropdown Menu underneath (Opens on dot click) ================= */}
          {isExpanded && (
            <div
              id="mobile-dropdown-menu"
              className="sm:hidden absolute top-[calc(100%+8px)] left-0 w-[210px] bg-[#f0f0f3] text-zinc-900 border border-black/10 shadow-2xl shadow-black/20 rounded-2xl p-2.5 z-50 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150"
            >
              <nav className="flex flex-col gap-1 text-sm font-semibold text-zinc-800">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsExpanded(false)}
                    className="px-3 py-2 rounded-xl hover:bg-black/[0.06] active:bg-black/15 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* ================= RIGHT PILL: Login + Try for free ================= */}
        <div className="pointer-events-auto flex items-center h-[46px] sm:h-[50px] gap-1.5 sm:gap-2.5 bg-[#f0f0f3] hover:bg-[#f5f5f7] border border-black/[0.06] shadow-md shadow-black/5 rounded-2xl pl-3 sm:pl-4 pr-1 sm:pr-1.5 transition-all duration-300 ease-out">
          {/* Login Link */}
          <Link
            href="/"
            className="px-1.5 sm:px-2 text-xs sm:text-sm font-medium text-zinc-800 hover:text-black transition-colors whitespace-nowrap"
          >
            Login
          </Link>

          {/* Try for free Pill Button */}
          <Link
            href="/"
            className="h-[34px] sm:h-[38px] inline-flex items-center justify-center px-3 sm:px-4 rounded-xl bg-[#1c1c1f] hover:bg-black text-white text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            Try for free
          </Link>
        </div>

      </div>
    </header>
  );
}
