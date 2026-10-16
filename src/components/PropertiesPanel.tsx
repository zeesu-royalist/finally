'use client';

import React from 'react';
import {
  Type,
  Music,
  Trash2,
  Scissors,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Settings2,
  Keyboard,
  Info,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Gauge,
  AudioWaveform,
  X,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';

const FONTS = ['Inter', 'Arial', 'Georgia', 'Courier New', 'Impact', 'Trebuchet MS'];

function InspectorHeader({
  title,
  icon: Icon,
  iconColor = 'text-[#8E8E8E]',
  onDelete,
  onClose,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  onDelete?: () => void;
  onClose?: () => void;
}) {
  return (
    <div>
      {onClose && <div className="w-10 h-1 rounded-full bg-[#555562] mx-auto mb-2 md:hidden" />}
      <div className="flex items-center justify-between border-b border-[#333333] pb-2.5">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E6E6E6]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded-[2px] text-[#8E8E8E] hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-[2px] text-[#8E8E8E] hover:text-white bg-[#25252c] border border-[#383842] transition md:hidden"
              title="Close inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TimingCard({ startTime, duration }: { startTime: number; duration: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 bg-[#202020] p-2 rounded-[2px] border border-[#303030]">
      <div>
        <div className="text-[10px] text-[#777777]">Start Time</div>
        <div className="text-xs font-medium text-[#E6E6E6]">{startTime.toFixed(2)}s</div>
      </div>
      <div>
        <div className="text-[10px] text-[#777777]">Duration</div>
        <div className="text-xs font-medium text-[#E6E6E6]">{duration.toFixed(2)}s</div>
      </div>
    </div>
  );
}

function SplitButton({ onClick, iconColor = 'text-[#8E8E8E]' }: { onClick: () => void; iconColor?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-1.5 px-2.5 rounded-[2px] bg-[#282828] hover:bg-[#333333] border border-[#383838] text-xs font-normal text-[#E6E6E6] flex items-center justify-center gap-1.5 transition cursor-pointer"
    >
      <Scissors className={`w-3.5 h-3.5 ${iconColor}`} />
      <span>Split at Playhead (S)</span>
    </button>
  );
}

function PropertySlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  color = 'text-[#E6E6E6]',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-1 bg-[#202020] p-2.5 rounded-[2px] border border-[#303030]">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#A0A0A0] text-[11px]">{label}</span>
        <span className={`font-mono text-[11px] font-medium ${color}`}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

function RotationSelector({
  rotation,
  color = 'text-[#E6E6E6]',
  activeBg = 'border-white bg-[#2A2A32] text-white font-medium',
  onChange,
}: {
  rotation: number;
  color?: string;
  activeBg?: string;
  onChange: (deg: number) => void;
}) {
  return (
    <div className="space-y-1.5 bg-[#202020] p-2.5 rounded-[2px] border border-[#303030]">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#A0A0A0] text-[11px]">Rotation</span>
        <span className={`font-mono text-[11px] font-medium ${color}`}>{Math.round(rotation)}°</span>
      </div>
      <input
        type="range"
        min="0"
        max="360"
        value={rotation}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full cursor-pointer"
      />
      <div className="grid grid-cols-4 gap-1 pt-1">
        {[0, 90, 180, 270].map((deg) => (
          <button
            key={deg}
            onClick={() => onChange(deg)}
            className={`py-0.5 rounded-[2px] text-[11px] font-mono border transition cursor-pointer ${Math.round(rotation) === deg
                ? activeBg
                : 'border-[#383838] bg-[#252526] text-[#A0A0A0] hover:text-white'
              }`}
          >
            {deg}°
          </button>
        ))}
      </div>
    </div>
  );
}

function SpeedControl({
  speed = 1,
  onChange,
  color = 'text-[#E6E6E6]',
  activeBg = 'border-white bg-[#2A2A32] text-white font-medium',
}: {
  speed?: number;
  onChange: (val: number) => void;
  color?: string;
  activeBg?: string;
}) {
  const currentSpeed = speed ?? 1;

  const getSpeedLabel = (s: number) => {
    if (s < 0.99) return `${s.toFixed(2)}x • Slow Motion`;
    if (s > 1.01) return `${s.toFixed(2)}x • Fast Motion`;
    return '1.00x • Normal Speed';
  };

  return (
    <div className="space-y-1.5 bg-[#202020] p-2.5 rounded-[2px] border border-[#303030]">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#A0A0A0] text-[11px] flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-[#8E8E8E]" />
          Playback Speed
        </span>
        <span className={`font-mono text-[11px] font-medium ${color}`}>
          {currentSpeed.toFixed(2)}x
        </span>
      </div>

      <div className="text-[10px] text-[#A0A0A0] px-1.5 py-0.5 rounded-[2px] bg-[#181818] border border-[#2d2d2d] inline-block font-mono">
        {getSpeedLabel(currentSpeed)}
      </div>

      <input
        type="range"
        min="0.25"
        max="4"
        step="0.05"
        value={currentSpeed}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer"
      />

      <div className="grid grid-cols-4 gap-1 pt-0.5">
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`py-0.5 rounded-[2px] text-[10px] font-mono border transition cursor-pointer ${Math.abs(currentSpeed - s) < 0.02
                ? activeBg
                : 'border-[#383838] bg-[#252526] text-[#A0A0A0] hover:text-white'
              }`}
          >
            {s}x
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[1.5, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`py-0.5 rounded-[2px] text-[10px] font-mono border transition cursor-pointer ${Math.abs(currentSpeed - s) < 0.02
                ? activeBg
                : 'border-[#383838] bg-[#252526] text-[#A0A0A0] hover:text-white'
              }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

interface PropertiesPanelProps {
  isMobileDrawerOpen?: boolean;
  onMobileClose?: () => void;
}

export default function PropertiesPanel({
  isMobileDrawerOpen = false,
  onMobileClose,
}: PropertiesPanelProps = {}) {
  const {
    selectedItem,
    videoClips,
    audioClips,
    textClips,
    imageClips,
    updateAudioClip,
    updateTextClip,
    updateImageClip,
    updateVideoClip,
    updateVideoSpeed,
    updateAudioSpeed,
    deleteSelectedItem,
    deleteClip,
    splitClipAtPlayhead,
    extractAudioFromVideo,
    aspectRatio,
    totalDuration,
    activeVideoClip,
  } = useEditor();

  const panelContainerClass = isMobileDrawerOpen
    ? 'fixed inset-x-0 bottom-0 top-12 z-40 bg-[#252526] border-t border-[#383842] rounded-t-xl shadow-2xl flex flex-col select-none overflow-y-auto p-3.5 space-y-3 pb-safe md:static md:inset-auto md:w-80 md:rounded-none md:border-t-0 md:border-l md:border-[#333333] md:p-3 md:pb-3'
    : 'hidden md:flex w-80 border-l border-[#333333] bg-[#252526] flex-col select-none shrink-0 z-20 overflow-y-auto p-3 space-y-3';

  // 1. Image Overlay Inspector
  if (selectedItem?.type === 'image') {
    const img = imageClips.find((i) => i.id === selectedItem.id);
    if (!img) return null;

    const imgOpacityValue = Math.round(
      img.opacity !== undefined
        ? img.opacity <= 1 && img.opacity > 0
          ? img.opacity * 100
          : img.opacity
        : 100
    );

    return (
      <div className={panelContainerClass}>
        <InspectorHeader title="Image Inspector" icon={ImageIcon} onDelete={deleteSelectedItem} onClose={onMobileClose} />

        <div className="p-2.5 rounded-[2px] bg-[#202020] border border-[#303030] space-y-2">
          <div className="h-24 rounded-[2px] bg-[#141414] border border-[#2a2a2a] flex items-center justify-center overflow-hidden p-2">
            <img src={img.url} alt={img.name} className="max-h-full max-w-full object-contain rounded-[1px]" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[#777777] uppercase">Image Name</label>
            <input
              type="text"
              value={img.name}
              onChange={(e) => updateImageClip(img.id, { name: e.target.value })}
              className="w-full bg-[#181818] border border-[#303030] focus:border-white rounded-[2px] px-2 py-0.5 text-xs text-[#E6E6E6] outline-none"
            />
          </div>
        </div>

        <TimingCard startTime={img.startTime} duration={img.duration} />
        <SplitButton onClick={() => splitClipAtPlayhead(img.id)} />
        <div className="space-y-1">
          <PropertySlider
            label="Scale Size"
            value={Math.round(img.width)}
            min={5}
            max={150}
            unit="%"
            color="text-[#E6E6E6]"
            onChange={(v) => updateImageClip(img.id, { width: v })}
          />
          <div className="flex items-center justify-between gap-1 px-0.5">
            {[25, 50, 75, 100, 125].map((preset) => (
              <button
                key={preset}
                onClick={() => updateImageClip(img.id, { width: preset })}
                className={`flex-1 py-0.5 rounded-[2px] text-[10px] font-mono border transition cursor-pointer ${Math.round(img.width) === preset
                    ? 'border-white bg-[#2A2A32] text-white font-medium'
                    : 'border-[#383838] bg-[#202020] text-[#A0A0A0] hover:text-white'
                  }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
        <PropertySlider label="Opacity" value={imgOpacityValue} min={0} max={100} unit="%" color="text-[#E6E6E6]" onChange={(v) => updateImageClip(img.id, { opacity: v })} />
        <RotationSelector rotation={img.rotation} onChange={(deg) => updateImageClip(img.id, { rotation: deg })} />

        <div className="space-y-2 bg-[#202020] p-2.5 rounded-[2px] border border-[#303030]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A0A0A0] text-[11px]">Position Coordinates</span>
            <span className="text-[10px] text-[#777777]">Interactive overlay</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-[#777777]">X ({Math.round(img.x)}%)</span>
              <input type="range" min="0" max="100" value={img.x} onChange={(e) => updateImageClip(img.id, { x: parseInt(e.target.value, 10) })} className="w-full mt-1" />
            </div>
            <div>
              <span className="text-[10px] text-[#777777]">Y ({Math.round(img.y)}%)</span>
              <input type="range" min="0" max="100" value={img.y} onChange={(e) => updateImageClip(img.id, { y: parseInt(e.target.value, 10) })} className="w-full mt-1" />
            </div>
          </div>
          <button
            onClick={() => updateImageClip(img.id, { x: 50, y: 50 })}
            className="w-full py-1 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] border border-[#383838] text-[11px] font-normal text-[#A0A0A0] hover:text-white transition cursor-pointer"
          >
            Center on Screen (50%, 50%)
          </button>
        </div>
      </div>
    );
  }

  // 2. Text Overlay Inspector
  if (selectedItem?.type === 'text') {
    const text = textClips.find((t) => t.id === selectedItem.id);
    if (!text) return null;

    return (
      <div className={panelContainerClass}>
        <InspectorHeader title="Text / Title Inspector" icon={Type} onDelete={deleteSelectedItem} onClose={onMobileClose} />

        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-[#777777] uppercase">Text Content</label>
          <textarea
            rows={2}
            value={text.text}
            onChange={(e) => updateTextClip(text.id, { text: e.target.value })}
            className="w-full bg-[#181818] border border-[#303030] focus:border-white rounded-[2px] p-2 text-xs text-[#E6E6E6] outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-[#777777] uppercase">Font Family</label>
            <select
              value={text.fontFamily}
              onChange={(e) => updateTextClip(text.id, { fontFamily: e.target.value })}
              className="w-full mt-1 bg-[#181818] border border-[#303030] focus:border-white rounded-[2px] px-2 py-1 text-xs text-[#E6E6E6] outline-none"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#777777] uppercase">Size ({text.fontSize}px)</label>
            <input
              type="range"
              min="16"
              max="96"
              value={text.fontSize}
              onChange={(e) => updateTextClip(text.id, { fontSize: parseInt(e.target.value, 10) })}
              className="w-full mt-2.5"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#202020] p-1 rounded-[2px] border border-[#303030]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateTextClip(text.id, { isBold: !text.isBold })}
              className={`p-1 rounded-[2px] transition ${text.isBold ? 'bg-white text-[#0D0D10] font-semibold' : 'text-[#A0A0A0] hover:text-white'}`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateTextClip(text.id, { isItalic: !text.isItalic })}
              className={`p-1 rounded-[2px] transition ${text.isItalic ? 'bg-white text-[#0D0D10] font-semibold' : 'text-[#A0A0A0] hover:text-white'}`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-3.5 w-px bg-[#333333]" />
          <div className="flex items-center gap-1">
            {(['left', 'center', 'right'] as const).map((align) => {
              const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
              return (
                <button
                  key={align}
                  onClick={() => updateTextClip(text.id, { textAlign: align })}
                  className={`p-1 rounded-[2px] transition ${text.textAlign === align ? 'bg-white text-[#0D0D10] font-semibold' : 'text-[#A0A0A0] hover:text-white'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-[#777777] uppercase">Font Color</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={text.color}
                onChange={(e) => updateTextClip(text.id, { color: e.target.value })}
                className="w-7 h-7 rounded-[2px] border border-[#383838] bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-[#A0A0A0]">{text.color}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#777777] uppercase">Background Box</label>
            <div className="flex items-center gap-1 mt-1">
              {[
                { label: 'None', val: 'transparent' },
                { label: 'Dark', val: 'rgba(0,0,0,0.7)' },
                { label: 'Slate', val: 'rgba(40,40,50,0.85)' },
                { label: 'Red', val: '#992222' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => updateTextClip(text.id, { backgroundColor: opt.val })}
                  className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono border transition ${text.backgroundColor === opt.val ? 'border-white bg-[#2A2A32] text-white font-medium' : 'border-[#383838] bg-[#202020] text-[#777777] hover:text-white'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TimingCard startTime={text.startTime} duration={text.duration} />
        <SplitButton onClick={() => splitClipAtPlayhead(text.id)} />
      </div>
    );
  }

  // 3. Audio Track Inspector
  if (selectedItem?.type === 'audio') {
    const audio = audioClips.find((a) => a.id === selectedItem.id);
    if (!audio) return null;

    const isVideoAudio = audio.trackType === 'video-audio';
    const activeBg = 'border-white bg-[#2A2A32] text-white font-medium';

    return (
      <div className={panelContainerClass}>
        <InspectorHeader
          title={isVideoAudio ? "Extracted Audio Track" : "Audio Track"}
          icon={isVideoAudio ? AudioWaveform : Music}
          onDelete={deleteSelectedItem}
          onClose={onMobileClose}
        />

        {isVideoAudio && (
          <div className="flex items-center gap-1.5 p-2 rounded-[2px] bg-[#1c1c1c] border border-[#303030] text-[#A0A0A0] text-[11px]">
            <AudioWaveform className="w-3.5 h-3.5 shrink-0 text-[#8E8E8E]" />
            <span>Detached from Video (Dedicated Lane)</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-[#777777] uppercase">Track Title</label>
          <input
            type="text"
            value={audio.name}
            onChange={(e) => updateAudioClip(audio.id, { name: e.target.value })}
            className="w-full bg-[#181818] border border-[#303030] focus:border-white rounded-[2px] px-2 py-0.5 text-xs text-[#E6E6E6] outline-none"
          />
        </div>

        <PropertySlider
          label="Track Gain / Volume"
          value={Math.round(audio.volume * 100)}
          min={0}
          max={150}
          unit="%"
          color="text-[#E6E6E6]"
          onChange={(v) => updateAudioClip(audio.id, { volume: v / 100 })}
        />

        <button
          onClick={() => updateAudioClip(audio.id, { isMuted: !audio.isMuted })}
          className={`w-full py-1.5 rounded-[2px] text-xs font-normal border transition cursor-pointer ${audio.isMuted ? 'bg-[#3b1d1d] border-rose-800 text-rose-300' : 'bg-[#252526] border-[#383838] text-[#A0A0A0] hover:text-white'
            }`}
        >
          {audio.isMuted ? 'Muted' : 'Mute Track'}
        </button>

        <TimingCard startTime={audio.startTime} duration={audio.duration} />
        <SplitButton onClick={() => splitClipAtPlayhead(audio.id)} />
        <SpeedControl
          speed={audio.speed ?? 1}
          color="text-[#E6E6E6]"
          activeBg={activeBg}
          onChange={(s) => updateAudioSpeed(audio.id, s)}
        />
      </div>
    );
  }

  // 4. Project Overview / Video Clip Inspector
  const selectedVideoClip =
    (selectedItem?.type === 'video' ? videoClips.find((c) => c.id === selectedItem.id) : null) ||
    activeVideoClip ||
    (videoClips.length > 0 ? videoClips[0] : null);

  return (
    <div className={panelContainerClass}>
      {isMobileDrawerOpen && <div className="w-10 h-1 rounded-full bg-[#555562] mx-auto mb-1 md:hidden" />}
      <div className="flex items-center justify-between border-b border-[#333333] pb-2.5">
        <div className="flex items-center gap-1.5">
          <Settings2 className="w-3.5 h-3.5 text-[#8E8E8E]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E6E6E6]">
            Project Overview
          </span>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="p-1 rounded-[2px] text-[#8E8E8E] hover:text-white bg-[#25252c] border border-[#383842] transition md:hidden"
            title="Close inspector"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {selectedVideoClip && (
        <div className="p-2.5 rounded-[2px] bg-[#202020] border border-[#303030] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-[#8E8E8E] uppercase tracking-wider">
              Selected Clip
            </span>
            <button
              onClick={() => deleteClip('video', selectedVideoClip.id)}
              className="p-1 rounded-[2px] text-[#8E8E8E] hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
              title="Delete Clip"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs font-medium text-[#E6E6E6] truncate">
            {selectedVideoClip.name}
          </div>
          <div className="text-[10px] text-[#777777]">
            Start: {selectedVideoClip.startTime.toFixed(2)}s • Duration: {selectedVideoClip.duration.toFixed(2)}s
          </div>
          <div className="flex items-center justify-between text-[11px] py-1 border-y border-[#2d2d2d]">
            <span className="text-[#A0A0A0]">Applied Look:</span>
            <span className="font-medium text-[#D4D4D8] capitalize px-1.5 py-0.2 rounded-[2px] bg-[#222228] border border-[#383842] text-[10px]">
              {selectedVideoClip.adjustments.filter && selectedVideoClip.adjustments.filter !== 'none'
                ? selectedVideoClip.adjustments.filter
                : 'Normal'}
            </span>
          </div>

          <SplitButton onClick={() => splitClipAtPlayhead(selectedVideoClip.id)} />

          <SpeedControl
            speed={selectedVideoClip.speed ?? 1}
            onChange={(s) => updateVideoSpeed(selectedVideoClip.id, s)}
          />

          <button
            onClick={() => extractAudioFromVideo(selectedVideoClip.id)}
            className="w-full py-1.5 px-2.5 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] border border-[#383838] text-xs font-normal text-[#E6E6E6] flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Split/Separate audio from video into a dedicated track right below video"
          >
            <AudioWaveform className="w-3.5 h-3.5 text-[#8E8E8E]" />
            <span>Separate Audio Track</span>
          </button>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#A0A0A0] flex items-center gap-1 text-[11px]">
                {selectedVideoClip.isMuted || selectedVideoClip.volume === 0 ? (
                  <VolumeX className="w-3 h-3 text-rose-400" />
                ) : (
                  <Volume2 className="w-3 h-3 text-[#8E8E8E]" />
                )}
                Clip Volume
              </span>
              <span className="font-mono text-[#E6E6E6] text-[10px]">
                {selectedVideoClip.isMuted ? 'Muted' : `${Math.round((selectedVideoClip.volume ?? 1) * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedVideoClip.isMuted ? 0 : (selectedVideoClip.volume ?? 1)}
              onChange={(e) => updateVideoClip(selectedVideoClip.id, { volume: parseFloat(e.target.value), isMuted: false })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Project Specs */}
      <div className="space-y-1.5">
        <div className="p-2 rounded-[2px] bg-[#202020] border border-[#303030] flex items-center justify-between">
          <span className="text-xs text-[#A0A0A0]">Aspect Ratio</span>
          <span className="text-xs font-semibold text-white">{aspectRatio}</span>
        </div>
        <div className="p-2 rounded-[2px] bg-[#202020] border border-[#303030] flex items-center justify-between">
          <span className="text-xs text-[#A0A0A0]">Total Sequence Duration</span>
          <span className="text-xs font-mono text-[#E6E6E6]">{totalDuration.toFixed(2)}s</span>
        </div>
        <div className="p-2 rounded-[2px] bg-[#202020] border border-[#303030] flex items-center justify-between">
          <span className="text-xs text-[#A0A0A0]">Active Track Clips</span>
          <span className="text-xs font-mono text-[#E6E6E6]">
            {videoClips.length + audioClips.length + textClips.length + imageClips.length}
          </span>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="space-y-1.5 border-t border-[#333333] pt-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#777777]">
          <Keyboard className="w-3 h-3 text-[#8E8E8E]" />
          <span>Keyboard Shortcuts</span>
        </div>
        <div className="space-y-1 text-xs">
          {[
            { key: 'Space', desc: 'Play / Pause video' },
            { key: 'S', desc: 'Split clip at playhead' },
            { key: 'Delete', desc: 'Delete selected clip' },
            { key: '⌘Z / Ctrl+Z', desc: 'Undo' },
            { key: '⌘Y / Ctrl+Y', desc: 'Redo' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-1 px-2 rounded-[2px] bg-[#202020] border border-[#2b2b2b]">
              <span className="text-[#A0A0A0] text-[11px]">{item.desc}</span>
              <kbd className="px-1.5 py-0.2 rounded-[2px] bg-[#181818] border border-[#333333] text-[9px] font-mono text-[#cccccc]">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 rounded-[2px] bg-[#1c1c1c] border border-[#303030] text-xs text-[#A0A0A0] flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#8E8E8E]" />
        <p className="text-[10px] leading-relaxed text-[#A0A0A0]">
          Lumetri color &amp; filter adjustments are in the Left Panel <span className="text-[#E6E6E6]">Color</span> tab.
        </p>
      </div>
    </div>
  );
}
