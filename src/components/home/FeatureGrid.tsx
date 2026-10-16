'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Pause,
  Music,
  Bookmark,
  Save,
  Plus,
  MoveHorizontal,
} from 'lucide-react';

export default function FeatureGrid() {
  const [activeMediaTab, setActiveMediaTab] = useState<'Videos' | 'Images' | 'Audio'>('Videos');
  const [rotation1, setRotation1] = useState(73);
  const [rotation2, setRotation2] = useState(38);
  const [tilt, setTilt] = useState(73);

  return (
    <section className="relative w-full bg-white text-zinc-900 pt-24 sm:pt-32 pb-28 sm:pb-36 px-4 sm:px-6 lg:px-12 border-t border-zinc-100 selection:bg-cyan-500/20">
      <div className="max-w-[1360px] mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="flex flex-col">
            <span className="font-mono text-xs sm:text-[13px] text-zinc-400 font-normal tracking-[0.02em] mb-3 select-none">
              Explore features
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-[3.4rem] font-medium tracking-[-0.035em] text-zinc-950 leading-[1.1]">
              Your new all-in-one video editor.
            </h2>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#f0f0f2] hover:bg-[#e4e4e7] text-zinc-800 text-sm font-medium transition-all duration-200 self-start md:self-auto shadow-xs active:scale-95 group cursor-pointer select-none"
          >
            <span>View All Features</span>
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* ============================================================== */}
          {/* Card 1: Import (Dark) */}
          {/* ============================================================== */}
          <div className="flex flex-col group">
            {/* Visual Box */}
            <div className="relative w-full h-[390px] sm:h-[410px] rounded-[28px] bg-[#000000] overflow-hidden flex items-center justify-center p-4 border border-zinc-900/60 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/15 select-none">
              {/* Top-left Image (Lush Green Hills) */}
              <div className="absolute -top-3 -left-3 w-28 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-0 transition-transform duration-500 group-hover:scale-105">
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80"
                  alt="Grassy hills"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Right Vertical Image (Glowing Ethereal Butterfly) */}
              <div className="absolute top-10 -right-4 w-28 h-48 rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-0 bg-[#0a1128] flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                {/* Ethereal glowing butterfly SVG illustration */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-cyan-400/30 via-indigo-950/60 to-black" />
                  <svg viewBox="0 0 100 120" className="w-24 h-auto drop-shadow-[0_0_15px_rgba(56,189,248,0.7)]">
                    <defs>
                      <linearGradient id="wingGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.5" />
                      </linearGradient>
                      <linearGradient id="wingGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.5" />
                      </linearGradient>
                      <filter id="softGlow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Left Upper Wing */}
                    <path
                      d="M50 55 C35 25, 10 15, 8 38 C6 60, 32 68, 50 62 Z"
                      fill="url(#wingGrad1)"
                      filter="url(#softGlow)"
                    />
                    {/* Right Upper Wing */}
                    <path
                      d="M50 55 C65 25, 90 15, 92 38 C94 60, 68 68, 50 62 Z"
                      fill="url(#wingGrad2)"
                      filter="url(#softGlow)"
                    />
                    {/* Left Lower Wing */}
                    <path
                      d="M50 62 C32 68, 14 80, 22 96 C28 106, 46 88, 50 72 Z"
                      fill="url(#wingGrad1)"
                      opacity="0.85"
                    />
                    {/* Right Lower Wing */}
                    <path
                      d="M50 62 C68 68, 86 80, 78 96 C72 106, 54 88, 50 72 Z"
                      fill="url(#wingGrad2)"
                      opacity="0.85"
                    />
                    {/* Butterfly Body */}
                    <line x1="50" y1="36" x2="50" y2="78" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Antennae */}
                    <path d="M50 36 Q42 22 36 24" fill="none" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M50 36 Q58 22 64 24" fill="none" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Bottom-left Image (Green Mountain Landscape) */}
              <div className="absolute -bottom-6 left-6 w-32 h-36 rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-0 transition-transform duration-500 group-hover:scale-105">
                <img
                  src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&auto=format&fit=crop&q=80"
                  alt="Green mountain"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Center 3D Yellow Modern Chair Card */}
              <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-white shadow-2xl flex items-center justify-center p-1.5 z-10 border border-white/40 transition-transform duration-300 group-hover:scale-110">
                <svg viewBox="0 0 54 54" className="w-12 h-12 drop-shadow-md">
                  {/* Subtle ground shadow */}
                  <ellipse cx="27" cy="46" rx="16" ry="4" fill="rgba(0,0,0,0.18)" />
                  {/* Pegged wooden legs */}
                  <line x1="17" y1="36" x2="13" y2="47" stroke="#b45309" strokeWidth="2.8" strokeLinecap="round" />
                  <line x1="37" y1="36" x2="41" y2="47" stroke="#b45309" strokeWidth="2.8" strokeLinecap="round" />
                  <line x1="22" y1="36" x2="20" y2="46" stroke="#78350f" strokeWidth="2.4" strokeLinecap="round" />
                  <line x1="32" y1="36" x2="34" y2="46" stroke="#78350f" strokeWidth="2.4" strokeLinecap="round" />
                  {/* Seat Cushion Base */}
                  <rect x="13" y="30" width="28" height="9" rx="4.5" fill="#eab308" />
                  <rect x="14" y="29" width="26" height="5" rx="2.5" fill="#facc15" />
                  {/* Curved 3D Armchair Shell */}
                  <path
                    d="M13 32 C11 31, 10 20, 15 14 C19 9, 35 9, 39 14 C44 20, 43 31, 41 32"
                    fill="#ca8a04"
                  />
                  <path
                    d="M16 29 C14 24, 15 16, 20 13 C24 10, 30 10, 34 13 C39 16, 40 24, 38 29 Z"
                    fill="#facc15"
                  />
                  {/* Bright Specular Light */}
                  <ellipse cx="27" cy="18" rx="7" ry="4" fill="#fef08a" opacity="0.75" />
                </svg>
              </div>

              {/* Floating Pill Switcher Toolbar */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-[#161619]/90 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-2xl flex items-center gap-0.5">
                {(['Videos', 'Images', 'Audio'] as const).map((tab) => {
                  const isActive = activeMediaTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveMediaTab(tab)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer ${isActive
                        ? 'bg-[#2a2a30] text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-4 flex flex-col">
              <h3 className="text-xl font-medium tracking-[-0.02em] text-zinc-950">
                Import
              </h3>
              <p className="mt-1 text-sm text-zinc-500 font-normal leading-relaxed">
                Drop in photos, videos, audio, and assets from anywhere, instantly.
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* Card 2: Edit (Light) */}
          {/* ============================================================== */}
          <div className="flex flex-col group">
            {/* Visual Box */}
            <div className="relative w-full h-[390px] sm:h-[410px] rounded-[28px] bg-[#ededed] overflow-hidden flex items-center justify-center p-3 sm:p-4 border border-zinc-200/90 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-zinc-300/40 select-none">
              {/* Floating Dark Timeline UI Panel */}
              <div className="w-[96%] bg-[#151518] rounded-2xl border border-white/10 shadow-2xl p-3 flex flex-col gap-2.5 transition-transform duration-300 group-hover:scale-[1.02]">
                {/* Header Timecode & Controls */}
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-zinc-800/90 flex items-center justify-center text-zinc-300 shadow-xs">
                      <Pause className="w-3 h-3 fill-current" />
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400 tracking-tight font-medium">
                      00:01.25 / 00:12
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-white/5 text-[10px] text-zinc-300 font-mono">
                    <span className="text-zinc-400">Dur</span>
                    <span className="font-semibold text-white">5s</span>
                    <span className="text-zinc-400">sec</span>
                  </div>
                </div>

                {/* Timeline Ruler */}
                <div className="relative w-full h-3.5 flex items-center text-[9px] font-mono text-zinc-400 select-none px-1">
                  <span>0s</span>
                  <div className="flex-1 flex justify-evenly items-center opacity-40 px-2">
                    <div className="w-px h-1 bg-zinc-600" />
                    <div className="w-px h-1.5 bg-zinc-600" />
                    <div className="w-px h-1 bg-zinc-600" />
                  </div>
                  <span>1s</span>
                  <div className="flex-1 flex justify-evenly items-center opacity-40 px-2">
                    <div className="w-px h-1 bg-zinc-600" />
                    <div className="w-px h-1.5 bg-zinc-600" />
                    <div className="w-px h-1 bg-zinc-600" />
                  </div>
                </div>

                {/* Track 1: Text Clip */}
                <div className="w-full bg-[#202026] rounded-xl px-2.5 py-1.5 flex items-center gap-2 border border-white/5 shadow-xs">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800/90 flex items-center justify-center text-zinc-300 font-semibold text-[11px]">
                    T
                  </div>
                  <span className="text-xs font-medium text-white tracking-tight">
                    Up to 40% Off
                  </span>
                </div>

                {/* Track 2: 3D Carousel (Indented Clip) */}
                <div className="ml-14 bg-[#26262e] rounded-xl px-2.5 py-1.5 flex items-center gap-2 border border-white/10 shadow-xs">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800/90 flex items-center justify-center text-zinc-300">
                    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="1.8">
                      <rect x="3" y="3" width="14" height="14" rx="2" />
                      <circle cx="7" cy="7" r="1" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-zinc-100 tracking-tight">
                    3D Carousel
                  </span>
                </div>

                {/* Track 3: Audio Clip */}
                <div className="ml-8 bg-[#1a1a20] rounded-xl px-2.5 py-1.5 flex items-center gap-2 border border-white/5 shadow-xs">
                  <div className="w-6 h-6 rounded-lg bg-zinc-800/90 flex items-center justify-center text-zinc-300">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-normal text-zinc-300 tracking-tight truncate">
                    Honey on the Wind
                  </span>
                </div>

                {/* Track 4: Filmstrip Strip */}
                <div className="w-full h-8 rounded-lg overflow-hidden bg-zinc-900 border border-white/5 flex items-center shadow-inner mt-0.5">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="relative h-full flex-1 border-r border-black/50 overflow-hidden last:border-r-0"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                        alt="Film frame"
                        className="w-full h-full object-cover brightness-90 contrast-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-4 flex flex-col">
              <h3 className="text-xl font-medium tracking-[-0.02em] text-zinc-950">
                Edit
              </h3>
              <p className="mt-1 text-sm text-zinc-500 font-normal leading-relaxed">
                Powerful timeline editing with speed controls, voiceovers, and built-in stock libraries.
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* Card 3: Enhance (Dark) */}
          {/* ============================================================== */}
          <div className="flex flex-col group">
            {/* Visual Box */}
            <div className="relative w-full h-[390px] sm:h-[410px] rounded-[28px] bg-[#000000] overflow-hidden flex items-center justify-center p-3 sm:p-4 border border-zinc-900/60 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/15 select-none">
              {/* Dark Properties / Inspector Modal */}
              <div className="w-[96%] bg-[#141417] rounded-2xl border border-white/10 shadow-2xl p-3 flex flex-col gap-2.5 transition-transform duration-300 group-hover:scale-[1.02]">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white tracking-tight">
                      3D Carousel
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Select up to 20 assets
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400">
                    <Bookmark className="w-3.5 h-3.5 hover:text-white transition-colors cursor-pointer" />
                    <Save className="w-3.5 h-3.5 hover:text-white transition-colors cursor-pointer" />
                  </div>
                </div>

                {/* 2x3 Asset Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Slot 1: Add item */}
                  <div className="aspect-square rounded-lg bg-zinc-900/90 border border-dashed border-zinc-700/80 flex items-center justify-center text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" />
                  </div>

                  {/* Slot 2: Orange tulip / flower asset */}
                  <div className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-zinc-900">
                    <img
                      src="https://images.unsplash.com/photo-1520763185298-1b434c919102?w=200&auto=format&fit=crop&q=80"
                      alt="Tulip asset"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Slot 3: White flower / art asset */}
                  <div className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-zinc-900">
                    <img
                      src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80"
                      alt="Floral asset"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Slot 4: Amber red swirl / marble texture */}
                  <div className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-zinc-900">
                    <img
                      src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&auto=format&fit=crop&q=80"
                      alt="Abstract texture"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Slot 5: Water ripple swirl */}
                  <div className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-zinc-900">
                    <img
                      src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&auto=format&fit=crop&q=80"
                      alt="Water ripple texture"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Slot 6: Green hills landscape */}
                  <div className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-zinc-900">
                    <img
                      src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&auto=format&fit=crop&q=80"
                      alt="Landscape texture"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Pill Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  <button
                    type="button"
                    className="py-1 px-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-white/5 transition-colors cursor-pointer text-center"
                  >
                    Manage
                  </button>
                  <button
                    type="button"
                    className="py-1 px-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-white/5 transition-colors cursor-pointer text-center"
                  >
                    Remove BG
                  </button>
                </div>

                {/* Sliders / Split Property Rows matching original layout */}
                <div className="flex flex-col gap-1.5 mt-1">
                  {/* Row 1: Rotation (73/100) */}
                  <div className="h-9 rounded-xl bg-zinc-900/90 border border-white/5 flex items-center overflow-hidden">
                    <div className="w-1/2 h-full bg-[#1e1e24] px-2.5 flex flex-col justify-center">
                      <span className="text-[9.5px] text-zinc-400 leading-tight">Rotation</span>
                      <span className="text-[11px] font-medium text-zinc-200 leading-tight">
                        {rotation1}
                        <span className="text-zinc-500 font-normal">/100</span>
                      </span>
                    </div>
                    <div className="w-1/2 h-full bg-[#18181d] px-2.5 flex items-center justify-between text-zinc-400">
                      <MoveHorizontal className="w-3.5 h-3.5 text-zinc-400 cursor-ew-resize hover:text-white" />
                      {/* Keyframe solid diamond */}
                      <span className="w-2.5 h-2.5 rotate-45 bg-zinc-300 border border-white inline-block shadow-xs" />
                    </div>
                  </div>

                  {/* Row 2: Rotation (38/100) */}
                  <div className="h-9 rounded-xl bg-zinc-900/90 border border-white/5 flex items-center overflow-hidden">
                    <div className="w-1/2 h-full bg-[#1e1e24] px-2.5 flex flex-col justify-center">
                      <span className="text-[9.5px] text-zinc-400 leading-tight">Rotation</span>
                      <span className="text-[11px] font-medium text-zinc-200 leading-tight">
                        {rotation2}
                        <span className="text-zinc-500 font-normal">/100</span>
                      </span>
                    </div>
                    <div className="w-1/2 h-full bg-[#18181d] px-2.5 flex items-center justify-end text-zinc-400">
                      {/* Keyframe hollow diamond */}
                      <span className="w-2.5 h-2.5 rotate-45 border border-zinc-500 inline-block" />
                    </div>
                  </div>

                  {/* Row 3: Tilt (73/100) */}
                  <div className="h-9 rounded-xl bg-zinc-900/90 border border-white/5 flex items-center overflow-hidden">
                    <div className="w-1/2 h-full bg-[#1e1e24] px-2.5 flex flex-col justify-center">
                      <span className="text-[9.5px] text-zinc-400 leading-tight">Tilt</span>
                      <span className="text-[11px] font-medium text-zinc-200 leading-tight">
                        {tilt}
                        <span className="text-zinc-500 font-normal">/100</span>
                      </span>
                    </div>
                    <div className="w-1/2 h-full bg-[#18181d] px-2.5 flex items-center justify-end text-zinc-400">
                      {/* Keyframe hollow diamond */}
                      <span className="w-2.5 h-2.5 rotate-45 border border-zinc-500 inline-block" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-4 flex flex-col">
              <h3 className="text-xl font-medium tracking-[-0.02em] text-zinc-950">
                Enhance
              </h3>
              <p className="mt-1 text-sm text-zinc-500 font-normal leading-relaxed">
                Layer animations, effects, and shaders to elevate every frame.
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* Card 4: Ship (Light) */}
          {/* ============================================================== */}
          <div className="flex flex-col group">
            {/* Visual Box */}
            <div className="relative w-full h-[390px] sm:h-[410px] rounded-[28px] bg-[#ededed] overflow-hidden flex items-center justify-center border border-zinc-200/90 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-zinc-300/40 select-none">
              <video
                src="https://res.cloudinary.com/buttercreatives/video/upload/q_75/v1/website/home/feature_cards/ship_zy7btv.mp4?_a=DATAiZAAZAA0"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Title & Description */}
            <div className="mt-4 flex flex-col">
              <h3 className="text-xl font-medium tracking-[-0.02em] text-zinc-950">
                Ship
              </h3>
              <p className="mt-1 text-sm text-zinc-500 font-normal leading-relaxed">
                Collaborate in real time and export in up to 60fps, including Image, Video, GIF & ProRes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

