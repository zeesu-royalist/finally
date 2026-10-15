'use client';

import React, { useState, useRef } from 'react';
import {
  Film,
  Type,
  Music,
  Sliders,
  UploadCloud,
  Plus,
  Sun,
  Contrast as ContrastIcon,
  Sparkles,
  Droplets,
  RotateCcw,
  Palette,
  RotateCw,
  Image as ImageIcon,
  Bell,
  CheckCheck,
  Zap,
  Loader2,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { generateSyntheticVideo, generateSyntheticAudio, generateSampleImage } from '../utils/sampleMedia';
import { FILTER_PRESETS, DEFAULT_ADJUSTMENTS } from '../utils/filterUtils';
import { VideoClip } from '../types/editor';

type ActiveTab = 'media' | 'images' | 'text' | 'audio' | 'filters';

const TABS: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; title: string }> = [
  { id: 'media', label: 'Media', icon: Film, title: 'Video & Media Bin' },
  { id: 'images', label: 'Images', icon: ImageIcon, title: 'Graphic Overlays' },
  { id: 'text', label: 'Titles', icon: Type, title: 'Titles & Lower Thirds' },
  { id: 'audio', label: 'Audio', icon: Music, title: 'Audio Library' },
  { id: 'filters', label: 'Color', icon: Sliders, title: 'Color Grading & Looks' },
];

interface AdjustmentControl {
  key: keyof VideoClip['adjustments'];
  label: string;
  min: number;
  max: number;
  step?: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADJUSTMENT_CONTROLS: AdjustmentControl[] = [
  { key: 'brightness', label: 'Exposure / Brightness', min: -100, max: 100, unit: '%', icon: Sun },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, unit: '%', icon: ContrastIcon },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, unit: '%', icon: Sparkles },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, unit: '%', icon: Sun },
  { key: 'blur', label: 'Soft Focus / Blur', min: 0, max: 15, step: 0.5, unit: 'px', icon: Droplets },
  { key: 'sepia', label: 'Warmth / Sepia', min: 0, max: 100, unit: '%', icon: Palette },
  { key: 'hueRotate', label: 'Tint Shift', min: -180, max: 180, unit: '°', icon: Palette },
  { key: 'grayscale', label: 'Monochrome', min: 0, max: 100, unit: '%', icon: ContrastIcon },
  { key: 'invert', label: 'Negative / Invert', min: 0, max: 100, unit: '%', icon: RotateCcw },
];

const TEXT_PRESETS = [
  {
    name: 'Standard Title',
    preset: { text: 'MAIN TITLE', fontSize: 44, fontFamily: 'Inter', color: '#ffffff', backgroundColor: 'transparent', isBold: true, shadowColor: 'rgba(0,0,0,0.8)', shadowBlur: 8 },
    previewClass: 'font-bold text-white text-xs tracking-wider',
  },
  {
    name: 'Cinematic Subtitle',
    preset: { text: 'The sequence begins here...', fontSize: 26, fontFamily: 'Inter', color: '#f3f4f6', backgroundColor: 'rgba(0,0,0,0.6)', isBold: false, isItalic: true, shadowColor: 'rgba(0,0,0,0.8)', shadowBlur: 6 },
    previewClass: 'italic text-[#E0E0E0] text-xs',
  },
  {
    name: 'Lower Third Callout',
    preset: { text: 'PRESENTER NAME • EDITOR', fontSize: 20, fontFamily: 'Inter', color: '#ffffff', backgroundColor: 'rgba(25,25,25,0.9)', isBold: true, shadowColor: 'transparent', shadowBlur: 0, y: 80 },
    previewClass: 'font-mono text-[10px] text-[#E0E0E0] uppercase tracking-wider',
  },
  {
    name: 'Editorial Tag',
    preset: { text: 'FEATURE HIGHLIGHT', fontSize: 30, fontFamily: 'Inter', color: '#ffffff', backgroundColor: 'rgba(30,30,36,0.95)', isBold: true, shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 8 },
    previewClass: 'font-medium text-white bg-[#222228] border border-[#383842] px-1.5 py-0.2 rounded-[1px] text-[10px]',
  },
];

