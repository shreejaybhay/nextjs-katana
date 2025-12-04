'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, File, CheckCircle, FileText, Image, Video, Music, Archive, Package, ArrowDown } from 'lucide-react';
import type { FileInfo } from '@/lib/peer-types';

interface ReceiveFilesSectionProps {
  files: FileInfo[];
  onDownload: (fileIds: string[]) => void;
}

export function ReceiveFilesSection({
  files,
  onDownload,
}: ReceiveFilesSectionProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext || '')) {
      return <Music className="w-5 h-5 text-green-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <Archive className="w-5 h-5 text-orange-500" />;
    }
    if (['txt', 'doc', 'docx', 'pdf', 'rtf'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const downloadSelected = () => {
    if (selectedFiles.size > 0) {
      onDownload(Array.from(selectedFiles));
      setSelectedFiles(new Set());
    }
  };

  const downloadAll = () => {
    onDownload(files.map(f => f.id));
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const selectedSize = files
    .filter(file => selectedFiles.has(file.id))
    .reduce((acc, file) => acc + file.size, 0);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          Receive Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">No files yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Files shared by your peer will appear here. They'll be ready to download instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header with stats and actions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {files.length} file{files.length !== 1 ? 's' : ''} available
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: {formatFileSize(totalSize)}
                  {selectedFiles.size > 0 && (
                    <span> • Selected: {formatFileSize(selectedSize)}</span>
                  )}
                </p>
              </div>
              
              <div className="flex gap-2">
                {selectedFiles.size > 0 ? (
                  <>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Clear ({selectedFiles.size})
                    </Button>
                    <Button size="sm" onClick={downloadSelected} className="bg-green-600 hover:bg-green-700">
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Download Selected
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button size="sm" onClick={downloadAll} className="bg-green-600 hover:bg-green-700">
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Files List */}
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar px-1 pt-1">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className={`group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 animate-slide-up hover:shadow-md hover:-translate-y-0.5 ${
                    selectedFiles.has(file.id)
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-sm'
                      : 'bg-muted/30 hover:bg-muted border-transparent hover:border-muted-foreground/20'
                  }`}
                  style={{animationDelay: `${index * 0.05}s`}}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="flex-shrink-0">
                    {selectedFiles.has(file.id) ? (
                      <CheckCircle className="w-5 h-5 text-green-600 animate-bounce-gentle" />
                    ) : (
                      getFileIcon(file.name)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload([file.id]);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-110"
                  >
                    <Download className="w-4 h-4 text-green-600" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Quick download all button for many files */}
            {files.length > 3 && (
              <div className="pt-2 border-t">
                <Button 
                  onClick={downloadAll} 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="sm"
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Download All {files.length} Files ({formatFileSize(totalSize)})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}