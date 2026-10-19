'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const svgCls = 'w-8 h-8 sm:w-10 sm:h-10 text-zinc-800 stroke-current fill-none transition-transform duration-300 group-hover:scale-110';

const FEATURES = [
  {
    title: 'Custom Video\nTemplates',
    icon: (
      <svg viewBox="0 0 24 24" className={svgCls} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" /><path d="M3 10h18M11 10v11" />
      </svg>
    ),
  },
  {
    title: 'Multi-Track\nVideo Layers',
    icon: (
      <svg viewBox="0 0 24 24" className={svgCls} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5l4 4m0-4L5 9" /><circle cx="17" cy="7" r="2.5" /><rect x="5" y="15" width="4" height="4" rx="0.5" /><path d="M17 14.5l2.6 4.5h-5.2z" />
      </svg>
    ),
  },
  {
    title: 'Cloud-Powered\nFast Rendering',
    icon: (
      <svg viewBox="0 0 24 24" className={svgCls} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" /><path d="M3 11h18M10 11v10" />
      </svg>
    ),
  },
  {
    title: 'Collaborative\nTeam Workspaces',
    icon: (
      <svg viewBox="0 0 24 24" className={svgCls} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /><circle cx="12" cy="16" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'AI Auto-Subtitles\n& Voice Dubbing',
    icon: (
      <svg viewBox="0 0 24 24" className={svgCls} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="4" /><path d="M7 11h4M13 11h4M7 14h6" />
      </svg>
    ),
  },
  {
    title: 'Ultra-HD 4K\n60FPS Exports',
    icon: <span className="font-mono font-bold text-xl sm:text-2xl text-zinc-800 transition-transform duration-300 group-hover:scale-110 select-none">4K</span>,
  },
];

export default function EnterpriseScale() {
  const ref = useRef<HTMLElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setShow(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="enterprise" ref={ref} className="relative w-full bg-white text-zinc-950 py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-12 border-t border-zinc-100 selection:bg-cyan-500/20 overflow-hidden">
      <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-14 lg:gap-20">
        {/* Left: 6 Icon Cards */}
        <div className="w-full lg:w-[48%] flex justify-center lg:justify-start order-2 lg:order-1">
          <div className="grid grid-cols-3 gap-5 sm:gap-8 max-w-[480px] sm:max-w-[540px]">
            {FEATURES.map((item, i) => (
              <div
                key={i}
                style={{ transitionDelay: `${i * 80 + 100}ms` }}
                className={`flex flex-col items-center group transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-[26px] sm:rounded-[32px] bg-[#f4f4f5] border border-zinc-200/70 shadow-xs flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lg group-hover:shadow-black/5 group-hover:bg-[#ececee] group-hover:border-zinc-300/80 cursor-pointer select-none">
                  {item.icon}
                </div>
                <span className="text-[11px] sm:text-xs text-zinc-500 font-normal text-center leading-snug mt-3 whitespace-pre-line select-none transition-colors duration-200 group-hover:text-zinc-900">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Typography & CTA */}
        <div className={`w-full lg:w-[48%] flex flex-col select-none transition-all duration-700 ease-out order-1 lg:order-2 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="font-mono text-xs sm:text-[13px] text-zinc-400 font-normal tracking-[0.04em] mb-4">Enterprise Studio</span>
          <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-medium tracking-[-0.035em] text-zinc-950 leading-[1.08] max-w-xl">
            For creators who demand speed
          </h2>
          <p className="mt-6 text-base sm:text-lg text-zinc-500 font-normal leading-relaxed max-w-lg">
            Give your production workflow an instant upgrade. finally brings timeline editing, smart audio sync, and cloud rendering together in one powerhouse suite, so you can produce viral videos without lag.
          </p>
          <div className="mt-9">
            <Link href="/" className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#f0f0f2] hover:bg-[#e4e4e7] text-zinc-900 text-sm font-medium transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 group cursor-pointer">
              <span>Launch Video Studio</span>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
