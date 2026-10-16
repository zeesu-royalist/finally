'use client';

import React, { useState } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Film,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { getResolutionForAspectRatio } from '../utils/videoExporter';

export default function ExportModal() {
  const {
    isExportModalOpen,
    closeExportModal,
    startExport,
    exportProgress,
    exportedVideo,
    aspectRatio,
    totalDuration,
    videoClips,
    audioClips,
    textClips,
  } = useEditor();

  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'webm'>('mp4');

  if (!isExportModalOpen) return null;

  const resolution = getResolutionForAspectRatio(aspectRatio);
  const isExporting =
    exportProgress !== null &&
    exportProgress.progress < 100 &&
    !exportProgress.status.startsWith('Export error');
  const isComplete = exportProgress?.progress === 100 && exportedVideo !== null;
  const isError = exportProgress?.status.startsWith('Export error');

  const handleDownload = () => {
    if (!exportedVideo) return;
    const ext = exportedVideo.format || (exportedVideo.mimeType.includes('mp4') ? 'mp4' : 'webm');
    const a = document.createElement('a');
    a.href = exportedVideo.url;
    a.download = `finally_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStart = () => {
    startExport(selectedFormat);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2.5 sm:p-4 select-none">
      <div className="w-full max-w-lg max-h-[92dvh] bg-[#252526] border border-[#3e3e3e] rounded-[3px] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-[#333333] flex items-center justify-between bg-[#202020] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] bg-[#222228] border border-[#383842] flex items-center justify-center">
              <Film className="w-3 h-3 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#E6E6E6]">
                Export Video Sequence
              </h3>
              <p className="text-[10px] text-[#777777]">
                Client-side hardware accelerated rendering
              </p>
            </div>
          </div>
          <button
            onClick={closeExportModal}
            className="p-1 rounded-[2px] text-[#A0A0A0] hover:text-white hover:bg-[#2d2d2e] transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1">
          {/* If Complete: Show Video Preview */}
          {isComplete ? (
            <div className="space-y-3">
              <div className="p-2 rounded-[2px] bg-[#1a231d] border border-[#283d2e] flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-normal text-[11px]">
                  Video rendered and compiled successfully as {exportedVideo.format.toUpperCase()}
                  {exportedVideo.format === 'mp4' ? ' (H.264 Universal Compatible)' : ''}!
                </span>
              </div>

              {/* In-app Preview of the exported video file */}
              <div className="aspect-video w-full rounded-[2px] overflow-hidden bg-black border border-[#333333]">
                <video
                  src={exportedVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#777777] px-0.5 font-mono">
                <span>Format: {exportedVideo.format.toUpperCase()}</span>
                <span>File Size: {(exportedVideo.blob.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          ) : isExporting ? (
            /* Progress Bar */
            <div className="py-6 space-y-3 text-center">
              <div className="w-8 h-8 rounded-[2px] bg-[#222228] border border-[#383842] flex items-center justify-center mx-auto text-white">
                <RotateCw className="w-4 h-4 animate-spin" />
              </div>

              <div>
                <div className="text-xs font-semibold text-[#E6E6E6]">
                  Encoding {selectedFormat.toUpperCase()} Video...
                </div>
                <div className="text-[10px] text-[#777777] mt-0.5 font-mono">
                  {exportProgress.status}
                </div>
              </div>

              <div className="w-full h-2 rounded-[1px] bg-[#181818] overflow-hidden border border-[#333333]">
                <div
                  style={{ width: `${exportProgress.progress}%` }}
                  className="h-full bg-white transition-all duration-150"
                />
              </div>

              <div className="text-xs font-mono font-semibold text-white">
                {exportProgress.progress}%
              </div>
            </div>
          ) : isError ? (
            <div className="p-3 rounded-[2px] bg-[#3b1d1d] border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{exportProgress?.status}</span>
            </div>
          ) : (
            /* Export Pre-flight Specifications */
            <div className="space-y-3">
              {/* Format Selection (MP4 vs WebM) */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
                  Output Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('mp4')}
                    className={`p-2.5 rounded-[2px] border text-left transition cursor-pointer ${selectedFormat === 'mp4'
                      ? 'border-white bg-[#222228] text-white shadow-sm'
                      : 'border-[#333333] bg-[#202020] text-[#A0A0A0] hover:text-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">MP4 Video</span>
                      <span className="text-[9px] px-1 py-0.2 rounded-[1px] bg-[#181818] text-emerald-400 font-mono border border-[#283d2e]">
                        Standard
                      </span>
                    </div>
                    <p className="text-[10px] text-[#777777] mt-0.5">
                      Universal H.264 MP4 container for Apple, Windows, and Web
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat('webm')}
                    className={`p-2.5 rounded-[2px] border text-left transition cursor-pointer ${selectedFormat === 'webm'
                      ? 'border-white bg-[#222228] text-white shadow-sm'
                      : 'border-[#333333] bg-[#202020] text-[#A0A0A0] hover:text-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">WebM Video</span>
                      <span className="text-[9px] px-1 py-0.2 rounded-[1px] bg-[#181818] text-[#D4D4D8] font-mono border border-[#383842]">
                        Web
                      </span>
                    </div>
                    <p className="text-[10px] text-[#777777] mt-0.5">
                      VP9 web-native video format with high compression
                    </p>
                  </button>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="p-2 rounded-[2px] bg-[#202020] border border-[#303030]">
                  <span className="text-[10px] text-[#777777] uppercase block">
                    Dimensions
                  </span>
                  <span className="font-medium text-[#E6E6E6] text-xs">
                    {resolution.width} × {resolution.height} ({aspectRatio})
                  </span>
                </div>
                <div className="p-2 rounded-[2px] bg-[#202020] border border-[#303030]">
                  <span className="text-[10px] text-[#777777] uppercase block">
                    Duration
                  </span>
                  <span className="font-mono text-[#E6E6E6] text-xs">
                    {totalDuration.toFixed(2)} seconds
                  </span>
                </div>
                <div className="p-2 rounded-[2px] bg-[#202020] border border-[#303030]">
                  <span className="text-[10px] text-[#777777] uppercase block">
                    Framerate
                  </span>
                  <span className="font-medium text-[#E6E6E6] text-xs">
                    30.00 FPS
                  </span>
                </div>
                <div className="p-2 rounded-[2px] bg-[#202020] border border-[#303030]">
                  <span className="text-[10px] text-[#777777] uppercase block">
                    Source Tracks
                  </span>
                  <span className="font-medium text-[#E6E6E6] text-xs">
                    {videoClips.length} V • {audioClips.length} A • {textClips.length} T
                  </span>
                </div>
              </div>

              <div className="p-2 rounded-[2px] bg-[#202020] border border-[#303030] text-xs text-[#777777] flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4D4D8] shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-[#A0A0A0]">
                  Sequence export captures all video adjustments, color grading, overlay titles, and audio track mixes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-[#333333] bg-[#202020] flex items-center justify-end gap-2">
          {isComplete ? (
            <>
              <button
                onClick={closeExportModal}
                className="px-3 py-1 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] border border-[#333333] text-xs font-normal text-[#A0A0A0] hover:text-white transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="px-3.5 py-1 rounded-[2px] bg-white hover:bg-[#EDEDF0] active:bg-[#DCDCE0] text-[#0D0D10] text-xs font-semibold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save {exportedVideo.format.toUpperCase()} File</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={closeExportModal}
                disabled={isExporting}
                className="px-3 py-1 rounded-[2px] bg-[#252526] hover:bg-[#2d2d2e] border border-[#333333] text-xs font-normal text-[#A0A0A0] hover:text-white disabled:opacity-40 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={isExporting || videoClips.length === 0}
                className="px-3.5 py-1 rounded-[2px] bg-white hover:bg-[#EDEDF0] active:bg-[#DCDCE0] disabled:opacity-40 text-[#0D0D10] text-xs font-semibold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Rendering...' : `Export ${selectedFormat.toUpperCase()}`}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
