'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Undo2,
  Redo2,
  Download,
  Smartphone,
  Monitor,
  Square,
  Check,
  SplitSquareVertical,
  Maximize2,
  FilePlus2,
  Loader2,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { AspectRatio } from '../types/editor';

const ASPECT_RATIOS: { label: string; ratio: AspectRatio; icon: React.ReactNode; desc: string }[] = [
  { label: '16:9', ratio: '16:9', icon: <Monitor className="w-3.5 h-3.5" />, desc: 'YouTube / Widescreen' },
  { label: '9:16', ratio: '9:16', icon: <Smartphone className="w-3.5 h-3.5" />, desc: 'TikTok / Reels / Shorts' },
  { label: '1:1', ratio: '1:1', icon: <Square className="w-3.5 h-3.5" />, desc: 'Square Post' },
  { label: '4:5', ratio: '4:5', icon: <SplitSquareVertical className="w-3.5 h-3.5" />, desc: 'Portrait' },
  { label: '21:9', ratio: '21:9', icon: <Maximize2 className="w-3.5 h-3.5" />, desc: 'Cinematic Ultrawide' },
];

/* Stylist "Zr" Studio Monogram Icon Component */
function ZrLogo({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const isMd = size === 'md';
  return (
    <div
      className={`${isMd ? 'w-6 h-6 rounded-[5px]' : 'w-5 h-5 rounded-[4px]'
        } bg-gradient-to-br from-[#2D2E3E] via-[#1A1B24] to-[#0E0F14] border border-[#484A60] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_3px_rgba(0,0,0,0.6)] shrink-0 select-none relative overflow-hidden group cursor-pointer hover:border-[#646682] transition-colors`}
      title="Zr Studio"
    >
      {/* Specular sheen highlight reflection */}
      <div
        className={`absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/16 to-transparent pointer-events-none ${isMd ? 'rounded-t-[4px]' : 'rounded-t-[3px]'
          }`}
      />

      {/* Stylized "Zr" Monogram */}
      <div className="flex items-baseline relative z-10 leading-none select-none">
        <span
          className={`font-black ${isMd ? 'text-[12px]' : 'text-[11px]'
            } tracking-tight bg-gradient-to-b from-white via-[#F5F5FA] to-[#B0B2C8] bg-clip-text text-transparent font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]`}
        >
          Z
        </span>
        <span
          className={`font-bold ${isMd ? 'text-[9.5px]' : 'text-[8.5px]'
            } -ml-[0.5px] bg-gradient-to-b from-[#E2E4F2] via-[#C4C6DC] to-[#8A8CA6] bg-clip-text text-transparent font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]`}
        >
          r
        </span>
      </div>
    </div>
  );
}

export default function Header() {
  const {
    projectTitle,
    setProjectTitle,
    aspectRatio,
    setAspectRatio,
    canUndo,
    canRedo,
    undo,
    redo,
    saveStatus,
    createNewProject,
    openExportModal,
  } = useEditor();

  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileNewProjectConfirm, setMobileNewProjectConfirm] = useState(false);

  const currentRatioObj = ASPECT_RATIOS.find((r) => r.ratio === aspectRatio) || ASPECT_RATIOS[0];

  return (
    <header className="h-10 border-b border-[#333333] bg-[#202020] px-2.5 sm:px-3 flex items-center justify-between select-none relative z-30 shrink-0 text-xs">
      {/* ================= DESKTOP VIEW (EXACTLY UNCHANGED) ================= */}
      <div className="hidden md:flex items-center justify-between w-full h-full">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/home"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
            title="Go to Home"
          >
            <ZrLogo size="sm" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-[#F4F4F6] tracking-tight group-hover:text-white transition-colors">
                finally
              </span>
              <span className="px-1 py-0.2 text-[9px] uppercase font-semibold tracking-wider rounded-[2px] bg-[#24242A] text-[#A0A0AA] border border-[#34343E]">
                Pro
              </span>
            </div>
          </Link>

          <div className="h-3.5 w-px bg-[#333333] mx-1" />

          {/* Project Name editable */}
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-[#181818] hover:bg-[#1a1a1a] focus:bg-[#161616] text-xs font-normal text-[#E6E6E6] px-2 py-0.5 rounded-[2px] border border-[#333333] focus:border-[#FFFFFF] outline-none transition max-w-[170px] truncate"
            title="Click to rename project"
          />

          {/* Auto-Save Persistence Status Badge */}
          {saveStatus === 'saving' && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#1a1a1a] border border-[#303030] text-[#A0A0A0] text-[10px] font-medium"
              title="Auto-saving project state & media to local storage..."
            >
              <Loader2 className="w-2.5 h-2.5 animate-spin text-[#8E8E8E]" />
              <span className="hidden md:inline">Saving</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#181f19] border border-[#253828] text-[10px] font-medium"
              title="All edits safely stored in browser IndexedDB. Safe to refresh!"
            >
              <Check className="w-2.5 h-2.5 text-emerald-500" />
              <span className="hidden md:inline text-[#A0A0A0]">Auto-saved</span>
            </div>
          )}
        </div>

        {/* Center Tools: Undo/Redo & Aspect Ratio */}
        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <div className="flex items-center bg-[#252526] rounded-[2px] border border-[#333333]">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z / ⌘Z)"
              className="p-1 text-[#A0A0A0] hover:text-[#E6E6E6] disabled:opacity-30 disabled:hover:text-[#A0A0A0] hover:bg-[#2d2d2e] transition rounded-[2px] cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <div className="h-3 w-px bg-[#333333]" />
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y / ⌘⇧Z)"
              className="p-1 text-[#A0A0A0] hover:text-[#E6E6E6] disabled:opacity-30 disabled:hover:text-[#A0A0A0] hover:bg-[#2d2d2e] transition rounded-[2px] cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="relative">
            <button
              onClick={() => setIsRatioOpen(!isRatioOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] border border-[#333333] text-xs font-normal text-[#E6E6E6] transition cursor-pointer"
            >
              {currentRatioObj.icon}
              <span>{currentRatioObj.label}</span>
            </button>

            {isRatioOpen && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-44 bg-[#252526] border border-[#3e3e3e] rounded-[3px] shadow-2xl p-1 z-50">
                <div className="text-[9px] font-semibold text-[#777777] uppercase tracking-wider px-2 py-0.5">
                  Aspect Ratio
                </div>
                {ASPECT_RATIOS.map((item) => (
                  <button
                    key={item.ratio}
                    onClick={() => {
                      setAspectRatio(item.ratio);
                      setIsRatioOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-[2px] text-xs transition cursor-pointer ${aspectRatio === item.ratio
                      ? 'bg-[#2A2A32] text-[#FFFFFF] font-medium'
                      : 'text-[#A0A0A0] hover:bg-[#2d2d2e] hover:text-[#E6E6E6]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {aspectRatio === item.ratio && <Check className="w-3 h-3 text-[#FFFFFF]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: New Project & Export Video */}
        <div className="flex items-center gap-1.5">
          {/* New Project Button with confirmation */}
          <div className="relative">
            <button
              onClick={() => setShowNewProjectConfirm(!showNewProjectConfirm)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] border border-[#333333] text-xs font-normal text-[#A0A0A0] hover:text-[#E6E6E6] transition cursor-pointer"
              title="Start fresh with a new project"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Project</span>
            </button>

            {showNewProjectConfirm && (
              <div className="absolute top-full mt-1.5 right-0 w-60 bg-[#252526] border border-[#3e3e3e] rounded-[3px] shadow-2xl p-3 z-50">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Start New Project?</span>
                </div>
                <p className="text-[11px] text-[#A0A0A0] mb-2.5 leading-relaxed">
                  All timeline clips, uploaded files, and edits will be cleared.
                </p>
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => setShowNewProjectConfirm(false)}
                    className="px-2 py-0.5 text-xs rounded-[2px] bg-[#202020] hover:bg-[#2a2a2a] text-[#A0A0A0] border border-[#333333] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowNewProjectConfirm(false);
                      await createNewProject();
                    }}
                    className="px-2 py-0.5 text-xs rounded-[2px] bg-rose-700 hover:bg-rose-600 text-white font-medium transition cursor-pointer"
                  >
                    Clear & Start
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={openExportModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-white hover:bg-[#EDEDF0] active:bg-[#DCDCE0] text-[#0D0D10] text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0D0D10]" />
            <span>Export Video</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE VIEW (SLICK, COMPACT & TOUCH-FRIENDLY) ================= */}
      <div className="flex md:hidden items-center justify-between w-full h-full gap-2">
        {/* Left: Brand + Project Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Link
            href="/home"
            className="flex items-center gap-1.5 shrink-0 hover:opacity-85 transition-opacity cursor-pointer"
            title="Go to Home"
          >
            <ZrLogo size="md" />
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-[#F4F4F6] tracking-tight">finally</span>
              <span className="px-1 py-0.2 text-[8px] uppercase font-bold rounded-[2px] bg-[#24242A] text-[#A0A0AA] border border-[#34343E]">
                Pro
              </span>
            </div>
          </Link>
          <span className="text-[10px] text-[#8E8E93] truncate max-w-[110px]" title={projectTitle}>
            {projectTitle}
          </span>
        </div>

        {/* Right: Undo/Redo + Export + Hamburger */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Undo / Redo */}
          <div className="flex items-center bg-[#252526] rounded-[2px] border border-[#333333]">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              className="p-1.5 text-[#A0A0A0] hover:text-[#E6E6E6] disabled:opacity-25 transition active:scale-90"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <div className="h-3 w-px bg-[#333333]" />
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              className="p-1.5 text-[#A0A0A0] hover:text-[#E6E6E6] disabled:opacity-25 transition active:scale-90"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={openExportModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-white active:bg-[#E4E4E8] text-[#0D0D10] text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3 h-3 text-[#0D0D10]" />
            <span>Export</span>
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-[2px] bg-[#252526] active:bg-[#303030] border border-[#333333] text-[#A0A0A0] hover:text-white transition cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU DRAWER / MODAL ================= */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-200"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setMobileNewProjectConfirm(false);
          }}
        >
          <div
            className="w-full bg-[#1e1e24] border-t border-[#383842] rounded-t-xl p-4 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl pb-12 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Title and Close Button */}
            <div className="flex items-center justify-between border-b border-[#2d2d36] pb-2.5">
              <div className="flex items-center gap-2">
                <ZrLogo size="md" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Project Settings</h3>
                  <p className="text-[10px] text-[#8E8E93]">Configuration & workspace controls</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-[2px] text-[#8E8E93] hover:text-white bg-[#25252d] border border-[#383842]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent Quick Export Action at Top */}
            <div className="p-3 rounded-[3px] bg-[#252530] border border-[#3e3e50] flex items-center justify-between gap-3 shadow-sm">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">Export Video</span>
                </div>
                <p className="text-[10px] text-[#8E8E93] truncate">Render sequence to MP4 / WebM</p>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openExportModal();
                }}
                className="px-3.5 py-1.5 rounded-[2px] bg-white text-[#0D0D10] text-xs font-bold active:bg-[#EDEDF0] shrink-0 shadow-sm transition cursor-pointer"
              >
                Export Now
              </button>
            </div>

            {/* Project Title Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Project Title
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full bg-[#151518] border border-[#33333d] focus:border-white rounded-[3px] px-3 py-2 text-xs text-[#E6E6E6] outline-none"
                placeholder="Enter project name..."
              />
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Aspect Ratio
                </label>
                <span className="text-[10px] font-mono text-[#D4D4D8]">{currentRatioObj.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {ASPECT_RATIOS.map((item) => {
                  const isActive = aspectRatio === item.ratio;
                  return (
                    <button
                      key={item.ratio}
                      onClick={() => {
                        setAspectRatio(item.ratio);
                      }}
                      className={`p-2 rounded-[3px] border text-left transition flex items-center justify-between ${isActive
                          ? 'border-white bg-[#2A2A35] text-white shadow-sm'
                          : 'border-[#2d2d36] bg-[#16161a] text-[#A0A0AA] hover:text-white'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <div>
                          <div className="text-xs font-medium">{item.label}</div>
                          <div className="text-[9px] text-[#71717A] truncate">{item.desc}</div>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-Save Status */}
            <div className="p-2.5 rounded-[3px] bg-[#151518] border border-[#2d2d36] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#8E8E93]">Project Persistence</span>
              {saveStatus === 'saving' ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[#A0A0AA]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving to IndexedDB...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <Check className="w-3 h-3" />
                  <span>Auto-saved locally</span>
                </div>
              )}
            </div>

            {/* New Project Section */}
            <div className="pt-2 border-t border-[#2d2d36]">
              {!mobileNewProjectConfirm ? (
                <button
                  onClick={() => setMobileNewProjectConfirm(true)}
                  className="w-full py-2 px-3 rounded-[3px] bg-[#22222a] hover:bg-[#282834] border border-[#353542] text-xs font-normal text-rose-300 flex items-center justify-center gap-2 transition"
                >
                  <FilePlus2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Start New Project</span>
                </button>
              ) : (
                <div className="p-3 rounded-[3px] bg-[#2c1d1d] border border-rose-800/80 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Clear all clips and start fresh?</span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 leading-relaxed">
                    All timeline tracks, media files, and edits will be removed.
                  </p>
                  <div className="flex items-center gap-2 justify-end pt-1">
                    <button
                      onClick={() => setMobileNewProjectConfirm(false)}
                      className="px-3 py-1 text-xs rounded-[2px] bg-[#1f1616] text-[#A0A0AA] border border-[#3d2929]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setMobileNewProjectConfirm(false);
                        setIsMobileMenuOpen(false);
                        await createNewProject();
                      }}
                      className="px-3 py-1 text-xs rounded-[2px] bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                    >
                      Clear & Start
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Export from menu */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                openExportModal();
              }}
              className="w-full py-2.5 rounded-[3px] bg-white active:bg-[#EDEDF0] text-[#0D0D10] text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-[#0D0D10]" />
              <span>Export High-Resolution Video</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