const SAMPLE_MEDIA_CARDS = [
  { id: 'sunset' as const, name: 'Sunset Horizon', desc: 'Scenic landscape sequence', duration: 8 },
  { id: 'cyber' as const, name: 'Matrix Grid', desc: 'Abstract digital motion sequence', duration: 8 },
  { id: 'waves' as const, name: 'Ocean Waves', desc: 'Fluid particle wave sequence', duration: 8 },
];

const SAMPLE_AUDIO_CARDS = [
  { id: 'chill' as const, name: 'Ambient Chords', desc: 'Subtle atmospheric backing track', duration: 10 },
  { id: 'cinematic' as const, name: 'Cinematic Score', desc: 'Orchestral sustained pad', duration: 10 },
  { id: 'upbeat' as const, name: 'Rhythm Groove', desc: 'Melodic electronic progression', duration: 10 },
];

const SAMPLE_IMAGE_CARDS: Array<{
  id: 'subscribe' | 'verified' | 'cyber' | 'landscape';
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
    { id: 'subscribe', name: 'Lower Third Callout', desc: 'Action notification overlay', icon: Bell },
    { id: 'verified', name: 'Verified Stamp', desc: 'Authentication mark badge', icon: CheckCheck },
    { id: 'cyber', name: 'Graphic Element', desc: 'Stylized motion emblem', icon: Zap },
    { id: 'landscape', name: 'Still Photo Graphic', desc: 'Static photo image overlay', icon: ImageIcon },
  ];

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('media');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const {
    addVideoClip,
    addImageClip,
    addAudioClip,
    addTextClip,
    videoClips,
    selectedItem,
    setSelectedItem,
    activeVideoClip,
    updateVideoClip,
  } = useEditor();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/')) await addVideoClip(file);
      else if (file.type.startsWith('audio/')) await addAudioClip(file);
      else if (file.type.startsWith('image/')) await addImageClip(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) await handleFileUpload(e.dataTransfer.files);
  };

  const handleAddSampleVideo = async (sampleId: 'sunset' | 'cyber' | 'waves', name: string) => {
    setIsGenerating(sampleId);
    try {
      const res = await generateSyntheticVideo(sampleId, 8);
      await addVideoClip(res.url, name, res.duration);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAddSampleImage = async (sampleId: 'subscribe' | 'verified' | 'cyber' | 'landscape', name: string) => {
    setIsGenerating(sampleId);
    try {
      const url = await generateSampleImage(sampleId);
      await addImageClip(url, name);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAddSampleAudio = async (sampleId: 'chill' | 'cinematic' | 'upbeat', name: string) => {
    setIsGenerating(sampleId);
    try {
      const url = await generateSyntheticAudio(sampleId, 10);
      await addAudioClip(url, name, 10);
    } finally {
      setIsGenerating(null);
    }
  };

  const currentVideo =
    (selectedItem?.type === 'video' ? videoClips.find((c) => c.id === selectedItem.id) : null) ||
    activeVideoClip ||
    videoClips[0];

  return (
    <div className="w-80 border-r border-[#303030] bg-[#232323] flex flex-col select-none shrink-0 z-20">
      {/* Tab Navigation - Desktop NLE Tabs */}
      <div className="h-8 flex border-b border-[#303030] bg-[#1a1a1a] px-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-1 text-xs transition cursor-pointer border-b-2 ${isActive
                ? 'bg-[#1E1E24] text-white border-[#FFFFFF] font-medium'
                : 'text-[#8E8E93] hover:text-[#E4E4E7] hover:bg-[#18181C] border-transparent'
                }`}
              title={tab.title}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ================= MEDIA TAB ================= */}
        {activeTab === 'media' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-[2px] p-4 text-center cursor-pointer transition ${isDraggingOver
                ? 'border-[#FFFFFF] bg-[#222228]'
                : 'border-[#383842] hover:border-[#666672] bg-[#18181C]'
                }`}
            >
              <input ref={fileInputRef} type="file" multiple accept="video/*,audio/*,image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
              <div className="w-7 h-7 rounded-[2px] bg-[#232323] border border-[#333333] flex items-center justify-center mx-auto mb-1.5 text-[#8E8E8E]">
                <UploadCloud className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-medium text-[#E6E6E6]">Import Media Files</p>
              <p className="text-[10px] text-[#8E8E8E] mt-0.5">MP4, WebM, MOV, PNG, JPG, MP3, WAV</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider">Sample Media</span>
                <span className="text-[10px] text-[#686868]">Project Assets</span>
              </div>
              <div className="space-y-1.5">
                {SAMPLE_MEDIA_CARDS.map((item) => (
                  <div key={item.id} className="p-2 rounded-[2px] bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#383838] transition flex items-center justify-between group">
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-normal text-[#E6E6E6] truncate">{item.name}</div>
                      <div className="text-[10px] text-[#8E8E8E] truncate">{item.desc} • {item.duration}s</div>
                    </div>
                    <button
                      onClick={() => handleAddSampleVideo(item.id, item.name)}
                      disabled={isGenerating === item.id}
                      className="px-2 py-0.5 rounded-[2px] bg-[#262626] group-hover:bg-[#303030] text-[#CCCCCC] group-hover:text-white border border-[#353535] group-hover:border-[#444444] text-xs font-normal flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      {isGenerating === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#A0A0A0]" />
                      ) : (
                        <Plus className="w-3 h-3 text-[#8E8E8E]" />
                      )}
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= IMAGES & GRAPHICS TAB ================= */}
        {activeTab === 'images' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              onClick={() => imageInputRef.current?.click()}
              className={`border border-dashed rounded-[2px] p-4 text-center cursor-pointer transition ${isDraggingOver ? 'border-[#FFFFFF] bg-[#222228]' : 'border-[#383842] hover:border-[#666672] bg-[#18181C]'
                }`}
            >
              <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
              <div className="w-7 h-7 rounded-[2px] bg-[#232323] border border-[#333333] flex items-center justify-center mx-auto mb-1.5 text-[#8E8E8E]">
                <ImageIcon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-medium text-[#E6E6E6]">Import Image or Graphic</p>
              <p className="text-[10px] text-[#8E8E8E] mt-0.5">PNG, JPG, SVG, WebP with transparency</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider">Graphic Overlays</span>
                <span className="text-[10px] text-[#686868]">Presets</span>
              </div>
              <div className="space-y-1.5">
                {SAMPLE_IMAGE_CARDS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="p-2 rounded-[2px] bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#383838] transition flex items-center justify-between group">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className="w-6 h-6 rounded-[2px] bg-[#262626] border border-[#333333] flex items-center justify-center text-[#8E8E8E] shrink-0">
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-normal text-[#E6E6E6] truncate">{item.name}</div>
                          <div className="text-[10px] text-[#8E8E8E] truncate">{item.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddSampleImage(item.id, item.name)}
                        disabled={isGenerating === item.id}
                        className="px-2 py-0.5 rounded-[2px] bg-[#262626] group-hover:bg-[#303030] text-[#CCCCCC] group-hover:text-white border border-[#353535] group-hover:border-[#444444] text-xs font-normal flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        {isGenerating === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#A0A0A0]" />
                        ) : (
                          <Plus className="w-3 h-3 text-[#8E8E8E]" />
                        )}
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TEXT TAB ================= */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <button
              onClick={() => addTextClip()}
              className="w-full py-1.5 px-3 rounded-[2px] bg-[#222228] hover:bg-[#2A2A32] border border-[#383842] hover:border-[#666672] text-[#E4E4E7] text-xs font-normal flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#8E8E8E]" />
              <span>Add Title / Text Overlay</span>
            </button>

            <div>
              <div className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider mb-1.5">Title Style Presets</div>
              <div className="space-y-1.5">
                {TEXT_PRESETS.map((item) => (
                  <div key={item.name} className="p-2 rounded-[2px] bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#383838] transition flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-normal text-[#A0A0A0]">{item.name}</span>
                      <button
                        onClick={() => addTextClip(item.preset)}
                        className="px-2 py-0.5 rounded-[2px] bg-[#262626] hover:bg-[#303030] text-[#CCCCCC] hover:text-white border border-[#353535] text-[10px] font-normal flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5 text-[#8E8E8E]" />
                        <span>Insert</span>
                      </button>
                    </div>
                    <div className="h-8 rounded-[1px] bg-[#121212] border border-[#262626] flex items-center justify-center px-2 overflow-hidden">
                      <span className={item.previewClass}>{item.preset.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= AUDIO TAB ================= */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <button
              onClick={() => audioInputRef.current?.click()}
              className="w-full py-1.5 px-3 rounded-[2px] bg-[#262626] hover:bg-[#303030] border border-[#383838] text-xs font-normal text-[#E6E6E6] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#8E8E8E]" />
              <span>Import Audio File</span>
            </button>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider">Audio Tracks</span>
                <span className="text-[10px] text-[#686868]">Library</span>
              </div>
              <div className="space-y-1.5">
                {SAMPLE_AUDIO_CARDS.map((item) => (
                  <div key={item.id} className="p-2 rounded-[2px] bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#383838] transition flex items-center justify-between group">
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-normal text-[#E6E6E6] truncate">{item.name}</div>
                      <div className="text-[10px] text-[#8E8E8E] truncate">{item.desc} • {item.duration}s</div>
                    </div>
                    <button
                      onClick={() => handleAddSampleAudio(item.id, item.name)}
                      disabled={isGenerating === item.id}
                      className="px-2 py-0.5 rounded-[2px] bg-[#262626] group-hover:bg-[#303030] text-[#CCCCCC] group-hover:text-white border border-[#353535] group-hover:border-[#444444] text-xs font-normal flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      {isGenerating === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#A0A0A0]" />
                      ) : (
                        <Plus className="w-3 h-3 text-[#8E8E8E]" />
                      )}
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= FILTERS TAB (COLOR GRADING) ================= */}
        {activeTab === 'filters' && (
          <div className="space-y-3">
            {currentVideo ? (
              <>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-[2px] bg-[#1c1c1c] border border-[#2d2d2d] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <Palette className="w-3.5 h-3.5 text-[#8E8E8E] shrink-0" />
                      <span className="text-xs font-normal text-[#E6E6E6] truncate">{currentVideo.name}</span>
                    </div>
                    <span className="text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.2 rounded-[1px] bg-[#222228] text-[#D4D4D8] border border-[#383842]">
                      {currentVideo.adjustments.filter !== 'none' ? currentVideo.adjustments.filter : 'Normal'}
                    </span>
                  </div>

                  {videoClips.length > 1 && (
                    <div className="flex items-center gap-2 px-0.5">
                      <span className="text-[10px] text-[#8E8E8E] font-normal shrink-0">Target Clip:</span>
                      <select
                        value={currentVideo.id}
                        onChange={(e) => setSelectedItem({ type: 'video', id: e.target.value })}
                        className="bg-[#161616] text-[#E6E6E6] text-xs border border-[#303030] rounded-[2px] px-2 py-0.5 outline-none flex-1 truncate cursor-pointer hover:border-[#3c3c3c] transition"
                      >
                        {videoClips.map((c, i) => (
                          <option key={c.id} value={c.id}>
                            #{i + 1} {c.name} ({c.adjustments.filter !== 'none' ? c.adjustments.filter : 'Normal'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider">Look / Color Presets</span>
                    <span className="text-[10px] text-[#686868] font-mono">{FILTER_PRESETS.length} Styles</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {FILTER_PRESETS.map((p) => {
                      const isActive = (currentVideo.adjustments.filter || 'none') === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedItem({ type: 'video', id: currentVideo.id });
                            updateVideoClip(currentVideo.id, {
                              adjustments: {
                                ...DEFAULT_ADJUSTMENTS,
                                ...p.adjustments,
                                opacity: currentVideo.adjustments.opacity ?? 100,
                                rotation: currentVideo.adjustments.rotation || 0,
                                filter: p.id,
                              },
                            });
                          }}
                          className={`p-2 rounded-[2px] text-left border text-xs transition cursor-pointer relative overflow-hidden ${isActive
                            ? 'border-[#FFFFFF] bg-[#222228] text-white shadow-sm'
                            : 'border-[#2d2d2d] bg-[#1c1c1c] text-[#A0A0A0] hover:text-[#E6E6E6] hover:border-[#383838]'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-2 h-2 rounded-[1px] shrink-0" style={{ background: p.swatchGradient }} />
                              <span className="font-normal text-xs truncate">{p.name}</span>
                            </div>
                            <span className="text-[8px] px-1 py-0.2 rounded-[1px] bg-[#141414] text-[#8E8E8E] font-mono shrink-0 ml-1">
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#686868] mt-0.5 line-clamp-1">{p.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#303030] pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E8E]">Adjustments</span>
                    <button
                      onClick={() => {
                        updateVideoClip(currentVideo.id, {
                          adjustments: {
                            ...DEFAULT_ADJUSTMENTS,
                            opacity: currentVideo.adjustments.opacity ?? 100,
                            rotation: currentVideo.adjustments.rotation || 0,
                          },
                        });
                      }}
                      className="text-[10px] text-[#8E8E8E] hover:text-[#E6E6E6] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {ADJUSTMENT_CONTROLS.map((ctrl) => {
                    const Icon = ctrl.icon;
                    const val = Number(currentVideo.adjustments[ctrl.key] ?? 0);
                    return (
                      <div key={ctrl.key} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Icon className="w-3 h-3 text-[#8E8E8E]" /> {ctrl.label}
                          </span>
                          <span className="font-mono text-[10px] text-[#E6E6E6]">{val}{ctrl.unit}</span>
                        </div>
                        <input
                          type="range"
                          min={ctrl.min}
                          max={ctrl.max}
                          step={ctrl.step || 1}
                          value={val}
                          onChange={(e) =>
                            updateVideoClip(currentVideo.id, {
                              adjustments: {
                                ...currentVideo.adjustments,
                                [ctrl.key]: ctrl.step ? parseFloat(e.target.value) : parseInt(e.target.value, 10),
                              },
                            })
                          }
                          className="w-full cursor-pointer"
                        />
                      </div>
                    );
                  })}

                  <div className="space-y-1 pt-1.5 border-t border-[#303030]">
                    <label className="text-[11px] text-[#A0A0A0] flex items-center gap-1.5">
                      <RotateCw className="w-3 h-3 text-[#8E8E8E]" /> Rotation Angle
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          onClick={() => updateVideoClip(currentVideo.id, { adjustments: { ...currentVideo.adjustments, rotation: deg } })}
                          className={`py-0.5 rounded-[2px] text-xs font-mono transition cursor-pointer border ${(currentVideo.adjustments.rotation || 0) === deg
                            ? 'bg-white border-white text-[#0D0D10] font-semibold'
                            : 'bg-[#1c1c1c] border-[#2d2d2d] text-[#A0A0A0] hover:text-white'
                            }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-[2px] bg-[#1c1c1c] border border-[#2d2d2d] text-center text-xs text-[#686868]">
                Select a video clip in the timeline to adjust colors
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
