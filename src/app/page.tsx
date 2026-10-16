'use client';

import React, { useState } from 'react';
import {
  Film,
  Image as ImageIcon,
  Type,
  Music,
  Sliders,
  SlidersHorizontal,
} from 'lucide-react';
import { EditorProvider, useEditor } from '../context/EditorContext';
import Header from '../components/Header';
import LeftPanel, { ActiveTab } from '../components/LeftPanel';
import PreviewPlayer from '../components/PreviewPlayer';
import PropertiesPanel from '../components/PropertiesPanel';
import Timeline from '../components/Timeline';
import ExportModal from '../components/ExportModal';

function EditorWorkspace() {
  const { selectedItem } = useEditor();
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'left' | 'properties'>('none');
  const [mobileLeftTab, setMobileLeftTab] = useState<ActiveTab>('media');

  return (
    <div className="h-full min-h-[100dvh] w-screen overflow-hidden flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
      {/* Top Navigation Bar */}
      <Header />

      {/* Middle Editing Area */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Left Media & Tools Drawer */}
        <LeftPanel
          isMobileDrawerOpen={mobileDrawer === 'left'}
          onMobileClose={() => setMobileDrawer('none')}
          activeTabOverride={mobileLeftTab}
          onTabChange={(tab) => setMobileLeftTab(tab)}
        />

        {/* Center Video Viewport */}
        <PreviewPlayer />

        {/* Right Contextual Properties Panel */}
        <PropertiesPanel
          isMobileDrawerOpen={mobileDrawer === 'properties'}
          onMobileClose={() => setMobileDrawer('none')}
        />

        {/* Mobile Backdrop Overlay for open drawers */}
        {mobileDrawer !== 'none' && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setMobileDrawer('none')}
          />
        )}
      </div>

      {/* Bottom Multi-track Timeline */}
      <Timeline />

      {/* Mobile Bottom Quick-Action Bar */}
      <div className="flex md:hidden items-center justify-around h-11 bg-[#1c1c22] border-t border-[#2e2e38] px-1 shrink-0 z-30 pb-safe select-none">
        <button
          onClick={() => {
            setMobileLeftTab('media');
            setMobileDrawer(mobileDrawer === 'left' && mobileLeftTab === 'media' ? 'none' : 'left');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            mobileDrawer === 'left' && mobileLeftTab === 'media' ? 'text-white' : 'text-[#8E8E93] active:text-white'
          }`}
          title="Media Bin"
        >
          <Film className="w-3.5 h-3.5" />
          <span className="text-[9px] mt-0.5 font-medium leading-none">Media</span>
        </button>

        <button
          onClick={() => {
            setMobileLeftTab('images');
            setMobileDrawer(mobileDrawer === 'left' && mobileLeftTab === 'images' ? 'none' : 'left');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            mobileDrawer === 'left' && mobileLeftTab === 'images' ? 'text-white' : 'text-[#8E8E93] active:text-white'
          }`}
          title="Graphics & Stickers"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="text-[9px] mt-0.5 font-medium leading-none">Graphics</span>
        </button>

        <button
          onClick={() => {
            setMobileLeftTab('text');
            setMobileDrawer(mobileDrawer === 'left' && mobileLeftTab === 'text' ? 'none' : 'left');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            mobileDrawer === 'left' && mobileLeftTab === 'text' ? 'text-white' : 'text-[#8E8E93] active:text-white'
          }`}
          title="Text & Titles"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="text-[9px] mt-0.5 font-medium leading-none">Titles</span>
        </button>

        <button
          onClick={() => {
            setMobileLeftTab('audio');
            setMobileDrawer(mobileDrawer === 'left' && mobileLeftTab === 'audio' ? 'none' : 'left');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            mobileDrawer === 'left' && mobileLeftTab === 'audio' ? 'text-white' : 'text-[#8E8E93] active:text-white'
          }`}
          title="Audio Library"
        >
          <Music className="w-3.5 h-3.5" />
          <span className="text-[9px] mt-0.5 font-medium leading-none">Audio</span>
        </button>

        <button
          onClick={() => {
            setMobileLeftTab('filters');
            setMobileDrawer(mobileDrawer === 'left' && mobileLeftTab === 'filters' ? 'none' : 'left');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            mobileDrawer === 'left' && mobileLeftTab === 'filters' ? 'text-white' : 'text-[#8E8E93] active:text-white'
          }`}
          title="Color & Adjustments"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="text-[9px] mt-0.5 font-medium leading-none">Color</span>
        </button>

        <button
          onClick={() => {
            setMobileDrawer(mobileDrawer === 'properties' ? 'none' : 'properties');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer relative ${
            mobileDrawer === 'properties'
              ? 'text-white'
              : selectedItem
                ? 'text-[#FFFFFF]'
                : 'text-[#8E8E93] active:text-white'
          }`}
          title={selectedItem ? `Inspect ${selectedItem.type}` : 'Project Overview'}
        >
          {selectedItem && (
            <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
          )}
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[9px] mt-0.5 font-medium leading-none">
            {selectedItem ? 'Inspect' : 'Info'}
          </span>
        </button>
      </div>

      {/* Export Modal Dialog */}
      <ExportModal />
    </div>
  );
}

export default function Home() {
  return (
    <EditorProvider>
      <EditorWorkspace />
    </EditorProvider>
  );
}
