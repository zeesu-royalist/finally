'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Maximize2,
  Move,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { AspectRatio, TextClip, ImageClip } from '../types/editor';
import { getFilterCssString } from '../utils/filterUtils';

function formatTimecode(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths
    .toString()
    .padStart(2, '0')}`;
}

function getAspectRatioValue(ratio: AspectRatio): string {
  switch (ratio) {
    case '16:9':
      return '16 / 9';
    case '9:16':
      return '9 / 16';
    case '1:1':
      return '1 / 1';
    case '4:5':
      return '4 / 5';
    case '21:9':
      return '21 / 9';
    default:
      return '16 / 9';
  }
}

export default function PreviewPlayer() {
  const {
    currentTime,
    totalDuration,
    isPlaying,
    togglePlay,
    seekTo,
    aspectRatio,
    activeVideoClip,
    activeAudioClips,
    activeTextClips,
    activeImageClips,
    selectedItem,
    setSelectedItem,
    updateTextClip,
    updateImageClip,
    saveSnapshot,
  } = useEditor();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [masterVolume, setMasterVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDraggingTextId, setIsDraggingTextId] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initTextX: number; initTextY: number } | null>(null);

  // Track previous playback states to avoid continuous seeking while playing
  const prevIsPlayingRef = useRef(false);
  const prevClipIdRef = useRef<string | null>(null);

  // Sync video element time
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !activeVideoClip) {
      prevClipIdRef.current = null;
      return;
    }

    const speed = activeVideoClip.speed ?? 1;
    const clipTargetTime = activeVideoClip.offsetStart + (currentTime - activeVideoClip.startTime) * speed;
    const clampedTarget = Math.max(0, clipTargetTime);
    const clipChanged = prevClipIdRef.current !== activeVideoClip.id;
    const playStateStarted = isPlaying && !prevIsPlayingRef.current;

    prevClipIdRef.current = activeVideoClip.id;
    prevIsPlayingRef.current = isPlaying;

    if (vid) {
      vid.volume = isMuted || activeVideoClip.isMuted
        ? 0
        : Math.min(1, Math.max(0, (activeVideoClip.volume ?? 1) * masterVolume));
      vid.muted = isMuted || activeVideoClip.isMuted;
      if (vid.playbackRate !== speed) {
        vid.playbackRate = speed;
      }
      if ('preservesPitch' in vid) {
        (vid as HTMLVideoElement & { preservesPitch: boolean }).preservesPitch = true;
      }
    }

    if (!isPlaying) {
      // Paused or scrubbing: seek smoothly to exact target time
      if (Math.abs(vid.currentTime - clampedTarget) > 0.04) {
        vid.currentTime = clampedTarget;
      }
      if (!vid.paused) {
        vid.pause();
      }
    } else {
      // Playing:
      if (vid.playbackRate !== speed) {
        vid.playbackRate = speed;
      }
      if (playStateStarted || clipChanged) {
        // Only seek ONCE when playback starts or switching clips
        vid.currentTime = clampedTarget;
        vid.play().catch(() => { });
      } else {
        // During natural playback, do NOT seek unless a massive desync occurs
        const desyncThreshold = Math.max(0.85, 0.85 * speed);
        if (Math.abs(vid.currentTime - clampedTarget) > desyncThreshold) {
          vid.currentTime = clampedTarget;
        }
        if (vid.paused) {
          vid.play().catch(() => { });
        }
      }
    }
  }, [currentTime, isPlaying, activeVideoClip, masterVolume, isMuted]);

  // Sync background audio tracks
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const prevAudioPlayingRef = useRef(false);

  useEffect(() => {
    const playStarted = isPlaying && !prevAudioPlayingRef.current;
    prevAudioPlayingRef.current = isPlaying;

    activeAudioClips.forEach((audioClip) => {
      let el = audioRefs.current.get(audioClip.id);
      if (!el) {
        el = new Audio(audioClip.url);
        audioRefs.current.set(audioClip.id, el);
      }
      el.volume = isMuted || audioClip.isMuted ? 0 : Math.min(1, audioClip.volume * masterVolume);

      const audioSpeed = audioClip.speed ?? 1;
      if (el.playbackRate !== audioSpeed) {
        el.playbackRate = audioSpeed;
      }
      if ('preservesPitch' in el) {
        (el as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = true;
      }

      const targetTime = audioClip.offsetStart + (currentTime - audioClip.startTime) * audioSpeed;

      if (!isPlaying) {
        if (Math.abs(el.currentTime - targetTime) > 0.05) {
          el.currentTime = Math.max(0, targetTime);
        }
        if (!el.paused) el.pause();
      } else {
        const audioDesyncThreshold = Math.max(0.85, 0.85 * audioSpeed);
        if (playStarted || el.paused) {
          el.currentTime = Math.max(0, targetTime);
          el.play().catch(() => { });
        } else if (Math.abs(el.currentTime - targetTime) > audioDesyncThreshold) {
          el.currentTime = Math.max(0, targetTime);
        }
      }
    });

    // Pause any inactive audio tracks
    audioRefs.current.forEach((el, id) => {
      const isActive = activeAudioClips.some((c) => c.id === id);
      if (!isActive && !el.paused) {
        el.pause();
      }
    });
  }, [activeAudioClips, currentTime, isPlaying, masterVolume, isMuted]);

  // Cleanup audio elements on unmount
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;
    return () => {
      currentAudioRefs.forEach((el) => {
        el.pause();
        el.src = '';
      });
      currentAudioRefs.clear();
    };
  }, []);

  // Text Direct Dragging on Preview
  const handleTextMouseDown = (e: React.MouseEvent, txt: TextClip) => {
    e.stopPropagation();
    setSelectedItem({ type: 'text', id: txt.id });
    setIsDraggingTextId(txt.id);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initTextX: txt.x,
      initTextY: txt.y,
    };
  };

  const handleTextTouchStart = (e: React.TouchEvent, txt: TextClip) => {
    e.stopPropagation();
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    setSelectedItem({ type: 'text', id: txt.id });
    setIsDraggingTextId(txt.id);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initTextX: txt.x,
      initTextY: txt.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTextId || !dragStartRef.current || !viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100;

      const newX = Math.max(5, Math.min(95, dragStartRef.current.initTextX + deltaX));
      const newY = Math.max(5, Math.min(95, dragStartRef.current.initTextY + deltaY));

      updateTextClip(isDraggingTextId, { x: Math.round(newX), y: Math.round(newY) });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingTextId || !dragStartRef.current || !viewportRef.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = viewportRef.current.getBoundingClientRect();
      const deltaX = ((touch.clientX - dragStartRef.current.startX) / rect.width) * 100;
      const deltaY = ((touch.clientY - dragStartRef.current.startY) / rect.height) * 100;

      const newX = Math.max(5, Math.min(95, dragStartRef.current.initTextX + deltaX));
      const newY = Math.max(5, Math.min(95, dragStartRef.current.initTextY + deltaY));

      updateTextClip(isDraggingTextId, { x: Math.round(newX), y: Math.round(newY) });
    };

    const handleDragEnd = () => {
      setIsDraggingTextId(null);
      dragStartRef.current = null;
    };

    if (isDraggingTextId) {
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
  }, [isDraggingTextId, updateTextClip]);

  // Moving and Resizing Image Overlay
  const [isDraggingImageId, setIsDraggingImageId] = useState<string | null>(null);
  const dragImageStartRef = useRef<{
    startX: number;
    startY: number;
    initImgX: number;
    initImgY: number;
  } | null>(null);

  const [resizingImage, setResizingImage] = useState<{
    id: string;
    handle: 'tl' | 'tr' | 'bl' | 'br';
    startX: number;
    startY: number;
    centerX: number;
    centerY: number;
    initRadius: number;
    initWidth: number;
  } | null>(null);

  const handleImageMouseDown = (e: React.MouseEvent, img: ImageClip) => {
    e.stopPropagation();
    saveSnapshot();
    setSelectedItem({ type: 'image', id: img.id });
    setIsDraggingImageId(img.id);
    dragImageStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initImgX: img.x,
      initImgY: img.y,
    };
  };

  const handleImageTouchStart = (e: React.TouchEvent, img: ImageClip) => {
    e.stopPropagation();
    if (e.touches.length === 0) return;
    saveSnapshot();
    const touch = e.touches[0];
    setSelectedItem({ type: 'image', id: img.id });
    setIsDraggingImageId(img.id);
    dragImageStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initImgX: img.x,
      initImgY: img.y,
    };
  };

  const handleImageResizeMouseDown = (
    e: React.MouseEvent,
    img: ImageClip,
    handle: 'tl' | 'tr' | 'bl' | 'br'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    saveSnapshot();
    setSelectedItem({ type: 'image', id: img.id });

    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const centerX = rect.left + (img.x / 100) * rect.width;
    const centerY = rect.top + (img.y / 100) * rect.height;
    const initRadius = Math.max(15, Math.hypot(e.clientX - centerX, e.clientY - centerY));

    setResizingImage({
      id: img.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      centerX,
      centerY,
      initRadius,
      initWidth: img.width || 35,
    });
  };

  const handleImageResizeTouchStart = (
    e: React.TouchEvent,
    img: ImageClip,
    handle: 'tl' | 'tr' | 'bl' | 'br'
  ) => {
    e.stopPropagation();
    if (e.touches.length === 0) return;
    saveSnapshot();
    const touch = e.touches[0];
    setSelectedItem({ type: 'image', id: img.id });

    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const centerX = rect.left + (img.x / 100) * rect.width;
    const centerY = rect.top + (img.y / 100) * rect.height;
    const initRadius = Math.max(15, Math.hypot(touch.clientX - centerX, touch.clientY - centerY));

    setResizingImage({
      id: img.id,
      handle,
      startX: touch.clientX,
      startY: touch.clientY,
      centerX,
      centerY,
      initRadius,
      initWidth: img.width || 35,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingImage && viewportRef.current) {
        const currentRadius = Math.hypot(
          e.clientX - resizingImage.centerX,
          e.clientY - resizingImage.centerY
        );
        const ratio = currentRadius / resizingImage.initRadius;
        const newWidth = Math.min(
          150,
          Math.max(5, Math.round(resizingImage.initWidth * ratio))
        );
        updateImageClip(resizingImage.id, { width: newWidth });
      } else if (isDraggingImageId && dragImageStartRef.current && viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - dragImageStartRef.current.startX) / rect.width) * 100;
        const deltaY = ((e.clientY - dragImageStartRef.current.startY) / rect.height) * 100;

        const newX = Math.max(0, Math.min(100, dragImageStartRef.current.initImgX + deltaX));
        const newY = Math.max(0, Math.min(100, dragImageStartRef.current.initImgY + deltaY));

        updateImageClip(isDraggingImageId, { x: Math.round(newX), y: Math.round(newY) });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      if (resizingImage && viewportRef.current) {
        const currentRadius = Math.hypot(
          touch.clientX - resizingImage.centerX,
          touch.clientY - resizingImage.centerY
        );
        const ratio = currentRadius / resizingImage.initRadius;
        const newWidth = Math.min(
          150,
          Math.max(5, Math.round(resizingImage.initWidth * ratio))
        );
        updateImageClip(resizingImage.id, { width: newWidth });
      } else if (isDraggingImageId && dragImageStartRef.current && viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        const deltaX = ((touch.clientX - dragImageStartRef.current.startX) / rect.width) * 100;
        const deltaY = ((touch.clientY - dragImageStartRef.current.startY) / rect.height) * 100;

        const newX = Math.max(0, Math.min(100, dragImageStartRef.current.initImgX + deltaX));
        const newY = Math.max(0, Math.min(100, dragImageStartRef.current.initImgY + deltaY));

        updateImageClip(isDraggingImageId, { x: Math.round(newX), y: Math.round(newY) });
      }
    };

    const handleDragEnd = () => {
      setIsDraggingImageId(null);
      dragImageStartRef.current = null;
      setResizingImage(null);
    };

    if (isDraggingImageId || resizingImage) {
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
  }, [isDraggingImageId, resizingImage, updateImageClip]);

  // Video adjustments styling
  const videoFilterStyle = activeVideoClip
    ? {
      filter: getFilterCssString(activeVideoClip.adjustments),
      transform: `rotate(${activeVideoClip.adjustments.rotation || 0}deg)`,
      opacity: (activeVideoClip.adjustments.opacity ?? 100) / 100,
    }
    : {};

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => { });
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#181818] flex flex-col items-center justify-center p-1.5 sm:p-3 relative overflow-hidden select-none min-h-0"
      onClick={(e) => {
        if (e.target === containerRef.current) {
          setSelectedItem(null);
        }
      }}
    >
      {/* Aspect Ratio Viewport Frame */}
      <div
        ref={viewportRef}
        style={{
          aspectRatio: getAspectRatioValue(aspectRatio),
          maxHeight: 'calc(100% - 56px)',
          maxWidth: '100%',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (activeVideoClip) {
            setSelectedItem({ type: 'video', id: activeVideoClip.id });
          }
        }}
        className={`w-full h-full relative rounded-[2px] overflow-hidden bg-[#0a0a0a] border flex items-center justify-center transition-all duration-150 cursor-pointer ${selectedItem?.type === 'video' && activeVideoClip && selectedItem.id === activeVideoClip.id
          ? 'border-white'
          : 'border-[#333333] hover:border-[#444444]'
          }`}
      >
        {/* Video Player */}
        {activeVideoClip ? (
          <video
            ref={videoRef}
            src={activeVideoClip.url}
            className="w-full h-full object-contain pointer-events-none transition-transform duration-100"
            style={videoFilterStyle}
            muted={isMuted || activeVideoClip.isMuted}
            playsInline
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-[#777777]">
            <div className="w-10 h-10 rounded-[2px] border border-dashed border-[#383838] flex items-center justify-center mb-2">
              <Play className="w-4 h-4 opacity-40 ml-0.5" />
            </div>
            <p className="text-xs font-normal text-[#A0A0A0]">No clip at current playhead position</p>
            <p className="text-[10px] text-[#666666] mt-0.5">
              Select or place a video clip on the timeline to preview
            </p>
          </div>
        )}

        {/* Image Overlays Layer */}
        {activeImageClips.map((img) => {
          const isSelected = selectedItem?.type === 'image' && selectedItem.id === img.id;
          return (
            <div
              key={img.id}
              onMouseDown={(e) => handleImageMouseDown(e, img)}
              onTouchStart={(e) => handleImageTouchStart(e, img)}
              style={{
                left: `${img.x}%`,
                top: `${img.y}%`,
                width: `${img.width}%`,
                transform: `translate(-50%, -50%) rotate(${img.rotation || 0}deg)`,
                opacity: (img.opacity !== undefined ? (img.opacity <= 1 && img.opacity > 0 ? img.opacity : img.opacity / 100) : 1),
              }}
              className={`absolute select-none ${isSelected
                ? 'border border-white z-30 cursor-grab active:cursor-grabbing'
                : 'hover:border hover:border-white/40 z-20 cursor-pointer'
                }`}
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-auto object-contain pointer-events-none drop-shadow"
                draggable={false}
              />
              {isSelected && (
                <>
                  {/* Floating Info Badge: Size & Position */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#181818] border border-[#383838] px-1.5 py-0.5 rounded-[2px] text-[9px] text-[#A0A0A0] font-mono flex items-center gap-1.5 shadow pointer-events-none whitespace-nowrap z-40">
                    <Maximize2 className="w-2.5 h-2.5 text-[#E4E4E7]" />
                    <span className="text-[#E6E6E6] font-medium">{Math.round(img.width)}%</span>
                    <span className="text-[#555555]">•</span>
                    <Move className="w-2.5 h-2.5 text-[#E4E4E7]" />
                    <span>
                      X:{Math.round(img.x)}% Y:{Math.round(img.y)}%
                    </span>
                  </div>

                  {/* 4 Corner Resize Handles - Desktop NLE square handles */}
                  <div
                    onMouseDown={(e) => handleImageResizeMouseDown(e, img, 'tl')}
                    onTouchStart={(e) => handleImageResizeTouchStart(e, img, 'tl')}
                    className="absolute -top-2 -left-2 sm:-top-1.5 sm:-left-1.5 w-3.5 h-3.5 sm:w-2.5 sm:h-2.5 bg-white border border-[#181818] rounded-[1px] cursor-nwse-resize hover:scale-125 active:scale-110 transition-transform z-40"
                    title="Drag corner to resize"
                  />
                  <div
                    onMouseDown={(e) => handleImageResizeMouseDown(e, img, 'tr')}
                    onTouchStart={(e) => handleImageResizeTouchStart(e, img, 'tr')}
                    className="absolute -top-2 -right-2 sm:-top-1.5 sm:-right-1.5 w-3.5 h-3.5 sm:w-2.5 sm:h-2.5 bg-white border border-[#181818] rounded-[1px] cursor-nesw-resize hover:scale-125 active:scale-110 transition-transform z-40"
                    title="Drag corner to resize"
                  />
                  <div
                    onMouseDown={(e) => handleImageResizeMouseDown(e, img, 'bl')}
                    onTouchStart={(e) => handleImageResizeTouchStart(e, img, 'bl')}
                    className="absolute -bottom-2 -left-2 sm:-bottom-1.5 sm:-left-1.5 w-3.5 h-3.5 sm:w-2.5 sm:h-2.5 bg-white border border-[#181818] rounded-[1px] cursor-nesw-resize hover:scale-125 active:scale-110 transition-transform z-40"
                    title="Drag corner to resize"
                  />
                  <div
                    onMouseDown={(e) => handleImageResizeMouseDown(e, img, 'br')}
                    onTouchStart={(e) => handleImageResizeTouchStart(e, img, 'br')}
                    className="absolute -bottom-2 -right-2 sm:-bottom-1.5 sm:-right-1.5 w-3.5 h-3.5 sm:w-2.5 sm:h-2.5 bg-white border border-[#181818] rounded-[1px] cursor-nwse-resize hover:scale-125 active:scale-110 transition-transform z-40"
                    title="Drag corner to resize"
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Text Overlays Layer */}
        {activeTextClips.map((txt) => {
          const isSelected = selectedItem?.type === 'text' && selectedItem.id === txt.id;
          return (
            <div
              key={txt.id}
              onMouseDown={(e) => handleTextMouseDown(e, txt)}
              onTouchStart={(e) => handleTextTouchStart(e, txt)}
              style={{
                left: `${txt.x}%`,
                top: `${txt.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${txt.fontSize}px`,
                fontFamily: txt.fontFamily,
                color: txt.color,
                backgroundColor: txt.backgroundColor,
                fontWeight: txt.isBold ? 'bold' : 'normal',
                fontStyle: txt.isItalic ? 'italic' : 'normal',
                textAlign: txt.textAlign,
                textShadow: txt.shadowColor ? `0 0 ${txt.shadowBlur}px ${txt.shadowColor}` : 'none',
                opacity: txt.opacity,
              }}
              className={`absolute cursor-move select-none px-2 py-0.5 rounded-[2px] transition-shadow ${isSelected
                ? 'border border-white z-30'
                : 'hover:border hover:border-white/40 z-20'
                }`}
            >
              <span>{txt.text}</span>
              {isSelected && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#181818] border border-[#383838] px-1.5 py-0.2 rounded-[2px] text-[9px] text-[#A0A0A0] font-mono flex items-center gap-1 shadow pointer-events-none whitespace-nowrap">
                  <Move className="w-2.5 h-2.5 text-[#E4E4E7]" />
                  <span>
                    X:{txt.x}% Y:{txt.y}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control Bar - Responsive Studio Style */}
      <div className="h-9 w-full max-w-lg mt-1.5 sm:mt-2 px-1.5 sm:px-2 rounded-[2px] bg-[#222222] border border-[#333333] flex items-center justify-between gap-1 z-20 shrink-0 relative">
        {/* Timecode Display - Left */}
        <div className="font-mono text-[9px] sm:text-[11px] font-normal tracking-wider text-[#A0A0A0] px-1.5 sm:px-2 py-0.5 rounded-[2px] bg-[#141414] border border-[#2d2d2d] flex items-center shrink-0 whitespace-nowrap z-10">
          <span className="text-white font-medium">{formatTimecode(currentTime)}</span>
          <span className="text-[#555555] mx-0.5 sm:mx-1">/</span>
          <span>{formatTimecode(totalDuration)}</span>
        </div>

        {/* Playback Controls (Reset to start, SkipBack, Play, SkipForward) - Center */}
        <div className="flex items-center gap-0.5 shrink-0 absolute left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => seekTo(0)}
            title="Reset to start (Home)"
            className="p-1 rounded-[2px] text-[#A0A0A0] hover:text-[#E6E6E6] hover:bg-[#2d2d2e] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => seekTo(currentTime - 1)}
            title="Step Back 1s (Left Arrow)"
            className="p-1 rounded-[2px] text-[#A0A0A0] hover:text-[#E6E6E6] hover:bg-[#2d2d2e] transition cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-6 h-6 rounded-[2px] bg-[#2d2d2e] hover:bg-[#383839] active:bg-[#252526] border border-[#383838] text-white flex items-center justify-center transition cursor-pointer"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={() => seekTo(currentTime + 1)}
            title="Step Forward 1s (Right Arrow)"
            className="p-1 rounded-[2px] text-[#A0A0A0] hover:text-[#E6E6E6] hover:bg-[#2d2d2e] transition cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume & Fullscreen - Right */}
        <div className="flex items-center gap-1.5 shrink-0 z-10 ml-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-[2px] text-[#A0A0A0] hover:text-[#E6E6E6] transition cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || masterVolume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => {
                setMasterVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-12 hidden lg:block cursor-pointer"
              title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
            />
          </div>

          <div className="h-3 w-px bg-[#333333]" />

          <button
            onClick={handleFullscreen}
            className="p-1 rounded-[2px] text-[#A0A0A0] hover:text-[#E6E6E6] hover:bg-[#2d2d2e] transition cursor-pointer"
            title="Fullscreen Preview"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
