'use client';

import { PeerProvider, usePeer } from '@/hooks/use-peer';
import { ConnectionWindow } from '@/components/ConnectionWindow';
import { SendFilesSection } from '@/components/SendFilesSection';
import { ReceiveFilesSection } from '@/components/ReceiveFilesSection';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sword, Github, Shield, Zap, Users } from 'lucide-react';

function HomePage() {
  const {
    peerId,
    remotePeerId,
    status,
    offeredFiles,
    remoteFiles,
    addFiles,
    removeFile,
    requestFiles,
    getShareUrl,
    connectToPeer,
  } = usePeer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75"></div>
              <div className="relative p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                <Sword className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Katana
              </h1>
              <p className="text-sm text-muted-foreground">P2P File Transfer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 py-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Share files{' '}
                <span className="gradient-text">
                  instantly
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Direct peer-to-peer file sharing with no servers, no limits, and complete privacy.
                Your files never leave your device until you choose to share them.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium animate-slide-up hover:scale-105 transition-transform cursor-default">
                <Shield className="w-4 h-4" />
                End-to-End Encrypted
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium animate-slide-up hover:scale-105 transition-transform cursor-default" style={{animationDelay: '0.1s'}}>
                <Zap className="w-4 h-4" />
                Lightning Fast
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium animate-slide-up hover:scale-105 transition-transform cursor-default" style={{animationDelay: '0.2s'}}>
                <Users className="w-4 h-4" />
                No Registration
              </div>
            </div>
          </div>

          {/* Connection Status */}
          {status === 'connected' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Connected to peer
              </div>
            </div>
          )}

          {/* Connection Window */}
          <ConnectionWindow
            peerId={peerId}
            shareUrl={getShareUrl()}
            status={status}
            remotePeerId={remotePeerId}
            onConnect={connectToPeer}
          />

          {/* File Transfer Sections */}
          <div className="grid lg:grid-cols-2 gap-8">
            <SendFilesSection
              files={offeredFiles}
              onAddFiles={addFiles}
              onRemoveFile={removeFile}
            />

            <ReceiveFilesSection
              files={remoteFiles}
              onDownload={requestFiles}
            />
          </div>

          {/* Footer */}
          <footer className="text-center space-y-4 pt-12 border-t">
            <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>WebRTC Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>No Server Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Open Source</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Files are transferred directly between browsers using WebRTC technology. 
              No data is stored on any server - your privacy is guaranteed.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <PeerProvider>
      <HomePage />
    </PeerProvider>
  );
}