'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/navbar/Navbar';
import Hero from '../../components/home/Hero';
import BrandStatement from '../../components/home/BrandStatement';
import ScrollExpand from '../../components/home/ScrollExpand';
import FeatureGrid from '../../components/home/FeatureGrid';
import CreativeToolkit from '../../components/home/CreativeToolkit';
import EnterpriseScale from '../../components/home/EnterpriseScale';
import Footer from '../../components/footer/Footer';

export default function HomePage() {
  return (
    <div
      className="relative min-h-screen w-full overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white text-zinc-900 selection:bg-cyan-500/30 selection:text-cyan-900 scroll-smooth"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* Butter-Style Floating Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="w-full flex flex-col">
        {/* Full-Screen Hero Section (Pure 3D Model) */}
        <Hero />

        {/* Brand Statement & Partner Cloud Section */}
        <BrandStatement />

        {/* Section Header leading into Scroll Expand */}
        <section className="relative w-full bg-white pt-16 sm:pt-24 pb-8 sm:pb-12 text-center px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-medium tracking-wide uppercase mb-4 shadow-xs">
              Interactive Canvas
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-[-0.035em] text-zinc-950 leading-[1.12]">
              Expand your creative horizon
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-600 max-w-xl font-normal leading-relaxed">
              Scroll down to watch the canvas open up seamlessly into a full-bleed cinematic production stage.
            </p>
          </div>
        </section>

        {/* Scroll Expand Showcase Section */}
        <section className="relative w-full bg-white">
          <ScrollExpand
            src="/hero.jpg"
            alt="Product hero"
            title="Built to scale"
            scrollHint="Scroll inside the frame"
            useWindowScroll
            startWidth={44}
            startHeight={58}
            startRadius={24}
            endRadius={0}
            mediaZoom={1.35}
            scrollDistance={1.2}
            holdDistance={0.35}
            smoothing={0.1}
            overlayScrim={0.5}
            enabled
          >
            <div className="flex flex-col items-center justify-center max-w-3xl mx-auto px-6 text-center select-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-medium tracking-wide uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Next-Gen Canvas Engine
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.035em] text-white leading-[1.08] drop-shadow-md">
                Every pixel, everywhere
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/85 max-w-xl font-normal leading-relaxed drop-shadow">
                The frame opens up as you scroll and hands the whole stage to your media.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  className="h-11 sm:h-12 px-7 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-sm flex items-center transition-all shadow-lg shadow-black/25 active:scale-95 cursor-pointer"
                >
                  Open Video Editor
                </Link>
                <a
                  href="#workflow"
                  className="h-11 sm:h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-medium text-sm flex items-center transition-all active:scale-95 cursor-pointer"
                >
                  Learn More
                </a>
              </div>
            </div>
          </ScrollExpand>
        </section>

        {/* Explore Features Showcase Grid */}
        <FeatureGrid />

        {/* Horizontal Creative Toolkit Showcase */}
        <CreativeToolkit />

        {/* Enterprise Scale Section */}
        <EnterpriseScale />

        {/* Global Design Studio Footer */}
        <Footer />
      </main>
    </div>
  );
}

