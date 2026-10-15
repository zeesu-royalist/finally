'use client';

import React, { useState } from 'react';
import {
  Film,
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

  const currentRatioObj = ASPECT_RATIOS.find((r) => r.ratio === aspectRatio) || ASPECT_RATIOS[0];

  return (
    <header className="h-10 border-b border-[#333333] bg-[#202020] px-3 flex items-center justify-between select-none relative z-30 shrink-0 text-xs">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[2px] bg-[#222227] border border-[#383842] flex items-center justify-center">
            <Film className="w-3 h-3 text-[#FFFFFF]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-[#F4F4F6] tracking-tight">
              finally
            </span>
            <span className="px-1 py-0.2 text-[9px] uppercase font-semibold tracking-wider rounded-[2px] bg-[#24242A] text-[#A0A0AA] border border-[#34343E]">
              Pro
            </span>
          </div>
        </div>

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
    </header>
  );
}
