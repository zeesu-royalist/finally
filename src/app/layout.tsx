import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'finally - Professional Online Video Editor',
  description:
    'finally is a modern, fast, browser-native video editor with multi-track timeline, trimming, audio mixing, text overlays, color adjustments, and instant export.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full dark`} data-theme="obsidian">
      <body className="h-full w-full overflow-hidden flex flex-col font-sans select-none">
        {children}
      </body>
    </html>
  );
}
