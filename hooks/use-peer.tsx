'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { FileInfo, ProtocolMessage, ConnectionStatus, PeerState } from '@/lib/peer-types';

// Detect mobile and adjust chunk size accordingly
const isMobileDevice = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const CHUNK_SIZE = isMobileDevice() ? 32 * 1024 : 64 * 1024; // Smaller chunks for mobile
const CHUNK_DELAY = isMobileDevice() ? 10 : 0; // Small delay between chunks on mobile

interface PeerContextType extends PeerState {
  addFiles: (files: File[]) => void;
  removeFile: (fileId: string) => void;
  requestFiles: (fileIds: string[]) => void;
  connectToPeer: (remotePeerId: string) => void;
  getShareUrl: () => string;
}

const PeerContext = createContext<PeerContextType | null>(null);

function generateFileId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function PeerProvider({ children }: { children: ReactNode }) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [offeredFiles, setOfferedFiles] = useState<FileInfo[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<FileInfo[]>([]);
  
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const filesMapRef = useRef<Map<string, File>>(new Map());
  const downloadingFilesRef = useRef<Map<string, { chunks: ArrayBuffer[]; name: string; size: number; receivedChunks: number; totalChunks: number }>>(new Map());

  const sendMessage = useCallback((message: ProtocolMessage) => {
    if (connectionRef.current && connectionRef.current.open) {
      connectionRef.current.send(message);
    }
  }, []);

  const handleMessage = useCallback((data: unknown) => {
    const message = data as ProtocolMessage;
    
    switch (message.type) {
      case 'hello':
        setRemotePeerId(message.peerId);
        break;
      case 'offer':
        setRemoteFiles(prev => {
          if (prev.some(f => f.id === message.file.id)) return prev;
          return [...prev, message.file];
        });
        break;
      case 'unoffer':
        setRemoteFiles(prev => prev.filter(f => f.id !== message.fileId));
        break;
      case 'accept':
        message.fileIds.forEach(async (fileId) => {
          const file = filesMapRef.current.get(fileId);
          if (file) {
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            
            // Send file start message
            sendMessage({
              type: 'fileStart',
              fileId,
              name: file.name,
              size: file.size,
              totalChunks
            });

            // Send file in chunks for better performance
            const reader = new FileReader();
            let offset = 0;
            let chunkIndex = 0;

            const sendNextChunk = () => {
              const chunk = file.slice(offset, offset + CHUNK_SIZE);
              const chunkReader = new FileReader();
              
              chunkReader.onload = () => {
                const isLast = offset + CHUNK_SIZE >= file.size;
                
                sendMessage({
                  type: 'fileChunk',
                  fileId,
                  chunkIndex,
                  data: chunkReader.result as ArrayBuffer,
                  isLast
                });

                if (!isLast) {
                  offset += CHUNK_SIZE;
                  chunkIndex++;
                  // Use setTimeout with mobile-specific delay to prevent blocking the UI
                  setTimeout(sendNextChunk, CHUNK_DELAY);
                }
              };
              
              chunkReader.readAsArrayBuffer(chunk);
            };

            sendNextChunk();
          }
        });
        break;
      case 'fileStart':
        // Initialize file download tracking
        downloadingFilesRef.current.set(message.fileId, {
          chunks: new Array(message.totalChunks),
          name: message.name,
          size: message.size,
          receivedChunks: 0,
          totalChunks: message.totalChunks
        });
        break;
      case 'fileChunk':
        const downloadInfo = downloadingFilesRef.current.get(message.fileId);
        if (downloadInfo) {
          // Store chunk in correct position
          downloadInfo.chunks[message.chunkIndex] = message.data;
          downloadInfo.receivedChunks++;
          
          // If this is the last chunk or we have all chunks, assemble and download
          if (message.isLast || downloadInfo.receivedChunks === downloadInfo.totalChunks) {
            // Combine all chunks
            const totalSize = downloadInfo.chunks.reduce((size, chunk) => size + (chunk?.byteLength || 0), 0);
            const combinedArray = new Uint8Array(totalSize);
            let offset = 0;
            
            for (const chunk of downloadInfo.chunks) {
              if (chunk) {
                combinedArray.set(new Uint8Array(chunk), offset);
                offset += chunk.byteLength;
              }
            }
            
            // Create and download file immediately
            const getMimeType = (filename: string): string => {
              const ext = filename.split('.').pop()?.toLowerCase();
              const mimeTypes: Record<string, string> = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
                'webp': 'image/webp', 'svg': 'image/svg+xml', 'mp4': 'video/mp4', 'avi': 'video/x-msvideo',
                'mov': 'video/quicktime', 'wmv': 'video/x-ms-wmv', 'flv': 'video/x-flv', 'webm': 'video/webm',
                'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'flac': 'audio/flac', 'aac': 'audio/aac',
                'ogg': 'audio/ogg', 'pdf': 'application/pdf', 'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'txt': 'text/plain', 'rtf': 'application/rtf', 'zip': 'application/zip',
                'rar': 'application/x-rar-compressed', '7z': 'application/x-7z-compressed',
                'tar': 'application/x-tar', 'gz': 'application/gzip', 'json': 'application/json',
                'xml': 'application/xml', 'html': 'text/html', 'css': 'text/css', 'js': 'application/javascript'
              };
              return mimeTypes[ext || ''] || 'application/octet-stream';
            };

            const mimeType = getMimeType(downloadInfo.name);
            const blob = new Blob([combinedArray], { type: mimeType });
            
            // Mobile-optimized download handling
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const url = URL.createObjectURL(blob);
            
            if (isMobile) {
              // For mobile, try multiple approaches for better compatibility
              try {
                // First try: Open in new tab (works better for images, PDFs, etc.)
                const newWindow = window.open(url, '_blank');
                
                // Fallback: Direct download if popup blocked
                setTimeout(() => {
                  if (!newWindow || newWindow.closed || newWindow.location.href === 'about:blank') {
                    // Create download link with user interaction
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = downloadInfo.name;
                    a.style.display = 'none';
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    
                    // Add to DOM and trigger click
                    document.body.appendChild(a);
                    
                    // For iOS Safari, we need to trigger the click in a user gesture context
                    const clickEvent = new MouseEvent('click', {
                      view: window,
                      bubbles: true,
                      cancelable: true
                    });
                    a.dispatchEvent(clickEvent);
                    
                    // Clean up
                    setTimeout(() => {
                      document.body.removeChild(a);
                    }, 100);
                  }
                  
                  // Clean up URL after delay
                  setTimeout(() => URL.revokeObjectURL(url), 2000);
                }, 500);
              } catch (error) {
                console.error('Mobile download error:', error);
                // Final fallback: standard download
                const a = document.createElement('a');
                a.href = url;
                a.download = downloadInfo.name;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }
            } else {
              // Desktop: Standard download
              const a = document.createElement('a');
              a.href = url;
              a.download = downloadInfo.name;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 100);
            }
            
            downloadingFilesRef.current.delete(message.fileId);
          }
        }
        break;
      case 'fileContent':
        // Get MIME type based on file extension
        const getMimeType = (filename: string): string => {
          const ext = filename.split('.').pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            // Videos
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'wmv': 'video/x-ms-wmv',
            'flv': 'video/x-flv',
            'webm': 'video/webm',
            // Audio
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'flac': 'audio/flac',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg',
            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            'rtf': 'application/rtf',
            // Archives
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'tar': 'application/x-tar',
            'gz': 'application/gzip',
            // Default
            'json': 'application/json',
            'xml': 'application/xml',
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript'
          };
          return mimeTypes[ext || ''] || 'application/octet-stream';
        };

        const mimeType = getMimeType(message.name);
        const blob = new Blob([message.data], { type: mimeType });
        
        // Check if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // For mobile, try to open in a new tab first (better for viewing)
          const url = URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');
          
          // If popup was blocked or failed, fall back to download
          setTimeout(() => {
            if (!newWindow || newWindow.closed) {
              const a = document.createElement('a');
              a.href = url;
              a.download = message.name;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            URL.revokeObjectURL(url);
          }, 1000);
        } else {
          // For desktop, use standard download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = message.name;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        break;
    }
  }, [sendMessage]);

  const setupConnection = useCallback((conn: DataConnection) => {
    console.log('Setting up connection with:', conn.peer);
    console.log('Connection state:', conn.open);
    connectionRef.current = conn;
    setStatus('connecting');
    
    // Add a timeout to detect stuck connections
    const connectionTimeout = setTimeout(() => {
      if (conn && !conn.open) {
        console.error('Connection timeout - failed to open within 10 seconds');
        setStatus('disconnected');
        conn.close();
      }
    }, 10000);
    
    conn.on('open', () => {
      console.log('Connection opened successfully');
      clearTimeout(connectionTimeout);
      setStatus('connected');
      sendMessage({ type: 'hello', peerId: peerRef.current?.id || '' });
      // Send current offered files when connection opens
      setOfferedFiles(currentFiles => {
        currentFiles.forEach(file => {
          sendMessage({ type: 'offer', file: { id: file.id, name: file.name, size: file.size } });
        });
        return currentFiles;
      });
    });
    
    conn.on('data', (data) => {
      console.log('Received data:', data);
      handleMessage(data);
    });
    
    conn.on('close', () => {
      console.log('Connection closed');
      clearTimeout(connectionTimeout);
      setStatus('disconnected');
      setRemotePeerId(null);
      setRemoteFiles([]);
      connectionRef.current = null;
    });
    
    conn.on('error', (err) => {
      console.error('Connection error:', err);
      console.error('Error details:', err.message, err.type);
      clearTimeout(connectionTimeout);
      setStatus('disconnected');
    });
  }, [handleMessage, sendMessage]);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;
    
    console.log('Initializing PeerJS...');
    
    // Enhanced ICE servers for better mobile connectivity
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ];
    
    const peer = new Peer({
      debug: 2, // Enable debug logs
      config: {
        iceServers,
        iceCandidatePoolSize: 10, // More ICE candidates for better connectivity
        iceTransportPolicy: 'all', // Use both STUN and TURN
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      }
    });
    peerRef.current = peer;
    
    // Expose peer instance globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).peerInstance = peer;
    }
    
    peer.on('open', (id) => {
      console.log('Peer opened with ID:', id);
      setPeerId(id);
      
      const urlParams = new URLSearchParams(window.location.search);
      const connectTo = urlParams.get('connect');
      if (connectTo && connectTo !== id) {
        console.log('Auto-connecting to:', connectTo);
        const conn = peer.connect(connectTo, { reliable: true });
        setupConnection(conn);
      }
    });
    
    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      setupConnection(conn);
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setStatus('disconnected');
    });
    
    return () => {
      console.log('Destroying peer connection');
      peer.destroy();
    };
  }, [setupConnection]);

  const addFiles = useCallback((files: File[]) => {
    const newFiles: FileInfo[] = files.map(file => {
      const id = generateFileId();
      filesMapRef.current.set(id, file);
      return { id, name: file.name, size: file.size, file };
    });
    
    setOfferedFiles(prev => [...prev, ...newFiles]);
    
    // Only send offer messages if we have an active connection
    if (connectionRef.current && connectionRef.current.open && status === 'connected') {
      newFiles.forEach(file => {
        sendMessage({ type: 'offer', file: { id: file.id, name: file.name, size: file.size } });
      });
    }
  }, [sendMessage, status]);

  const removeFile = useCallback((fileId: string) => {
    filesMapRef.current.delete(fileId);
    setOfferedFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Only send unoffer message if we have an active connection
    if (connectionRef.current && connectionRef.current.open && status === 'connected') {
      sendMessage({ type: 'unoffer', fileId });
    }
  }, [sendMessage, status]);

  const requestFiles = useCallback((fileIds: string[]) => {
    sendMessage({ type: 'accept', fileIds });
  }, [sendMessage]);

  const connectToPeer = useCallback((remoteId: string) => {
    console.log('Attempting to connect to peer:', remoteId);
    console.log('Current peer ID:', peerId);
    console.log('Peer instance:', peerRef.current);
    
    // Reset any existing connection first
    if (connectionRef.current) {
      console.log('Closing existing connection');
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    setStatus('connecting');
    
    if (peerRef.current && remoteId !== peerId) {
      console.log('Initiating connection...');
      const conn = peerRef.current.connect(remoteId, { 
        reliable: true,
        serialization: 'json'
      });
      setupConnection(conn);
    } else {
      console.log('Cannot connect - peer not ready or trying to connect to self');
      setStatus('disconnected');
    }
  }, [peerId, setupConnection]);

  const getShareUrl = useCallback(() => {
    if (!peerId) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('connect', peerId);
    return url.toString();
  }, [peerId]);

  return (
    <PeerContext.Provider
      value={{
        peerId,
        remotePeerId,
        status,
        offeredFiles,
        remoteFiles,
        addFiles,
        removeFile,
        requestFiles,
        connectToPeer,
        getShareUrl,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
}

export function usePeer() {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error('usePeer must be used within a PeerProvider');
  }
  return context;
}