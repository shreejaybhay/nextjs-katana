'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, QrCode, Wifi, WifiOff, Loader2, Share2, Link, Check } from 'lucide-react';
import type { ConnectionStatus } from '@/lib/peer-types';

interface ConnectionWindowProps {
  peerId: string | null;
  shareUrl: string;
  status: ConnectionStatus;
  remotePeerId: string | null;
  onConnect: (peerId: string) => void;
}

export function ConnectionWindow({
  peerId,
  shareUrl,
  status,
  remotePeerId,
  onConnect,
}: ConnectionWindowProps) {
  const [connectId, setConnectId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (shareUrl && showQR) {
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(shareUrl, { 
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).then(setQrCodeUrl);
      });
    }
  }, [shareUrl, showQR]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleConnect = () => {
    if (connectId.trim()) {
      onConnect(connectId.trim());
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-5 h-5 text-green-500" />,
          text: 'Connected',
          subtext: `Peer: ${remotePeerId?.slice(0, 8)}...`,
          color: 'text-green-600 dark:text-green-400'
        };
      case 'connecting':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-blue-500" />,
          text: 'Connecting...',
          subtext: 'Establishing secure connection',
          color: 'text-blue-600 dark:text-blue-400'
        };
      default:
        return {
          icon: <WifiOff className="w-5 h-5 text-muted-foreground" />,
          text: 'Ready to Connect',
          subtext: 'Share your link or connect to a peer',
          color: 'text-muted-foreground'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  if (status === 'connected') {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-2">
              {statusDisplay.icon}
              <div>
                <p className={`font-semibold ${statusDisplay.color}`}>{statusDisplay.text}</p>
                <p className="text-sm text-muted-foreground">{statusDisplay.subtext}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 text-center mb-6">
            {statusDisplay.icon}
            <div>
              <p className={`font-semibold ${statusDisplay.color}`}>{statusDisplay.text}</p>
              <p className="text-sm text-muted-foreground">{statusDisplay.subtext}</p>
            </div>
          </div>

          {peerId && (
            <div className="space-y-4">
              {/* Share Section */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                  <Share2 className="w-5 h-5" />
                  Share Your Connection
                </div>
                
                {/* Share Options */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-1 sm:flex-none px-6 py-3 h-auto"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4 mr-2" />
                        Copy Share Link
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (peerId) {
                        try {
                          await navigator.clipboard.writeText(peerId);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                        } catch (err) {
                          console.error('Failed to copy peer ID:', err);
                        }
                      }
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 h-auto"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Copy Peer ID
                      </>
                    )}
                  </Button>
                </div>

                {/* QR Code Toggle */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowQR(!showQR)}
                    className="text-sm"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                  </Button>
                </div>

                {/* QR Code */}
                {showQR && qrCodeUrl && (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-xl shadow-lg border">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            </div>
          )}

          {/* Connect Section */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="font-medium">Connect to a Peer</p>
              <p className="text-sm text-muted-foreground">Enter a peer ID to establish connection</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Paste peer ID here..."
                value={connectId}
                onChange={(e) => setConnectId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                className="font-mono"
              />
              <Button 
                onClick={handleConnect} 
                disabled={!connectId.trim() || status === 'connecting'}
                className="px-6"
              >
                {status === 'connecting' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}