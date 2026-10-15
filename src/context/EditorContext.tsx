'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import {
  AspectRatio,
  ThemeId,
  VideoClip,
  AudioClip,
  TextClip,
  ImageClip,
  SelectedItem,
  EditorHistorySnapshot,
  SavedProject,
} from '../types/editor';
import { exportEditedVideo, ExportProgress } from '../utils/videoExporter';
import { DEFAULT_ADJUSTMENTS } from '../utils/filterUtils';
import {
  saveMediaBlob,
  getProjectData,
  saveProjectData,
  clearAllProjectData,
  rehydrateClips,
  urlToBlob,
} from '../utils/storageDB';

export type SaveStatus = 'saved' | 'saving' | 'idle';

interface EditorContextType {
  // State
  videoClips: VideoClip[];
  imageClips: ImageClip[];
  audioClips: AudioClip[];
  textClips: TextClip[];
  currentTime: number;
  isPlaying: boolean;
  aspectRatio: AspectRatio;
  theme: ThemeId;
  projectTitle: string;
  selectedItem: SelectedItem;
  totalDuration: number;
  timelineZoom: number;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
  isExportModalOpen: boolean;
  exportProgress: ExportProgress | null;
  exportedVideo: { blob: Blob; url: string; mimeType: string; format: 'mp4' | 'webm' } | null;
  activeVideoClip: VideoClip | null;
  activeImageClips: ImageClip[];
  activeAudioClips: AudioClip[];
  activeTextClips: TextClip[];

  // Mutators
  setProjectTitle: (title: string) => void;
  setTheme: (theme: ThemeId) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setTimelineZoom: (zoom: number | ((prev: number) => number)) => void;
  setSelectedItem: (item: SelectedItem) => void;
  seekTo: (time: number) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;

  // Clip actions
  addVideoClip: (source: File | string, name?: string, duration?: number) => Promise<void>;
  addImageClip: (source: File | string, name?: string, duration?: number) => Promise<void>;
  addAudioClip: (source: File | string, name?: string, duration?: number) => Promise<void>;
  addTextClip: (preset?: Partial<TextClip>) => void;
  updateVideoClip: (id: string, updates: Partial<VideoClip>) => void;
  updateImageClip: (id: string, updates: Partial<ImageClip>) => void;
  updateAudioClip: (id: string, updates: Partial<AudioClip>) => void;
  updateTextClip: (id: string, updates: Partial<TextClip>) => void;
  deleteClip: (type: 'video' | 'image' | 'text' | 'audio', id: string) => void;
  deleteSelectedItem: () => void;
  splitClipAtPlayhead: (specificId?: string) => void;
  extractAudioFromVideo: (videoClipId?: string) => void;
  updateVideoSpeed: (id: string, speed: number) => void;
  updateAudioSpeed: (id: string, speed: number) => void;
  moveClip: (type: 'video' | 'image' | 'text' | 'audio', id: string, newStartTime: number) => void;
  trimClip: (
    type: 'video' | 'image' | 'text' | 'audio',
    id: string,
    edge: 'start' | 'end',
    deltaSeconds: number
  ) => void;

  // History & Projects
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  createNewProject: () => Promise<void>;

  // Export
  openExportModal: () => void;
  closeExportModal: () => void;
  startExport: (format?: 'mp4' | 'webm') => Promise<void>;
}

const EditorContext = createContext<EditorContextType | null>(null);

