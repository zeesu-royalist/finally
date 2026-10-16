'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Film,
  Type,
  Music,
  Eye,
  Volume2,
  VolumeX,
  Undo2,
  Redo2,
  Image as ImageIcon,
  AudioWaveform,
  Mic,
  Gauge,
  RotateCw,
  Palette,
  Crosshair,
  Scaling,
  ChevronDown,
  Flag,
  X,
  Check,
  Monitor,
  Smartphone,
  Square,
  SplitSquareVertical,
  Maximize2,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { FILTER_PRESETS, DEFAULT_ADJUSTMENTS } from '../utils/filterUtils';

const BASE_PIXELS_PER_SECOND = 50;

function TimelineClipBlock({
  startTime,
  duration,
  pxPerSec,
  isSelected,
  bgClass,
  borderClass,
  isCompact = false,
  onMouseDown,
  onTouchStart,
  onTrimMouseDown,
  onTrimTouchStart,
  onSelect,
  children,
}: {
  startTime: number;
  duration: number;
  pxPerSec: number;
  isSelected: boolean;
  bgClass: string;
  borderClass: string;
  isCompact?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTrimMouseDown: (e: React.MouseEvent, edge: 'start' | 'end') => void;
  onTrimTouchStart?: (e: React.TouchEvent, edge: 'start' | 'end') => void;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const left = startTime * pxPerSec;
  const width = Math.max(20, duration * pxPerSec);

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ left: `${left}px`, width: `${width}px` }}
      className={`absolute ${isCompact ? 'top-0.5 bottom-0.5 rounded-[2px] px-1.5' : 'top-1 bottom-1 rounded-[2px] px-2'} ${bgClass} ${borderClass} cursor-grab active:cursor-grabbing flex items-center justify-between overflow-hidden transition-all ${isSelected ? 'ring-1 ring-white brightness-125 z-20' : 'hover:brightness-105 z-10'
        }`}
    >
      <div
        onMouseDown={(e) => onTrimMouseDown(e, 'start')}
        onTouchStart={(e) => onTrimTouchStart?.(e, 'start')}
        className={`absolute left-0 top-0 bottom-0 ${isCompact ? 'w-1.5 sm:w-1 hover:w-2' : 'w-2 sm:w-1.5 hover:w-2.5'} bg-white/20 hover:bg-white/60 cursor-ew-resize transition-all z-10`}
        title="Trim start"
      />
      {children}
      <div
        onMouseDown={(e) => onTrimMouseDown(e, 'end')}
        onTouchStart={(e) => onTrimTouchStart?.(e, 'end')}
        className={`absolute right-0 top-0 bottom-0 ${isCompact ? 'w-1.5 sm:w-1 hover:w-2' : 'w-2 sm:w-1.5 hover:w-2.5'} bg-white/20 hover:bg-white/60 cursor-ew-resize transition-all z-10`}
        title="Trim end"
      />
    </div>
  );
}

