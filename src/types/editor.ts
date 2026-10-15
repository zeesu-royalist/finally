export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type ThemeId = 'obsidian' | 'midnight' | 'slate' | 'crimson';

export interface VideoClip {
  id: string;
  name: string;
  url: string;
  mediaId?: string;       // persistent IndexedDB media blob key
  sourceDuration: number; // total duration of the original source file in seconds
  startTime: number;      // position in the timeline in seconds
  duration: number;       // active duration on timeline in seconds
  offsetStart: number;    // trimmed offset from beginning of media in seconds
  speed?: number;         // playback rate multiplier, default 1 (e.g. 0.25 to 4)
  volume: number;         // 0 to 1
  isMuted: boolean;
  adjustments: {
    brightness: number;   // -100 to 100 (0 default)
    contrast: number;     // -100 to 100 (0 default)
    saturation: number;   // -100 to 100 (0 default)
    highlights?: number;  // -100 to 100 (0 default)
    blur?: number;        // 0 to 20 px (0 default)
    hueRotate?: number;   // -180 to 180 deg (0 default)
    sepia?: number;       // 0 to 100% (0 default)
    grayscale?: number;   // 0 to 100% (0 default)
    invert?: number;      // 0 to 100% (0 default)
    opacity?: number;     // 0 to 100% (100 default)
    rotation: number;     // 0, 90, 180, 270
    filter: string;       // 'none' | 'cinematic' | 'vintage' | 'noir' | 'cyber' | 'emerald' | 'sunset' | 'dreamy'
  };
}

export interface AudioClip {
  id: string;
  name: string;
  url: string;
  mediaId?: string;       // persistent IndexedDB media blob key
  sourceDuration: number;
  startTime: number;
  duration: number;
  offsetStart: number;
  speed?: number;         // playback rate multiplier, default 1
  volume: number; // 0 to 2
  isMuted: boolean;
  trackType?: 'video-audio' | 'music'; // 'video-audio' for detached audio from video, 'music' for background tracks
  sourceVideoClipId?: string;
}

export interface TextClip {
  id: string;
  text: string;
  startTime: number;
  duration: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  fontSize: number; // px
  fontFamily: string;
  color: string;
  backgroundColor: string;
  isBold: boolean;
  isItalic: boolean;
  textAlign: 'left' | 'center' | 'right';
  shadowColor: string;
  shadowBlur: number;
  opacity: number;
}

export interface ImageClip {
  id: string;
  name: string;
  url: string;
  mediaId?: string;       // persistent IndexedDB media blob key
  startTime: number;
  duration: number; // seconds
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 10 - 100 of canvas width
  opacity: number; // 0 - 100
  rotation: number; // 0, 90, 180, 270
}

export interface SavedProject {
  id: string;             // 'current_project'
  projectTitle: string;
  aspectRatio: AspectRatio;
  theme: ThemeId;
  currentTime: number;
  videoClips: VideoClip[];
  imageClips: ImageClip[];
  audioClips: AudioClip[];
  textClips: TextClip[];
  updatedAt: number;
}

export interface ProjectSettings {
  title: string;
  aspectRatio: AspectRatio;
  theme: ThemeId;
  totalDuration: number; // minimum or calculated timeline duration
}

export type SelectedItem = 
  | { type: 'video'; id: string }
  | { type: 'image'; id: string }
  | { type: 'text'; id: string }
  | { type: 'audio'; id: string }
  | null;

export interface EditorHistorySnapshot {
  videoClips: VideoClip[];
  imageClips: ImageClip[];
  audioClips: AudioClip[];
  textClips: TextClip[];
  aspectRatio: AspectRatio;
}