function cloneClipsForSnapshot(
  videoClips: VideoClip[],
  imageClips: ImageClip[],
  audioClips: AudioClip[],
  textClips: TextClip[],
  aspectRatio: AspectRatio
): EditorHistorySnapshot {
  return {
    videoClips: videoClips.map((c) => ({ ...c, adjustments: { ...c.adjustments } })),
    imageClips: imageClips.map((c) => ({ ...c })),
    audioClips: audioClips.map((c) => ({ ...c })),
    textClips: textClips.map((c) => ({ ...c })),
    aspectRatio,
  };
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [projectTitle, setProjectTitle] = useState('Zeesu Royalist Project');
  const [aspectRatio, setAspectRatioState] = useState<AspectRatio>('16:9');
  const [theme, setThemeState] = useState<ThemeId>('obsidian');
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [imageClips, setImageClips] = useState<ImageClip[]>([]);
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [textClips, setTextClips] = useState<TextClip[]>([]);

  const [undoStack, setUndoStack] = useState<EditorHistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorHistorySnapshot[]>([]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportedVideo, setExportedVideo] = useState<{
    blob: Blob;
    url: string;
    mimeType: string;
    format: 'mp4' | 'webm';
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const isInitialLoadDoneRef = useRef(false);

  const lastPlayTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const saveSnapshot = useCallback(() => {
    setUndoStack((prev) => [
      ...prev.slice(-30),
      cloneClipsForSnapshot(videoClips, imageClips, audioClips, textClips, aspectRatio),
    ]);
    setRedoStack([]);
  }, [videoClips, imageClips, audioClips, textClips, aspectRatio]);

  const totalDuration = Math.max(
    5,
    ...videoClips.map((c) => c.startTime + c.duration),
    ...imageClips.map((c) => c.startTime + c.duration),
    ...audioClips.map((c) => c.startTime + c.duration),
    ...textClips.map((c) => c.startTime + c.duration)
  );

  const activeVideoClip =
    videoClips.find((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration) || null;

  const activeImageClips = imageClips.filter(
    (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
  );

  const activeAudioClips = audioClips.filter(
    (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
  );

  const activeTextClips = textClips.filter(
    (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
  );

  const seekTo = useCallback(
    (time: number) => {
      setCurrentTimeState(Math.max(0, Math.min(totalDuration, time)));
    },
    [totalDuration]
  );

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      lastPlayTimeRef.current = null;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const onFrame = (timestamp: number) => {
      if (lastPlayTimeRef.current === null) {
        lastPlayTimeRef.current = timestamp;
      }
      const deltaSec = (timestamp - lastPlayTimeRef.current) / 1000;
      lastPlayTimeRef.current = timestamp;

      setCurrentTimeState((prev) => {
        const nextTime = prev + deltaSec;
        if (nextTime >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return nextTime;
      });

      animationFrameRef.current = requestAnimationFrame(onFrame);
    };

    animationFrameRef.current = requestAnimationFrame(onFrame);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  const setAspectRatio = useCallback(
    (ratio: AspectRatio) => {
      saveSnapshot();
      setAspectRatioState(ratio);
    },
    [saveSnapshot]
  );

  // Undo / Redo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [
      ...prev,
      cloneClipsForSnapshot(videoClips, imageClips, audioClips, textClips, aspectRatio),
    ]);
    setVideoClips(previous.videoClips || []);
    setImageClips(previous.imageClips || []);
    setAudioClips(previous.audioClips || []);
    setTextClips(previous.textClips || []);
    setAspectRatioState(previous.aspectRatio);
    setUndoStack((prev) => prev.slice(0, -1));
  }, [undoStack, videoClips, imageClips, audioClips, textClips, aspectRatio]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [
      ...prev,
      cloneClipsForSnapshot(videoClips, imageClips, audioClips, textClips, aspectRatio),
    ]);
    setVideoClips(nextState.videoClips || []);
    setImageClips(nextState.imageClips || []);
    setAudioClips(nextState.audioClips || []);
    setTextClips(nextState.textClips || []);
    setAspectRatioState(nextState.aspectRatio);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [redoStack, videoClips, imageClips, audioClips, textClips, aspectRatio]);

  // Project persistence
  const createNewProject = useCallback(async () => {
    try {
      await clearAllProjectData();
      setVideoClips([]);
      setImageClips([]);
      setAudioClips([]);
      setTextClips([]);
      setProjectTitle('Zeesu Royalist Project');
      setAspectRatioState('16:9');
      setCurrentTimeState(0);
      setSelectedItem(null);
      setUndoStack([]);
      setRedoStack([]);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to create new project:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function restoreProject() {
      try {
        const saved = await getProjectData();
        if (!isMounted || !saved) return;
        const restored = await rehydrateClips(
          saved.videoClips || [],
          saved.imageClips || [],
          saved.audioClips || []
        );
        if (!isMounted) return;

        setVideoClips(restored.videoClips);
        setImageClips(restored.imageClips);
        setAudioClips(restored.audioClips);
        setTextClips(saved.textClips || []);
        if (saved.projectTitle) setProjectTitle(saved.projectTitle);
        if (saved.aspectRatio) setAspectRatioState(saved.aspectRatio);
        if (saved.theme) {
          setThemeState(saved.theme);
          document.documentElement.setAttribute('data-theme', saved.theme);
        }
        if (typeof saved.currentTime === 'number') setCurrentTimeState(saved.currentTime);
        if (restored.videoClips.length > 0) {
          setSelectedItem({ type: 'video', id: restored.videoClips[0].id });
        }
        setSaveStatus('saved');
      } catch (err) {
        console.warn('Failed to restore project from IndexedDB:', err);
      } finally {
        if (isMounted) isInitialLoadDoneRef.current = true;
      }
    }
    restoreProject();
    return () => { isMounted = false; };
  }, []);

  // Debounced Auto-Save
  useEffect(() => {
    if (!isInitialLoadDoneRef.current || isPlaying) return;
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const projectPayload: SavedProject = {
          id: 'current_project',
          projectTitle,
          aspectRatio,
          theme,
          currentTime,
          videoClips,
          imageClips,
          audioClips,
          textClips,
          updatedAt: Date.now(),
        };
        await saveProjectData(projectPayload);
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('idle');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [videoClips, imageClips, audioClips, textClips, projectTitle, aspectRatio, theme, currentTime, isPlaying]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (videoClips.length > 0 || imageClips.length > 0 || audioClips.length > 0 || textClips.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [videoClips.length, imageClips.length, audioClips.length, textClips.length]);

  // Video Clips
  const addVideoClip = async (source: File | string, name?: string, knownDuration?: number) => {
    saveSnapshot();
    let url: string;
    let clipName: string;
    const mediaId = 'media_vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    if (typeof source === 'string') {
      url = source;
      clipName = name || 'Video Clip';
      urlToBlob(source).then((b) => saveMediaBlob(mediaId, b, clipName, b.type || 'video/mp4')).catch(() => { });
    } else {
      url = URL.createObjectURL(source);
      clipName = source.name;
      await saveMediaBlob(mediaId, source, clipName, source.type || 'video/mp4');
    }

    let dur = knownDuration || 5;
    if (!knownDuration) {
      try {
        const vid = document.createElement('video');
        vid.src = url;
        await new Promise<void>((res) => {
          vid.onloadedmetadata = () => { dur = vid.duration && !isNaN(vid.duration) ? vid.duration : 5; res(); };
          vid.onerror = () => res();
        });
      } catch {
        dur = 5;
      }
    }

    const lastVideoEnd = videoClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
    const newClip: VideoClip = {
      id: 'vid_' + Math.random().toString(36).substring(2, 9),
      name: clipName,
      url,
      mediaId,
      sourceDuration: dur,
      startTime: lastVideoEnd,
      duration: dur,
      offsetStart: 0,
      speed: 1,
      volume: 1,
      isMuted: false,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
    };

    setVideoClips((prev) => [...prev, newClip]);
    setSelectedItem({ type: 'video', id: newClip.id });
  };

  const updateVideoClip = (id: string, updates: Partial<VideoClip>) => {
    saveSnapshot();
    setVideoClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Audio Clips
  const addAudioClip = async (source: File | string, name?: string, knownDuration?: number) => {
    saveSnapshot();
    let url: string;
    let audioName: string;
    const mediaId = 'media_aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    if (typeof source === 'string') {
      url = source;
      audioName = name || 'Audio Track';
      urlToBlob(source).then((b) => saveMediaBlob(mediaId, b, audioName, b.type || 'audio/mp3')).catch(() => { });
    } else {
      url = URL.createObjectURL(source);
      audioName = source.name;
      await saveMediaBlob(mediaId, source, audioName, source.type || 'audio/mp3');
    }

    let dur = knownDuration || 8;
    if (!knownDuration) {
      try {
        const aud = document.createElement('audio');
        aud.src = url;
        await new Promise<void>((res) => {
          aud.onloadedmetadata = () => { dur = aud.duration && !isNaN(aud.duration) ? dur : 8; res(); };
          aud.onerror = () => res();
        });
      } catch {
        dur = 8;
      }
    }

    const lastAudioEnd = audioClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
    const newClip: AudioClip = {
      id: 'aud_' + Math.random().toString(36).substring(2, 9),
      name: audioName,
      url,
      mediaId,
      sourceDuration: dur,
      startTime: lastAudioEnd,
      duration: dur,
      offsetStart: 0,
      speed: 1,
      volume: 0.8,
      isMuted: false,
    };

    setAudioClips((prev) => [...prev, newClip]);
    setSelectedItem({ type: 'audio', id: newClip.id });
  };

  const updateAudioClip = (id: string, updates: Partial<AudioClip>) => {
    saveSnapshot();
    setAudioClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Text Clips
  const addTextClip = (preset?: Partial<TextClip>) => {
    saveSnapshot();
    const newText: TextClip = {
      id: 'txt_' + Math.random().toString(36).substring(2, 9),
      text: preset?.text || 'finally Text',
      startTime: currentTime,
      duration: preset?.duration || 4,
      x: preset?.x ?? 50,
      y: preset?.y ?? 50,
      fontSize: preset?.fontSize ?? 36,
      fontFamily: preset?.fontFamily ?? 'Inter',
      color: preset?.color ?? '#ffffff',
      backgroundColor: preset?.backgroundColor ?? 'transparent',
      isBold: preset?.isBold ?? true,
      isItalic: preset?.isItalic ?? false,
      textAlign: preset?.textAlign ?? 'center',
      shadowColor: preset?.shadowColor ?? 'rgba(0,0,0,0.8)',
      shadowBlur: preset?.shadowBlur ?? 8,
      opacity: preset?.opacity ?? 1,
    };
    setTextClips((prev) => [...prev, newText]);
    setSelectedItem({ type: 'text', id: newText.id });
  };

  const updateTextClip = (id: string, updates: Partial<TextClip>) => {
    if (!('x' in updates && 'y' in updates && Object.keys(updates).length <= 2)) {
      saveSnapshot();
    }
    setTextClips((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  // Image Clips
  const addImageClip = async (source: File | string, name?: string, duration = 5) => {
    saveSnapshot();
    let url: string;
    let clipName: string;
    const mediaId = 'media_img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    if (typeof source === 'string') {
      url = source;
      clipName = name || 'Image Overlay';
      urlToBlob(source).then((b) => saveMediaBlob(mediaId, b, clipName, b.type || 'image/png')).catch(() => { });
    } else {
      url = URL.createObjectURL(source);
      clipName = name || source.name;
      await saveMediaBlob(mediaId, source, clipName, source.type || 'image/png');
    }

    const newImage: ImageClip = {
      id: 'img_' + Math.random().toString(36).substring(2, 9),
      name: clipName,
      url,
      mediaId,
      startTime: currentTime,
      duration,
      x: 50,
      y: 50,
      width: 35,
      opacity: 100,
      rotation: 0,
    };
    setImageClips((prev) => [...prev, newImage]);
    setSelectedItem({ type: 'image', id: newImage.id });
  };

  const updateImageClip = (id: string, updates: Partial<ImageClip>) => {
    if (
      !('x' in updates && 'y' in updates && Object.keys(updates).length <= 2) &&
      !('width' in updates && Object.keys(updates).length === 1)
    ) {
      saveSnapshot();
    }
    setImageClips((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)));
  };

  // DRY Unified Mutators: Delete, Move, Trim
  const deleteClip = (type: 'video' | 'image' | 'text' | 'audio', id: string) => {
    saveSnapshot();
    const setters: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
      video: setVideoClips,
      image: setImageClips,
      audio: setAudioClips,
      text: setTextClips,
    };
    setters[type]?.((prev) => prev.filter((c) => c.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const deleteSelectedItem = () => {
    if (selectedItem) deleteClip(selectedItem.type, selectedItem.id);
    else if (activeVideoClip) deleteClip('video', activeVideoClip.id);
    else if (imageClips.length > 0) deleteClip('image', imageClips[imageClips.length - 1].id);
    else if (videoClips.length > 0) deleteClip('video', videoClips[videoClips.length - 1].id);
  };

  const moveClip = (type: 'video' | 'image' | 'text' | 'audio', id: string, newStartTime: number) => {
    saveSnapshot();
    const safeStart = Math.max(0, newStartTime);
    const setters: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
      video: setVideoClips,
      image: setImageClips,
      audio: setAudioClips,
      text: setTextClips,
    };
    setters[type]?.((prev) => prev.map((c) => (c.id === id ? { ...c, startTime: safeStart } : c)));
  };

  const trimClip = (
    type: 'video' | 'image' | 'text' | 'audio',
    id: string,
    edge: 'start' | 'end',
    deltaSeconds: number
  ) => {
    saveSnapshot();
    const minDur = 0.5;

    if (type === 'video' || type === 'audio') {
      const setter = type === 'video' ? setVideoClips : setAudioClips;
      setter((prev: any[]) =>
        prev.map((clip) => {
          if (clip.id !== id) return clip;
          const speed = clip.speed ?? 1;
          if (edge === 'start') {
            const proposedOffset = clip.offsetStart + (deltaSeconds * speed);
            const proposedDuration = clip.duration - deltaSeconds;
            if (proposedDuration < minDur || proposedOffset < 0) return clip;
            return { ...clip, startTime: clip.startTime + deltaSeconds, duration: proposedDuration, offsetStart: proposedOffset };
          } else {
            const proposedDuration = clip.duration + deltaSeconds;
            const maxAvailTimeline = (clip.sourceDuration - clip.offsetStart) / speed;
            if (proposedDuration < minDur || proposedDuration > maxAvailTimeline) return clip;
            return { ...clip, duration: proposedDuration };
          }
        })
      );
    } else {
      const setter = type === 'image' ? setImageClips : setTextClips;
      setter((prev: any[]) =>
        prev.map((clip) => {
          if (clip.id !== id) return clip;
          if (edge === 'start') {
            const proposedDuration = clip.duration - deltaSeconds;
            if (proposedDuration < minDur) return clip;
            return { ...clip, startTime: clip.startTime + deltaSeconds, duration: proposedDuration };
          } else {
            const proposedDuration = clip.duration + deltaSeconds;
            if (proposedDuration < minDur) return clip;
            return { ...clip, duration: proposedDuration };
          }
        })
      );
    }
  };

  // Adjust video playback speed with ripple shifting of subsequent clips
  const updateVideoSpeed = (id: string, newSpeed: number) => {
    const speed = Math.max(0.25, Math.min(4, Math.round(newSpeed * 100) / 100));
    saveSnapshot();

    setVideoClips((prev) => {
      const targetIndex = prev.findIndex((c) => c.id === id);
      if (targetIndex === -1) return prev;

      const target = prev[targetIndex];
      const oldSpeed = target.speed ?? 1;
      if (Math.abs(oldSpeed - speed) < 0.001) return prev;

      const mediaSpan = target.duration * oldSpeed;
      const newDuration = Math.max(0.2, mediaSpan / speed);
      const deltaDuration = newDuration - target.duration;

      const updatedTarget: VideoClip = {
        ...target,
        speed,
        duration: newDuration,
      };

      const oldEndTime = target.startTime + target.duration;

      return prev.map((c, i) => {
        if (i === targetIndex) return updatedTarget;
        if (c.startTime >= oldEndTime - 0.05) {
          const shiftedStart = Math.max(0, c.startTime + deltaDuration);
          return { ...c, startTime: shiftedStart };
        }
        return c;
      });
    });
  };

  // Adjust audio playback speed with ripple shifting of subsequent clips
  const updateAudioSpeed = (id: string, newSpeed: number) => {
    const speed = Math.max(0.25, Math.min(4, Math.round(newSpeed * 100) / 100));
    saveSnapshot();

    setAudioClips((prev) => {
      const targetIndex = prev.findIndex((c) => c.id === id);
      if (targetIndex === -1) return prev;

      const target = prev[targetIndex];
      const oldSpeed = target.speed ?? 1;
      if (Math.abs(oldSpeed - speed) < 0.001) return prev;

      const mediaSpan = target.duration * oldSpeed;
      const newDuration = Math.max(0.2, mediaSpan / speed);
      const deltaDuration = newDuration - target.duration;

      const updatedTarget: AudioClip = {
        ...target,
        speed,
        duration: newDuration,
      };

      const oldEndTime = target.startTime + target.duration;

      return prev.map((c, i) => {
        if (i === targetIndex) return updatedTarget;
        if (c.startTime >= oldEndTime - 0.05) {
          const shiftedStart = Math.max(0, c.startTime + deltaDuration);
          return { ...c, startTime: shiftedStart };
        }
        return c;
      });
    });
  };

  // Split Clip at Playhead
  const splitClipAtPlayhead = (specificId?: string) => {
    let targetType: 'video' | 'audio' | 'image' | 'text' | null = null;
    let targetClip: VideoClip | AudioClip | ImageClip | TextClip | null = null;

    if (specificId) {
      // 1. If explicit ID provided, find that specific clip only
      const v = videoClips.find((c) => c.id === specificId);
      if (v) {
        targetType = 'video';
        targetClip = v;
      } else {
        const a = audioClips.find((c) => c.id === specificId);
        if (a) {
          targetType = 'audio';
          targetClip = a;
        } else {
          const img = imageClips.find((c) => c.id === specificId);
          if (img) {
            targetType = 'image';
            targetClip = img;
          } else {
            const t = textClips.find((c) => c.id === specificId);
            if (t) {
              targetType = 'text';
              targetClip = t;
            }
          }
        }
      }
    } else if (selectedItem) {
      // 2. If a clip is selected, strictly prioritize the selected clip if playhead is within it
      if (selectedItem.type === 'video') {
        const v = videoClips.find((c) => c.id === selectedItem.id);
        if (v && currentTime > v.startTime && currentTime < v.startTime + v.duration) {
          targetType = 'video';
          targetClip = v;
        }
      } else if (selectedItem.type === 'audio') {
        const a = audioClips.find((c) => c.id === selectedItem.id);
        if (a && currentTime > a.startTime && currentTime < a.startTime + a.duration) {
          targetType = 'audio';
          targetClip = a;
        }
      } else if (selectedItem.type === 'image') {
        const img = imageClips.find((c) => c.id === selectedItem.id);
        if (img && currentTime > img.startTime && currentTime < img.startTime + img.duration) {
          targetType = 'image';
          targetClip = img;
        }
      } else if (selectedItem.type === 'text') {
        const t = textClips.find((c) => c.id === selectedItem.id);
        if (t && currentTime > t.startTime && currentTime < t.startTime + t.duration) {
          targetType = 'text';
          targetClip = t;
        }
      }
    }

    // 3. Fallback: If nothing was targeted yet, find active clip under playhead
    if (!targetClip && !specificId) {
      const v = videoClips.find((c) => currentTime > c.startTime && currentTime < c.startTime + c.duration);
      if (v) {
        targetType = 'video';
        targetClip = v;
      } else {
        const img = imageClips.find((c) => currentTime > c.startTime && currentTime < c.startTime + c.duration);
        if (img) {
          targetType = 'image';
          targetClip = img;
        } else {
          const a = audioClips.find((c) => currentTime > c.startTime && currentTime < c.startTime + c.duration);
          if (a) {
            targetType = 'audio';
            targetClip = a;
          } else {
            const t = textClips.find((c) => currentTime > c.startTime && currentTime < c.startTime + c.duration);
            if (t) {
              targetType = 'text';
              targetClip = t;
            }
          }
        }
      }
    }

    if (!targetClip || !targetType) return;

    // Minimum boundary margin (0.05s) to avoid zero-duration fragments
    const minEdge = 0.05;
    if (
      currentTime <= targetClip.startTime + minEdge ||
      currentTime >= targetClip.startTime + targetClip.duration - minEdge
    ) {
      return;
    }

    saveSnapshot();
    const splitTimeOffset = currentTime - targetClip.startTime;

    if (targetType === 'video') {
      const v = targetClip as VideoClip;
      const speed = v.speed ?? 1;
      const mediaSplitOffset = splitTimeOffset * speed;
      const clip1: VideoClip = { ...v, duration: splitTimeOffset, speed };
      const clip2: VideoClip = {
        ...v,
        id: 'vid_' + Math.random().toString(36).substring(2, 9),
        name: `${v.name.replace(/ \(Part \d+\)$/, '')} (Part 2)`,
        startTime: currentTime,
        offsetStart: v.offsetStart + mediaSplitOffset,
        duration: v.duration - splitTimeOffset,
        speed,
      };
      setVideoClips((prev) => prev.map((c) => (c.id === v.id ? clip1 : c)).concat(clip2));
      setSelectedItem({ type: 'video', id: clip2.id });
    } else if (targetType === 'audio') {
      const a = targetClip as AudioClip;
      const speed = a.speed ?? 1;
      const mediaSplitOffset = splitTimeOffset * speed;
      const audio1: AudioClip = { ...a, duration: splitTimeOffset, speed, trackType: a.trackType };
      const audio2: AudioClip = {
        ...a,
        id: 'aud_' + Math.random().toString(36).substring(2, 9),
        name: `${a.name.replace(/ \(Part \d+\)$/, '')} (Part 2)`,
        startTime: currentTime,
        offsetStart: a.offsetStart + mediaSplitOffset,
        duration: a.duration - splitTimeOffset,
        speed,
        trackType: a.trackType,
      };
      setAudioClips((prev) => prev.map((c) => (c.id === a.id ? audio1 : c)).concat(audio2));
      setSelectedItem({ type: 'audio', id: audio2.id });
    } else if (targetType === 'image') {
      const img = targetClip as ImageClip;
      const img1: ImageClip = { ...img, duration: splitTimeOffset };
      const img2: ImageClip = {
        ...img,
        id: 'img_' + Math.random().toString(36).substring(2, 9),
        name: `${img.name.replace(/ \(Part \d+\)$/, '')} (Part 2)`,
        startTime: currentTime,
        duration: img.duration - splitTimeOffset,
      };
      setImageClips((prev) => prev.map((c) => (c.id === img.id ? img1 : c)).concat(img2));
      setSelectedItem({ type: 'image', id: img2.id });
    } else if (targetType === 'text') {
      const txt = targetClip as TextClip;
      const text1: TextClip = { ...txt, duration: splitTimeOffset };
      const text2: TextClip = {
        ...txt,
        id: 'txt_' + Math.random().toString(36).substring(2, 9),
        startTime: currentTime,
        duration: txt.duration - splitTimeOffset,
      };
      setTextClips((prev) => prev.map((c) => (c.id === txt.id ? text1 : c)).concat(text2));
      setSelectedItem({ type: 'text', id: text2.id });
    }
  };

  // Extract / Detach Audio from Video Clip to dedicated Video Audio Track
  const extractAudioFromVideo = (videoClipId?: string) => {
    const target = videoClipId
      ? videoClips.find((v) => v.id === videoClipId)
      : (selectedItem?.type === 'video' ? videoClips.find((v) => v.id === selectedItem.id) : null) ||
      activeVideoClip ||
      (videoClips.length > 0 ? videoClips[0] : null);

    if (!target) return;
    saveSnapshot();

    const newAudio: AudioClip = {
      id: 'aud_' + Math.random().toString(36).substring(2, 9),
      name: `${target.name.replace(/ \(Part \d+\)$/, '').replace(/ \(Audio\)$/, '')} (Audio)`,
      url: target.url,
      mediaId: target.mediaId,
      sourceDuration: target.sourceDuration,
      startTime: target.startTime,
      duration: target.duration,
      offsetStart: target.offsetStart,
      speed: target.speed ?? 1,
      volume: target.volume ?? 1,
      isMuted: false,
      trackType: 'video-audio',
      sourceVideoClipId: target.id,
    };

    setAudioClips((prev) => [...prev, newAudio]);
    setVideoClips((prev) => prev.map((v) => (v.id === target.id ? { ...v, isMuted: true } : v)));
    setSelectedItem({ type: 'audio', id: newAudio.id });
  };

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => {
    setIsExportModalOpen(false);
    setExportProgress(null);
  };

  const startExport = async (format: 'mp4' | 'webm' = 'mp4') => {
    try {
      pause();
      setExportProgress({ progress: 1, status: 'Starting render...' });
      const result = await exportEditedVideo({
        videoClips,
        imageClips,
        audioClips,
        textClips,
        aspectRatio,
        totalDuration,
        format,
        onProgress: (p) => setExportProgress(p),
      });
      setExportedVideo(result);
    } catch (err) {
      setExportProgress({ progress: 0, status: 'Export error: ' + String(err) });
    }
  };

  // Keyboard shortcuts
  const handlersRef = useRef({
    togglePlay,
    undo,
    redo,
    deleteSelectedItem,
    splitClipAtPlayhead,
    selectedItem,
  });

  useEffect(() => {
    handlersRef.current = {
      togglePlay,
      undo,
      redo,
      deleteSelectedItem,
      splitClipAtPlayhead,
      selectedItem,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlersRef.current.togglePlay();
      } else if (e.code === 'KeyZ' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        handlersRef.current.undo();
      } else if (
        (e.code === 'KeyZ' && (e.metaKey || e.ctrlKey) && e.shiftKey) ||
        (e.code === 'KeyY' && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        handlersRef.current.redo();
      } else if (e.code === 'Backspace' || e.code === 'Delete') {
        if (handlersRef.current.selectedItem) {
          e.preventDefault();
          handlersRef.current.deleteSelectedItem();
        }
      } else if (e.code === 'KeyS' && !e.metaKey && !e.ctrlKey) {
        handlersRef.current.splitClipAtPlayhead();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        videoClips,
        imageClips,
        audioClips,
        textClips,
        currentTime,
        isPlaying,
        aspectRatio,
        theme,
        projectTitle,
        selectedItem,
        totalDuration,
        timelineZoom,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        saveStatus,
        isExportModalOpen,
        exportProgress,
        exportedVideo,
        activeVideoClip,
        activeImageClips,
        activeAudioClips,
        activeTextClips,

        setProjectTitle,
        setTheme,
        setAspectRatio,
        setTimelineZoom,
        setSelectedItem,
        seekTo,
        togglePlay,
        play,
        pause,

        addVideoClip,
        addImageClip,
        addAudioClip,
        addTextClip,
        updateVideoClip,
        updateImageClip,
        updateAudioClip,
        updateTextClip,
        deleteClip,
        deleteSelectedItem,
        splitClipAtPlayhead,
        extractAudioFromVideo,
        updateVideoSpeed,
        updateAudioSpeed,
        moveClip,
        trimClip,

        saveSnapshot,
        undo,
        redo,
        createNewProject,

        openExportModal,
        closeExportModal,
        startExport,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within an EditorProvider');
  return ctx;
}