export default function Timeline() {
  const {
    currentTime,
    totalDuration,
    seekTo,
    isPlaying,
    togglePlay,
    timelineZoom,
    setTimelineZoom,
    videoClips,
    imageClips,
    audioClips,
    textClips,
    selectedItem,
    setSelectedItem,
    deleteSelectedItem,
    splitClipAtPlayhead,
    extractAudioFromVideo,
    moveClip,
    trimClip,
    activeVideoClip,
    undo,
    redo,
    canUndo,
    canRedo,
    updateVideoClip,
    updateImageClip,
    updateAudioClip,
    updateVideoSpeed,
    updateAudioSpeed,
    addImageClip,
    addAudioClip,
    addTextClip,
    aspectRatio,
    setAspectRatio,
  } = useEditor();

  const rulerRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const headersScrollRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const toolbarImageInputRef = useRef<HTMLInputElement>(null);
  const toolbarAudioInputRef = useRef<HTMLInputElement>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const updateWidth = () => {
      if (tracksScrollRef.current) {
        setContainerWidth(tracksScrollRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && tracksScrollRef.current) {
      observer = new ResizeObserver(updateWidth);
      observer.observe(tracksScrollRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateWidth);
      observer?.disconnect();
    };
  }, []);

  const pxPerSec = BASE_PIXELS_PER_SECOND * timelineZoom;
  const timelineContentWidth = Math.max(containerWidth, (totalDuration + 8) * pxPerSec);

  const [activePopover, setActivePopover] = useState<'speed' | 'filter' | 'ratio' | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);

  const handleOpenSpeed = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverAnchor({ x: rect.left, y: rect.top });
    setActivePopover((prev) => (prev === 'speed' ? null : 'speed'));
  };

  const handleOpenFilter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverAnchor({ x: rect.left, y: rect.top });
    setActivePopover((prev) => (prev === 'filter' ? null : 'filter'));
  };

  const handleOpenRatio = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverAnchor({ x: rect.left, y: rect.top });
    setActivePopover((prev) => (prev === 'ratio' ? null : 'ratio'));
  };

  const handleTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headersScrollRef.current) {
      headersScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingClip, setDraggingClip] = useState<{
    type: 'video' | 'image' | 'text' | 'audio';
    id: string;
    startX: number;
    initialStartTime: number;
  } | null>(null);

  const [trimmingClip, setTrimmingClip] = useState<{
    type: 'video' | 'image' | 'text' | 'audio';
    id: string;
    edge: 'start' | 'end';
    startX: number;
  } | null>(null);

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    setIsScrubbing(true);
    const rect = rulerRef.current.getBoundingClientRect();
    const scrollLeft = tracksScrollRef.current ? tracksScrollRef.current.scrollLeft : 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    seekTo(Math.max(0, clickX / pxPerSec));
  };

  const handleRulerTouchStart = (e: React.TouchEvent) => {
    if (!rulerRef.current || e.touches.length === 0) return;
    setIsScrubbing(true);
    const touch = e.touches[0];
    const rect = rulerRef.current.getBoundingClientRect();
    const scrollLeft = tracksScrollRef.current ? tracksScrollRef.current.scrollLeft : 0;
    const clickX = touch.clientX - rect.left + scrollLeft;
    seekTo(Math.max(0, clickX / pxPerSec));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing && rulerRef.current) {
        const rect = rulerRef.current.getBoundingClientRect();
        const scrollLeft = tracksScrollRef.current ? tracksScrollRef.current.scrollLeft : 0;
        const clickX = e.clientX - rect.left + scrollLeft;
        seekTo(Math.max(0, clickX / pxPerSec));
      } else if (draggingClip) {
        const deltaSec = (e.clientX - draggingClip.startX) / pxPerSec;
        moveClip(draggingClip.type, draggingClip.id, Math.max(0, draggingClip.initialStartTime + deltaSec));
      } else if (trimmingClip) {
        const deltaSec = (e.clientX - trimmingClip.startX) / pxPerSec;
        if (Math.abs(deltaSec) > 0.05) {
          trimClip(trimmingClip.type, trimmingClip.id, trimmingClip.edge, deltaSec);
          setTrimmingClip((prev) => (prev ? { ...prev, startX: e.clientX } : null));
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      if (isScrubbing && rulerRef.current) {
        const rect = rulerRef.current.getBoundingClientRect();
        const scrollLeft = tracksScrollRef.current ? tracksScrollRef.current.scrollLeft : 0;
        const clickX = touch.clientX - rect.left + scrollLeft;
        seekTo(Math.max(0, clickX / pxPerSec));
      } else if (draggingClip) {
        const deltaSec = (touch.clientX - draggingClip.startX) / pxPerSec;
        moveClip(draggingClip.type, draggingClip.id, Math.max(0, draggingClip.initialStartTime + deltaSec));
      } else if (trimmingClip) {
        const deltaSec = (touch.clientX - trimmingClip.startX) / pxPerSec;
        if (Math.abs(deltaSec) > 0.05) {
          trimClip(trimmingClip.type, trimmingClip.id, trimmingClip.edge, deltaSec);
          setTrimmingClip((prev) => (prev ? { ...prev, startX: touch.clientX } : null));
        }
      }
    };

    const handleDragEnd = () => {
      setIsScrubbing(false);
      setDraggingClip(null);
      setTrimmingClip(null);
    };

    if (isScrubbing || draggingClip || trimmingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isScrubbing, draggingClip, trimmingClip, pxPerSec, seekTo, moveClip, trimClip]);

  const tickInterval = timelineZoom >= 1.5 ? 1 : timelineZoom < 0.8 ? 5 : 2;
  const maxTime = Math.max(totalDuration + 8, containerWidth > 0 ? containerWidth / pxPerSec : 24);
  const numTicks = Math.ceil(maxTime + 2);
  const ticks = [];
  for (let s = 0; s <= numTicks; s += tickInterval) ticks.push(s);

  const playheadX = currentTime * pxPerSec;

  const videoAudioClips = audioClips.filter((c) => c.trackType === 'video-audio');
  const musicAudioClips = audioClips.filter((c) => c.trackType !== 'video-audio');
  const hasVideoAudioTrack = videoAudioClips.length > 0;

  interface TrackHeaderItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    isAudio?: boolean;
    isCompact?: boolean;
  }

  const TRACK_HEADERS: TrackHeaderItem[] = [
    { label: 'T1 Text', icon: Type, color: 'text-[#8E8E8E]', isCompact: true },
    { label: 'V2 Graphics', icon: ImageIcon, color: 'text-[#8E8E8E]' },
    { label: 'V1 Video', icon: Film, color: 'text-[#8E8E8E]' },
    ...(hasVideoAudioTrack
      ? [{ label: 'A1 Extracted', icon: AudioWaveform, color: 'text-[#8E8E8E]', isAudio: true, isCompact: true }]
      : []),
    { label: 'A2 Music', icon: Music, color: 'text-[#8E8E8E]', isAudio: true, isCompact: true },
  ];

  // Helpers for toolbar actions
  const targetVideo =
    (selectedItem?.type === 'video' ? videoClips.find((c) => c.id === selectedItem.id) : null) ||
    activeVideoClip ||
    videoClips[0];

  const targetImage =
    (selectedItem?.type === 'image' ? imageClips.find((c) => c.id === selectedItem.id) : null) ||
    imageClips[0];

  const targetAudio =
    (selectedItem?.type === 'audio' ? audioClips.find((c) => c.id === selectedItem.id) : null) ||
    audioClips[0];

  const targetSpeedClip =
    selectedItem?.type === 'audio'
      ? { type: 'audio' as const, clip: targetAudio }
      : { type: 'video' as const, clip: targetVideo };
  const currentSpeed = targetSpeedClip.clip?.speed ?? 1;

  const handleSpeedChange = (speedVal: number) => {
    if (targetSpeedClip.type === 'audio' && targetSpeedClip.clip) {
      updateAudioSpeed(targetSpeedClip.clip.id, speedVal);
    } else if (targetVideo) {
      updateVideoSpeed(targetVideo.id, speedVal);
    }
  };

  const handleRotate90 = () => {
    if (selectedItem?.type === 'image' && targetImage) {
      const nextRot = ((targetImage.rotation || 0) + 90) % 360;
      updateImageClip(targetImage.id, { rotation: nextRot });
    } else if (targetVideo) {
      const nextRot = ((targetVideo.adjustments.rotation || 0) + 90) % 360;
      updateVideoClip(targetVideo.id, {
        adjustments: { ...targetVideo.adjustments, rotation: nextRot },
      });
    } else if (targetImage) {
      const nextRot = ((targetImage.rotation || 0) + 90) % 360;
      updateImageClip(targetImage.id, { rotation: nextRot });
    }
  };

  const currentRotation =
    selectedItem?.type === 'image'
      ? targetImage?.rotation || 0
      : targetVideo?.adjustments.rotation || 0;

  const handleCenterImage = () => {
    if (targetImage) {
      updateImageClip(targetImage.id, { x: 50, y: 50 });
    }
  };

  const handleScaleImageCycle = () => {
    if (!targetImage) return;
    const cur = Math.round(targetImage.width || 50);
    const presets = [25, 50, 75, 100, 125];
    const next = presets.find((p) => p > cur) || presets[0];
    updateImageClip(targetImage.id, { width: next });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await addImageClip(files[i]);
    }
    e.target.value = '';
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await addAudioClip(files[i]);
    }
    e.target.value = '';
  };

  const handleAddText = () => {
    addTextClip({
      text: 'TEXT TITLE',
      startTime: currentTime,
      duration: 4,
      fontSize: 36,
      fontFamily: 'Inter',
      color: '#ffffff',
      backgroundColor: 'transparent',
      isBold: true,
    });
  };

  const handleApplyFilter = (preset: (typeof FILTER_PRESETS)[0]) => {
    if (!targetVideo) return;
    updateVideoClip(targetVideo.id, {
      adjustments: {
        ...DEFAULT_ADJUSTMENTS,
        ...preset.adjustments,
        opacity: targetVideo.adjustments.opacity ?? 100,
        rotation: targetVideo.adjustments.rotation || 0,
        filter: preset.id,
      },
    });
    setActivePopover(null);
  };

  const isCurrentlyMuted =
    selectedItem?.type === 'audio'
      ? !!targetAudio?.isMuted
      : !!targetVideo?.isMuted || targetVideo?.volume === 0;

  const handleToggleMute = () => {
    if (selectedItem?.type === 'audio' && targetAudio) {
      updateAudioClip(targetAudio.id, { isMuted: !targetAudio.isMuted });
    } else if (targetVideo) {
      updateVideoClip(targetVideo.id, { isMuted: !targetVideo.isMuted });
    }
  };

  // Flag / Bookmark
  const [flags, setFlags] = useState<number[]>([]);
  const isFlagged = flags.some((t) => Math.abs(t - currentTime) < 0.25);
  const toggleFlag = () => setFlags((f) => isFlagged ? f.filter((t) => Math.abs(t - currentTime) >= 0.25) : [...f, Number(currentTime.toFixed(2))].sort((a, b) => a - b));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) && (e.key === 'm' || e.key === 'M') && toggleFlag();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentTime, isFlagged]);

  return (
    <div
      style={{ height: hasVideoAudioTrack ? '295px' : '265px' }}
      className="max-h-[38vh] md:max-h-none transition-[height] duration-300 ease-in-out border-t border-[#303030] bg-[#181818] flex flex-col select-none shrink-0 relative z-20 pb-safe md:pb-0"
    >
      {/* Hidden File Inputs for Toolbar Quick Add */}
      <input ref={toolbarImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={toolbarAudioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />

      {/* Toolbar - Desktop NLE Ribbon & Mobile Horizontal Scroll */}
      <div
        ref={toolbarRef}
        className="h-9 border-b border-[#303030] bg-[#1e1e1e] px-2 sm:px-2.5 flex items-center justify-start md:justify-between gap-1 shrink-0 relative overflow-x-auto no-scrollbar z-30 text-xs"
      >
        {/* Section 1: Playback & Split & Delete & History */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={togglePlay}
            className="p-1 rounded-[2px] text-[#A0A0A0] hover:text-[#E6E6E6] hover:bg-[#282828] transition active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#E6E6E6]" /> : <Play className="w-3.5 h-3.5 text-[#E6E6E6]" />}
          </button>

          <button
            onClick={() => splitClipAtPlayhead()}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-xs font-normal transition cursor-pointer ${selectedItem
              ? 'bg-[#2A2A32] border-[#555562] text-white'
              : 'bg-[#222228] hover:bg-[#2A2A32] border-[#383842] text-[#CCCCCC]'
              }`}
            title={`Split ${selectedItem ? selectedItem.type : 'clip'} at playhead (S)`}
          >
            <Scissors className={`w-3 h-3 ${selectedItem ? 'text-white' : 'text-[#8E8E93]'}`} />
            <span>
              {selectedItem?.type === 'audio'
                ? 'Split Audio (S)'
                : selectedItem?.type === 'image'
                  ? 'Split Image (S)'
                  : selectedItem?.type === 'video'
                    ? 'Split Video (S)'
                    : selectedItem?.type === 'text'
                      ? 'Split Text (S)'
                      : 'Split (S)'}
            </span>
          </button>

          <button
            onClick={() => extractAudioFromVideo()}
            disabled={videoClips.length === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#353535] bg-[#252526] hover:bg-[#2d2d2e] disabled:opacity-30 disabled:pointer-events-none text-xs font-normal text-[#CCCCCC] transition cursor-pointer"
            title="Separate audio from video into a dedicated track"
          >
            <AudioWaveform className="w-3 h-3 text-[#8E8E8E]" />
            <span className="hidden sm:inline">Separate Audio</span>
          </button>

          <button
            onClick={deleteSelectedItem}
            disabled={!selectedItem && !activeVideoClip && videoClips.length === 0 && imageClips.length === 0 && audioClips.length === 0 && textClips.length === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#252526] hover:bg-rose-950/30 disabled:opacity-30 disabled:pointer-events-none border border-[#353535] hover:border-rose-900/40 text-xs font-normal text-rose-400/90 transition cursor-pointer"
            title="Delete clip (Delete)"
          >
            <Trash2 className="w-3 h-3 text-rose-400/90" />
            <span className="hidden md:inline">Delete</span>
          </button>

          <div className="h-3.5 w-px bg-[#303030] mx-0.5" />

          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] disabled:opacity-30 disabled:pointer-events-none border border-[#353535] text-xs text-[#8E8E8E] hover:text-[#E6E6E6] transition cursor-pointer"
            title="Undo (Ctrl+Z / Cmd+Z)"
          >
            <Undo2 className="w-3 h-3" />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] disabled:opacity-30 disabled:pointer-events-none border border-[#353535] text-xs text-[#8E8E8E] hover:text-[#E6E6E6] transition cursor-pointer"
            title="Redo (Ctrl+Y / Cmd+Y)"
          >
            <Redo2 className="w-3 h-3" />
          </button>

          {/* Aspect Ratio Button in Timeline Toolbar */}
          <div className="h-3.5 w-px bg-[#303030] mx-0.5" />

          <button
            onClick={handleOpenRatio}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-xs font-normal transition cursor-pointer shrink-0 ${
              activePopover === 'ratio'
                ? 'border-[#555562] bg-[#2A2A32] text-white shadow-xs'
                : 'bg-[#222228] hover:bg-[#2A2A32] border-[#383842] text-[#CCCCCC]'
            }`}
            title={`Canvas Aspect Ratio: ${aspectRatio}. Click to change`}
          >
            {aspectRatio === '16:9' && <Monitor className="w-3 h-3 text-[#8E8E8E]" />}
            {aspectRatio === '9:16' && <Smartphone className="w-3 h-3 text-[#8E8E8E]" />}
            {aspectRatio === '1:1' && <Square className="w-3 h-3 text-[#8E8E8E]" />}
            {aspectRatio === '4:5' && <SplitSquareVertical className="w-3 h-3 text-[#8E8E8E]" />}
            {aspectRatio === '21:9' && <Maximize2 className="w-3 h-3 text-[#8E8E8E]" />}
            <span className="font-semibold text-white">{aspectRatio}</span>
            <span className="text-[10px] text-[#7E7E8E] hidden sm:inline">Ratio</span>
            <ChevronDown className="w-2.5 h-2.5 text-[#686868]" />
          </button>
        </div>

        {/* Section 2: Quick Add Media */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="h-3.5 w-px bg-[#303030] mx-0.5" />

          {/* + Image */}
          <button
            onClick={() => toolbarImageInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#353535] bg-[#252526] hover:bg-[#2d2d2e] text-xs font-normal text-[#CCCCCC] hover:text-[#E6E6E6] transition cursor-pointer"
            title="Import and add an Image or Graphic overlay directly to timeline"
          >
            <ImageIcon className="w-3 h-3 text-[#8E8E8E]" />
            <span>+ Image</span>
          </button>

          {/* + Title */}
          <button
            onClick={handleAddText}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#353535] bg-[#252526] hover:bg-[#2d2d2e] text-xs font-normal text-[#CCCCCC] hover:text-[#E6E6E6] transition cursor-pointer"
            title="Add new Title / Text overlay at playhead"
          >
            <Type className="w-3 h-3 text-[#8E8E8E]" />
            <span>+ Title</span>
          </button>

          {/* + Audio */}
          <button
            onClick={() => toolbarAudioInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#353535] bg-[#252526] hover:bg-[#2d2d2e] text-xs font-normal text-[#CCCCCC] hover:text-[#E6E6E6] transition cursor-pointer"
            title="Import audio track directly to timeline"
          >
            <Music className="w-3 h-3 text-[#8E8E8E]" />
            <span>+ Audio</span>
          </button>

          {/* Record */}
          <button
            disabled
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#353535] bg-[#252526] hover:bg-[#2d2d2e] disabled:opacity-30 disabled:pointer-events-none text-xs font-normal text-[#CCCCCC] transition cursor-pointer"
            title="Record Audio"
          >
            <Mic className="w-3 h-3 text-[#8E8E8E]" />
            <span>Record</span>
          </button>
        </div>

        {/* Section 3: Modifiers (Speed, Rotate, Transform, Filters, Mute) */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="h-3.5 w-px bg-[#303030] mx-0.5" />

          {/* Speed Control Button */}
          <button
            onClick={handleOpenSpeed}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-xs font-normal transition cursor-pointer ${
              currentSpeed !== 1 || activePopover === 'speed'
                ? 'border-[#555562] bg-[#2A2A32] text-white shadow-xs'
                : 'bg-[#222228] hover:bg-[#2A2A32] border-[#383842] text-[#CCCCCC]'
            }`}
            title="Change Playback Speed"
          >
            <Gauge className="w-3 h-3 text-[#8E8E8E]" />
            <span>{currentSpeed !== 1 ? `${currentSpeed.toFixed(1)}x` : 'Speed'}</span>
            <ChevronDown className="w-2.5 h-2.5 text-[#686868]" />
          </button>

          {/* Rotate 90° */}
          <button
            onClick={handleRotate90}
            disabled={!targetVideo && !targetImage}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-xs font-normal transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${currentRotation > 0
              ? 'border-[#555562] bg-[#2A2A32] text-white'
              : 'bg-[#222228] hover:bg-[#2A2A32] border-[#383842] text-[#CCCCCC]'
              }`}
            title={`Rotate active clip clockwise by 90° (Current: ${currentRotation}°)`}
          >
            <RotateCw className="w-3 h-3 text-[#8E8E8E]" />
            <span>Rotate{currentRotation > 0 ? ` ${currentRotation}°` : ' 90°'}</span>
          </button>

          {/* Bookmark / Marker */}
          <button
            onClick={toggleFlag}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-xs font-normal transition cursor-pointer ${isFlagged
              ? 'border-[#555562] bg-[#2A2A32] text-white'
              : 'bg-[#222228] hover:bg-[#2A2A32] border-[#383842] text-[#CCCCCC]'
              }`}
            title={isFlagged ? `Remove Marker at ${currentTime.toFixed(2)}s (Press M)` : `Add Marker at ${currentTime.toFixed(2)}s (Press M)`}
          >
            <Flag className={`w-3 h-3 ${isFlagged ? 'text-white fill-white' : 'text-[#8E8E8E]'}`} />
            <span>Marker (M)</span>
            {flags.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-[1px] bg-[#141414] text-[#8E8E8E] font-mono">
                {flags.length}
              </span>
            )}
          </button>

          {/* Image Scale Cycle */}
          {targetImage && (
            <button
              onClick={handleScaleImageCycle}
              className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#353535] bg-[#252526] hover:bg-[#2d2d2e] text-xs font-normal text-[#CCCCCC] hover:text-white transition cursor-pointer"
              title={`Cycle scale size: 25%, 50%, 75%, 100%, 125% (Current: ${Math.round(targetImage.width || 50)}%)`}
            >
              <Scaling className="w-3 h-3 text-[#8E8E8E]" />
              <span>{Math.round(targetImage.width || 50)}%</span>
            </button>
          )}

          {/* Center Overlay */}
          <button
            onClick={handleCenterImage}
            disabled={!targetImage}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] disabled:opacity-30 disabled:pointer-events-none border border-[#353535] text-xs font-normal text-[#CCCCCC] hover:text-white transition cursor-pointer"
            title="Center image overlay (50%, 50%)"
          >
            <Crosshair className="w-3 h-3 text-[#8E8E8E]" />
            <span className="hidden xl:inline">Center</span>
          </button>

          {/* Color Filters Button */}
          <button
            onClick={handleOpenFilter}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-xs font-normal transition cursor-pointer ${
              (targetVideo?.adjustments?.filter && targetVideo.adjustments.filter !== 'none') || activePopover === 'filter'
                ? 'border-[#555562] bg-[#2A2A32] text-white shadow-xs'
                : 'bg-[#222228] hover:bg-[#2A2A32] border-[#383842] text-[#CCCCCC]'
            }`}
            title="Apply color looks to video"
          >
            <Palette className="w-3 h-3 text-[#8E8E8E]" />
            <span className="capitalize">
              {targetVideo?.adjustments?.filter && targetVideo.adjustments.filter !== 'none'
                ? targetVideo.adjustments.filter
                : 'Look'}
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-[#686868]" />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={handleToggleMute}
            disabled={!targetVideo && !targetAudio}
            className={`p-1 rounded-[2px] border text-xs transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${isCurrentlyMuted
              ? 'bg-rose-950/30 border-rose-900/40 text-rose-400'
              : 'bg-[#252526] hover:bg-[#2d2d2e] border-[#353535] text-[#8E8E8E] hover:text-white'
              }`}
            title={isCurrentlyMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isCurrentlyMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#8E8E8E]" />}
          </button>
        </div>

        {/* Section 4: Timeline Zoom */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="h-3.5 w-px bg-[#303030] mx-0.5" />

          <button
            onClick={() => setTimelineZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1 rounded-[2px] text-[#8E8E8E] hover:text-white hover:bg-[#282828] transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTimelineZoom(1)}
            className="text-[10px] font-mono text-[#8E8E8E] hover:text-white px-1.5 py-0.5 rounded-[2px] bg-[#252526] border border-[#353535] transition cursor-pointer"
            title="Click to reset zoom to 100%"
          >
            {Math.round(timelineZoom * 100)}%
          </button>

          <button
            onClick={() => setTimelineZoom((z) => Math.min(2.5, z + 0.25))}
            className="p-1 rounded-[2px] text-[#8E8E8E] hover:text-white hover:bg-[#282828] transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-track Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Track Headers Column */}
        <div ref={headersScrollRef} className="w-14 sm:w-16 md:w-32 border-r border-[#303030] bg-[#1a1a1a] flex flex-col shrink-0 z-10 text-xs overflow-hidden select-none">
          <div className="h-7 shrink-0 border-b border-[#303030] px-1.5 sm:px-2 md:px-2.5 flex items-center justify-center md:justify-start text-[9px] md:text-[10px] uppercase font-bold text-[#686868] tracking-wider bg-[#161616]">
            <span className="hidden md:inline">Sequence</span>
            <span className="inline md:hidden">Tracks</span>
          </div>
          {TRACK_HEADERS.map((h) => {
            const Icon = h.icon;
            const isCompact = h.isCompact;
            return (
              <div
                key={h.label}
                className={`${isCompact ? 'h-7' : 'h-14'} shrink-0 border-b border-[#282828] bg-[#1f1f1f] px-1 sm:px-1.5 md:px-2.5 flex items-center justify-center md:justify-between`}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
                  <Icon className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${h.color} shrink-0`} />
                  <span className={`hidden md:inline font-normal ${isCompact ? 'text-[10px]' : 'text-xs'} text-[#9B9B9B] truncate`}>
                    {h.label}
                  </span>
                  <span className={`inline md:hidden font-mono font-semibold ${isCompact ? 'text-[9px]' : 'text-[10px]'} text-[#9B9B9B] truncate`}>
                    {h.label.split(' ')[0]}
                  </span>
                </div>
                <div className="hidden md:block shrink-0">
                  {h.isAudio ? (
                    <Volume2 className="w-3 h-3 text-[#585858]" />
                  ) : (
                    <Eye className="w-3 h-3 text-[#585858]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tracks Scrollable Canvas */}
        <div ref={tracksScrollRef} onScroll={handleTracksScroll} className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative bg-[#141414]">
          {/* Timeline Ruler */}
          <div
            ref={rulerRef}
            onMouseDown={handleRulerMouseDown}
            onTouchStart={handleRulerTouchStart}
            style={{ width: `${timelineContentWidth}px`, minWidth: '100%' }}
            className="h-7 shrink-0 border-b border-[#282828] relative cursor-pointer select-none bg-[#1a1a1a] overflow-visible min-w-full"
          >
            {ticks.map((t) => (
              <div key={t} style={{ left: `${t * pxPerSec}px` }} className="absolute top-0 bottom-0 flex flex-col justify-between">
                <span className="text-[9px] font-mono text-[#686868] pl-1 select-none">{t}s</span>
                <div className="h-2 w-px bg-[#2d2d2d]" />
              </div>
            ))}
            {flags.map((t, i) => (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); seekTo(t); }}
                onContextMenu={(e) => { e.preventDefault(); setFlags((f) => f.filter((x) => x !== t)); }}
                style={{ left: `${t * pxPerSec}px` }}
                className="absolute top-0.5 bottom-0 z-30 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                title={`Marker #${i + 1} at ${t.toFixed(1)}s • Click to jump • Right-click to remove`}
              >
                <div className={`flex items-center gap-0.5 px-1 py-0.2 rounded-[1px] text-[8px] font-mono border transition-transform group-hover:scale-105 ${Math.abs(t - currentTime) < 0.25
                  ? 'bg-white text-[#0D0D10] font-semibold border-white'
                  : 'bg-[#232323] hover:bg-[#303030] text-[#CCCCCC] hover:text-white border-[#353535]'
                  }`}>
                  <Flag className="w-2 h-2" />
                  <span>{t.toFixed(1)}s</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFlags((f) => f.filter((x) => x !== t)); }}
                    className="hidden group-hover:inline-flex items-center justify-center w-2.5 h-2.5 ml-0.5 text-[8px] leading-none text-[#A0A0A0] hover:text-white"
                    title="Remove marker"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Track Lanes */}
          <div style={{ width: `${timelineContentWidth}px`, minWidth: '100%' }} className="flex-1 relative flex flex-col min-w-full" onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}>
            {/* Signature Studio Reference White Playhead */}
            <div style={{ left: `${playheadX}px` }} className="absolute top-0 bottom-0 w-px bg-white z-30 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              <div
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%)',
                }}
                className="w-[11px] h-[14px] bg-white -translate-x-[5px] -translate-y-[26px]"
              />
            </div>

            {/* Marker guideline vertical lines */}
            {flags.map((t, i) => (
              <div
                key={i}
                style={{ left: `${t * pxPerSec}px` }}
                className="absolute top-0 bottom-0 w-px border-l border-dotted border-white/30 z-20 pointer-events-none"
              />
            ))}

            {/* Track 1: Text (T1) */}
            <div onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }} className="h-7 shrink-0 border-b border-[#242424] relative bg-[#18161c] cursor-pointer">
              {textClips.map((clip) => (
                <TimelineClipBlock
                  key={clip.id}
                  startTime={clip.startTime}
                  duration={clip.duration}
                  pxPerSec={pxPerSec}
                  isCompact={true}
                  isSelected={selectedItem?.type === 'text' && selectedItem.id === clip.id}
                  bgClass="bg-[#544260]"
                  borderClass="border border-[#685475]"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'text', id: clip.id });
                    setDraggingClip({ type: 'text', id: clip.id, startX: e.clientX, initialStartTime: clip.startTime });
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      setSelectedItem({ type: 'text', id: clip.id });
                      setDraggingClip({ type: 'text', id: clip.id, startX: e.touches[0].clientX, initialStartTime: clip.startTime });
                    }
                  }}
                  onTrimMouseDown={(e, edge) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'text', id: clip.id });
                    setTrimmingClip({ type: 'text', id: clip.id, edge, startX: e.clientX });
                  }}
                  onTrimTouchStart={(e, edge) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      setSelectedItem({ type: 'text', id: clip.id });
                      setTrimmingClip({ type: 'text', id: clip.id, edge, startX: e.touches[0].clientX });
                    }
                  }}
                  onSelect={() => setSelectedItem({ type: 'text', id: clip.id })}
                >
                  <div className="flex items-center gap-1 px-1.5 truncate min-w-0">
                    <Type className="w-2.5 h-2.5 text-[#D4D4D4] shrink-0" />
                    <span className="text-[10px] font-normal text-[#E6E6E6] truncate leading-none">{clip.text}</span>
                  </div>
                  <span className="text-[8px] font-mono text-[#B0B0B0] pr-1 shrink-0 leading-none">{clip.duration.toFixed(1)}s</span>
                </TimelineClipBlock>
              ))}
            </div>

            {/* Track 2: Images / Graphics (V2) */}
            <div onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }} className="h-14 shrink-0 border-b border-[#242424] relative bg-[#1c1815] cursor-pointer">
              {imageClips.map((clip) => (
                <TimelineClipBlock
                  key={clip.id}
                  startTime={clip.startTime}
                  duration={clip.duration}
                  pxPerSec={pxPerSec}
                  isSelected={selectedItem?.type === 'image' && selectedItem.id === clip.id}
                  bgClass="bg-[#66462c]"
                  borderClass="border border-[#7d5738]"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'image', id: clip.id });
                    setDraggingClip({ type: 'image', id: clip.id, startX: e.clientX, initialStartTime: clip.startTime });
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      setSelectedItem({ type: 'image', id: clip.id });
                      setDraggingClip({ type: 'image', id: clip.id, startX: e.touches[0].clientX, initialStartTime: clip.startTime });
                    }
                  }}
                  onTrimMouseDown={(e, edge) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'image', id: clip.id });
                    setTrimmingClip({ type: 'image', id: clip.id, edge, startX: e.clientX });
                  }}
                  onTrimTouchStart={(e, edge) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      setSelectedItem({ type: 'image', id: clip.id });
                      setTrimmingClip({ type: 'image', id: clip.id, edge, startX: e.touches[0].clientX });
                    }
                  }}
                  onSelect={() => setSelectedItem({ type: 'image', id: clip.id })}
                >
                  <div className="flex items-center gap-1.5 px-2 truncate min-w-0">
                    <img src={clip.url} alt="" className="w-4 h-4 rounded-[1px] object-cover shrink-0 border border-white/20" />
                    <span className="text-[11px] font-normal text-[#E6E6E6] truncate">{clip.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#B0B0B0] pr-2 shrink-0">{clip.duration.toFixed(1)}s</span>
                </TimelineClipBlock>
              ))}
            </div>

            {/* Track 3: Video (V1) */}
            <div onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }} className="h-14 shrink-0 border-b border-[#242424] relative bg-[#161718] cursor-pointer">
              {videoClips.map((clip) => (
                <TimelineClipBlock
                  key={clip.id}
                  startTime={clip.startTime}
                  duration={clip.duration}
                  pxPerSec={pxPerSec}
                  isSelected={selectedItem?.type === 'video' && selectedItem.id === clip.id}
                  bgClass="bg-[#2e3640]"
                  borderClass="border border-[#3e4854]"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'video', id: clip.id });
                    setDraggingClip({ type: 'video', id: clip.id, startX: e.clientX, initialStartTime: clip.startTime });
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      setSelectedItem({ type: 'video', id: clip.id });
                      setDraggingClip({ type: 'video', id: clip.id, startX: e.touches[0].clientX, initialStartTime: clip.startTime });
                    }
                  }}
                  onTrimMouseDown={(e, edge) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'video', id: clip.id });
                    setTrimmingClip({ type: 'video', id: clip.id, edge, startX: e.clientX });
                  }}
                  onTrimTouchStart={(e, edge) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      setSelectedItem({ type: 'video', id: clip.id });
                      setTrimmingClip({ type: 'video', id: clip.id, edge, startX: e.touches[0].clientX });
                    }
                  }}
                  onSelect={() => setSelectedItem({ type: 'video', id: clip.id })}
                >
                  <div className="flex items-center gap-1.5 px-2 truncate min-w-0">
                    <Film className="w-3.5 h-3.5 text-[#D4D4D4] shrink-0" />
                    <span className="text-[11px] font-normal text-[#E6E6E6] truncate">{clip.name}</span>
                    {clip.speed && clip.speed !== 1 && (
                      <span className="px-1 py-0.2 rounded-[1px] text-[8px] font-mono bg-[#141414] text-[#CCCCCC] border border-[#2d2d2d] shrink-0">
                        {clip.speed}x
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-[#B0B0B0] pr-2 shrink-0">{clip.duration.toFixed(1)}s</span>
                </TimelineClipBlock>
              ))}
            </div>

            {/* Track 3.5: Video Audio (Detached from Video - half height h-7) */}
            {hasVideoAudioTrack && (
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedItem(null);
                }}
                className="h-7 shrink-0 border-b border-[#242424] relative bg-[#161817] cursor-pointer"
              >
                {videoAudioClips.map((clip) => (
                  <TimelineClipBlock
                    key={clip.id}
                    startTime={clip.startTime}
                    duration={clip.duration}
                    pxPerSec={pxPerSec}
                    isCompact={true}
                    isSelected={selectedItem?.type === 'audio' && selectedItem.id === clip.id}
                    bgClass="bg-[#1e3b34]"
                    borderClass="border border-[#2a4d44]"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedItem({ type: 'audio', id: clip.id });
                      setDraggingClip({
                        type: 'audio',
                        id: clip.id,
                        startX: e.clientX,
                        initialStartTime: clip.startTime,
                      });
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length > 0) {
                        setSelectedItem({ type: 'audio', id: clip.id });
                        setDraggingClip({
                          type: 'audio',
                          id: clip.id,
                          startX: e.touches[0].clientX,
                          initialStartTime: clip.startTime,
                        });
                      }
                    }}
                    onTrimMouseDown={(e, edge) => {
                      e.stopPropagation();
                      setSelectedItem({ type: 'audio', id: clip.id });
                      setTrimmingClip({ type: 'audio', id: clip.id, edge, startX: e.clientX });
                    }}
                    onTrimTouchStart={(e, edge) => {
                      e.stopPropagation();
                      if (e.touches.length > 0) {
                        setSelectedItem({ type: 'audio', id: clip.id });
                        setTrimmingClip({ type: 'audio', id: clip.id, edge, startX: e.touches[0].clientX });
                      }
                    }}
                    onSelect={() => setSelectedItem({ type: 'audio', id: clip.id })}
                  >
                    <div className="flex items-center gap-1 px-1 truncate min-w-0">
                      <AudioWaveform className="w-3 h-3 text-[#D4D4D4] shrink-0" />
                      <span className="text-[10px] font-normal text-[#E6E6E6] truncate leading-none">{clip.name}</span>
                      {clip.speed && clip.speed !== 1 && (
                        <span className="px-1 py-0.2 rounded-[1px] text-[8px] font-mono bg-[#141414] text-[#CCCCCC] border border-[#2d2d2d] shrink-0 leading-none">
                          {clip.speed}x
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-[#B0B0B0] pr-1 shrink-0 leading-none">{clip.duration.toFixed(1)}s</span>
                  </TimelineClipBlock>
                ))}
              </div>
            )}

            {/* Track 4: Audio / Music (A2) */}
            <div onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }} className="h-7 shrink-0 border-b border-[#242424] relative bg-[#141d18] cursor-pointer">
              {musicAudioClips.map((clip) => (
                <TimelineClipBlock
                  key={clip.id}
                  startTime={clip.startTime}
                  duration={clip.duration}
                  pxPerSec={pxPerSec}
                  isCompact={true}
                  isSelected={selectedItem?.type === 'audio' && selectedItem.id === clip.id}
                  bgClass="bg-[#235446]"
                  borderClass="border border-[#2e6958]"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'audio', id: clip.id });
                    setDraggingClip({ type: 'audio', id: clip.id, startX: e.clientX, initialStartTime: clip.startTime });
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      setSelectedItem({ type: 'audio', id: clip.id });
                      setDraggingClip({ type: 'audio', id: clip.id, startX: e.touches[0].clientX, initialStartTime: clip.startTime });
                    }
                  }}
                  onTrimMouseDown={(e, edge) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'audio', id: clip.id });
                    setTrimmingClip({ type: 'audio', id: clip.id, edge, startX: e.clientX });
                  }}
                  onTrimTouchStart={(e, edge) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      setSelectedItem({ type: 'audio', id: clip.id });
                      setTrimmingClip({ type: 'audio', id: clip.id, edge, startX: e.touches[0].clientX });
                    }
                  }}
                  onSelect={() => setSelectedItem({ type: 'audio', id: clip.id })}
                >
                  <div className="flex items-center gap-1 px-1 truncate min-w-0">
                    <Music className="w-2.5 h-2.5 text-[#D4D4D4] shrink-0" />
                    <span className="text-[10px] font-normal text-[#E6E6E6] truncate leading-none">{clip.name}</span>
                    {clip.speed && clip.speed !== 1 && (
                      <span className="px-1 py-0.2 rounded-[1px] text-[8px] font-mono bg-[#141414] text-[#CCCCCC] border border-[#2d2d2d] shrink-0 leading-none">
                        {clip.speed}x
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-[#B0B0B0] pr-1 shrink-0 leading-none">{clip.duration.toFixed(1)}s</span>
                </TimelineClipBlock>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SPEED, LOOK & RATIO FLOATING UNCLIPPED POPOVER ================= */}
      {isMounted && activePopover && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/75 sm:bg-transparent backdrop-blur-[2px] sm:backdrop-blur-none flex flex-col justify-end sm:justify-start"
          onClick={() => setActivePopover(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={
              popoverAnchor && typeof window !== 'undefined' && window.innerWidth >= 640
                ? {
                    position: 'fixed',
                    bottom: `${Math.max(10, window.innerHeight - popoverAnchor.y + 6)}px`,
                    left: `${Math.max(12, Math.min(window.innerWidth - 300, popoverAnchor.x - 50))}px`,
                  }
                : undefined
            }
            className="w-full sm:w-80 bg-[#1e1e24] border-t sm:border border-[#3e3e4a] rounded-t-2xl sm:rounded-[3px] shadow-2xl p-4 sm:p-3.5 space-y-3 sm:space-y-2.5 pb-20 sm:pb-3.5 pb-safe max-h-[85vh] sm:max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            {/* Grab Handle on Mobile */}
            <div className="w-10 h-1 bg-[#444452] rounded-full mx-auto -mt-1 mb-2 sm:hidden" />
            {/* Speed Popover */}
            {activePopover === 'speed' && (
              <>
                <div className="flex items-center justify-between border-b border-[#303030] pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Gauge className="w-3.5 h-3.5 text-white" />
                    <span>Speed / Duration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-white px-1.5 py-0.2 rounded-[2px] bg-[#2a2a35] border border-[#3e3e4a]">
                      {currentSpeed.toFixed(2)}x
                    </span>
                    <button
                      onClick={() => setActivePopover(null)}
                      className="p-1 rounded-[2px] text-[#8E8E93] hover:text-white bg-[#25252d] border border-[#383842]"
                      aria-label="Close speed popover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!targetSpeedClip.clip ? (
                  <div className="text-center py-3 px-2 space-y-1.5">
                    <p className="text-xs font-medium text-white">No Clip on Timeline</p>
                    <p className="text-[10px] text-[#8E8E93]">
                      Import or add a video/audio clip to the timeline to adjust its playback speed.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-[10px] text-[#A0A0A0] px-2 py-0.5 rounded-[2px] bg-[#141416] border border-[#2d2d36] inline-block font-mono">
                      {currentSpeed < 0.99
                        ? `${currentSpeed.toFixed(2)}x • Slow Motion`
                        : currentSpeed > 1.01
                          ? `${currentSpeed.toFixed(2)}x • Fast Motion`
                          : '1.00x • Normal Speed'}
                    </div>

                    <input
                      type="range"
                      min="0.25"
                      max="4"
                      step="0.05"
                      value={currentSpeed}
                      onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                      className="w-full cursor-pointer accent-white"
                    />

                    <div className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider pt-0.5">
                      Speed Presets
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.25, 0.5, 0.75, 1].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          className={`py-2 sm:py-1 rounded-[2px] text-xs sm:text-[10px] font-mono border transition cursor-pointer ${
                            Math.abs(currentSpeed - s) < 0.04
                              ? 'border-white bg-[#2A2A35] text-white font-medium'
                              : 'border-[#303030] bg-[#232323] text-[#A0A0A0] hover:text-white'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1.5, 2, 4].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          className={`py-2 sm:py-1 rounded-[2px] text-xs sm:text-[10px] font-mono border transition cursor-pointer ${
                            Math.abs(currentSpeed - s) < 0.04
                              ? 'border-white bg-[#2A2A35] text-white font-medium'
                              : 'border-[#303030] bg-[#232323] text-[#A0A0A0] hover:text-white'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>

                    {currentSpeed !== 1 && (
                      <button
                        onClick={() => handleSpeedChange(1)}
                        className="w-full py-2 sm:py-1 text-xs sm:text-[11px] rounded-[2px] bg-[#25252c] hover:bg-[#2d2d36] text-[#A0A0AA] hover:text-white border border-[#383842] transition cursor-pointer font-medium mt-1"
                      >
                        Reset to Normal Speed (1.00x)
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* Look / Color Filters Popover */}
            {activePopover === 'filter' && (
              <>
                <div className="flex items-center justify-between border-b border-[#303030] pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Palette className="w-3.5 h-3.5 text-white" />
                    <span>Color Looks / LUTs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-white px-1.5 py-0.2 rounded-[2px] bg-[#2a2a35] border border-[#3e3e4a] capitalize">
                      {targetVideo?.adjustments?.filter && targetVideo.adjustments.filter !== 'none'
                        ? targetVideo.adjustments.filter
                        : 'Normal'}
                    </span>
                    <button
                      onClick={() => setActivePopover(null)}
                      className="p-1 rounded-[2px] text-[#8E8E93] hover:text-white bg-[#25252d] border border-[#383842]"
                      aria-label="Close color look popover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!targetVideo ? (
                  <div className="text-center py-3 px-2 space-y-1.5">
                    <p className="text-xs font-medium text-white">No Video Clip</p>
                    <p className="text-[10px] text-[#8E8E93]">
                      Add a video clip to the timeline to apply color looks and filters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 sm:max-h-64 sm:overflow-y-auto pr-0.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {FILTER_PRESETS.map((p) => {
                        const isActive = (targetVideo.adjustments.filter || 'none') === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleApplyFilter(p)}
                            className={`p-2 sm:p-1.5 rounded-[2px] text-left border text-xs sm:text-[11px] transition cursor-pointer flex items-center justify-between ${
                              isActive
                                ? 'border-white bg-[#2A2A35] text-white font-medium shadow-sm'
                                : 'border-[#2d2d36] bg-[#16161a] text-[#A0A0A0] hover:text-white hover:border-[#383842]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-[1px] shrink-0" style={{ background: p.swatchGradient }} />
                              <span className="truncate">{p.name}</span>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-white shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Aspect Ratio Popover */}
            {activePopover === 'ratio' && (
              <>
                <div className="flex items-center justify-between border-b border-[#303030] pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Monitor className="w-3.5 h-3.5 text-white" />
                    <span>Canvas Aspect Ratio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-white px-1.5 py-0.2 rounded-[2px] bg-[#2a2a35] border border-[#3e3e4a]">
                      {aspectRatio}
                    </span>
                    <button
                      onClick={() => setActivePopover(null)}
                      className="p-1 rounded-[2px] text-[#8E8E93] hover:text-white bg-[#25252d] border border-[#383842]"
                      aria-label="Close aspect ratio popover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pb-6 sm:pb-0">
                  {[
                    {
                      ratio: '16:9' as const,
                      label: '16:9',
                      title: 'YouTube / Widescreen',
                      desc: 'Horizontal format (1920 × 1080)',
                      shapeW: 'w-6',
                      shapeH: 'h-3.5',
                    },
                    {
                      ratio: '9:16' as const,
                      label: '9:16',
                      title: 'TikTok / Reels / Shorts',
                      desc: 'Vertical mobile format (1080 × 1920)',
                      shapeW: 'w-3.5',
                      shapeH: 'h-6',
                    },
                    {
                      ratio: '1:1' as const,
                      label: '1:1',
                      title: 'Instagram / Square Post',
                      desc: 'Classic square post (1080 × 1080)',
                      shapeW: 'w-4.5',
                      shapeH: 'h-4.5',
                    },
                    {
                      ratio: '4:5' as const,
                      label: '4:5',
                      title: 'Portrait / Feed',
                      desc: 'Tall social post (1080 × 1350)',
                      shapeW: 'w-4',
                      shapeH: 'h-5',
                    },
                    {
                      ratio: '21:9' as const,
                      label: '21:9',
                      title: 'Cinematic Ultrawide',
                      desc: 'Anamorphic widescreen (2560 × 1080)',
                      shapeW: 'w-7',
                      shapeH: 'h-3',
                    },
                  ].map((item) => {
                    const isActive = aspectRatio === item.ratio;
                    return (
                      <button
                        key={item.ratio}
                        onClick={() => {
                          setAspectRatio(item.ratio);
                          setActivePopover(null);
                        }}
                        className={`w-full p-2.5 sm:p-2 rounded-[2px] border text-left transition flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                          isActive
                            ? 'border-white bg-[#2A2A38] text-white font-medium shadow-sm'
                            : 'border-[#2d2d38] bg-[#16161c] text-[#A0A0AA] hover:text-white hover:border-[#383842] active:bg-[#202028]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-[2px] bg-[#20202a] border border-[#333340] flex items-center justify-center shrink-0">
                            <div
                              className={`${item.shapeW} ${item.shapeH} rounded-[1px] border-2 transition-colors ${
                                isActive ? 'border-white bg-white/20' : 'border-[#666675] bg-[#666675]/10'
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{item.label}</span>
                              <span className="text-[10px] text-[#A0A0AA]">{item.title}</span>
                            </div>
                            <div className="text-[10px] text-[#71717A] mt-0.5">{item.desc}</div>
                          </div>
                        </div>

                        {isActive ? (
                          <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[#3a3a48] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
