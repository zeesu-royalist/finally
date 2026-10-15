'use client';

import React from 'react';
import { EditorProvider } from '../context/EditorContext';
import Header from '../components/Header';
import LeftPanel from '../components/LeftPanel';
import PreviewPlayer from '../components/PreviewPlayer';
import PropertiesPanel from '../components/PropertiesPanel';
import Timeline from '../components/Timeline';
import ExportModal from '../components/ExportModal';
export default function Home() {
  return (
    <EditorProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {/* Top Navigation Bar */}
        <Header />

        {/* Middle Editing Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Media & Tools Drawer */}
          <LeftPanel />

          {/* Center Video Viewport */}
          <PreviewPlayer />

          {/* Right Contextual Properties Panel */}
          <PropertiesPanel />
        </div>

        {/* Bottom Multi-track Timeline */}
        <Timeline />

        {/* Export Modal Dialog */}
        <ExportModal />
      </div>
    </EditorProvider>
  );
}
