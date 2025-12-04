'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, File, FileText, Image, Video, Music, Archive, Paperclip } from 'lucide-react';
import type { FileInfo } from '@/lib/peer-types';

interface SendFilesSectionProps {
  files: FileInfo[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (fileId: string) => void;
}

export function SendFilesSection({
  files,
  onAddFiles,
  onRemoveFile,
}: SendFilesSectionProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        onAddFiles(droppedFiles);
      }
    },
    [onAddFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onAddFiles(selectedFiles);
      }
      e.target.value = '';
    },
    [onAddFiles]
  );

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

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          Send Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragging 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105' 
              : 'border-muted-foreground/25 hover:border-blue-400 hover:bg-muted/50'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-muted'
            }`}>
              <Upload className={`w-8 h-8 transition-colors ${
                isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
              }`} />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragging ? 'Drop files here!' : 'Drag & drop files'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse your device
              </p>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              className="pointer-events-none"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>

          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Ready to Send</h4>
              <div className="text-xs text-muted-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''} • {formatFileSize(totalSize)}
              </div>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar px-1 pt-1">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="group flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-200 animate-slide-up hover:shadow-md hover:-translate-y-0.5"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  {getFileIcon(file.name)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 hover:scale-110"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {files.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No files selected yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}