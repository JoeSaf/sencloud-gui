import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, Film, Image, Music, FileText, X, Check } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const Upload: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return <Film className="w-5 h-5" />;
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      const fileData: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        progress: 0,
        status: 'uploading'
      };

      setUploadedFiles(prev => [...prev, fileData]);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileData.id && f.progress < 100
              ? { ...f, progress: f.progress + 10 }
              : f.id === fileData.id && f.progress >= 100
              ? { ...f, status: 'completed' }
              : f
          )
        );
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, progress: 100, status: 'completed' }
              : f
          )
        );
      }, 2000);
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">Upload Media</h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4">
          Add your videos, images, and audio files to your media library
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone mb-6 sm:mb-8 ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="video/*,image/*,audio/*"
          onChange={handleFileSelect}
        />
        
        <div className="text-center">
          <div className="w-12 sm:w-16 h-12 sm:h-16 primary-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <UploadIcon className="w-6 sm:w-8 h-6 sm:h-8 text-primary-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
            Support for videos, images, and audio files up to 2GB each
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Film className="w-3 h-3 sm:w-4 sm:h-4" />
              Video
            </div>
            <div className="flex items-center gap-1">
              <Image className="w-3 h-3 sm:w-4 sm:h-4" />
              Image
            </div>
            <div className="flex items-center gap-1">
              <Music className="w-3 h-3 sm:w-4 sm:h-4" />
              Audio
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="card-gradient rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-accent/50 rounded-lg">
                <div className="text-primary flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm sm:text-base">{file.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{file.size}</p>
                  
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                        <div 
                          className="primary-gradient h-1.5 sm:h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {file.progress}% uploaded
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {file.status === 'completed' && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;