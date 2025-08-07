// src/pages/Upload.tsx
import React, { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Upload as UploadIcon, 
  Film, 
  Image, 
  Music, 
  FileText, 
  X, 
  Check, 
  AlertCircle,
  Folder,
  Plus,
  RefreshCw,
  Archive
} from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive';
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FolderOption {
  name: string;
  path: string;
  display_name: string;
  depth: number;
}

const Upload: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch folders for the selected file type
  const { data: foldersResponse, refetch: refetchFolders } = useQuery({
    queryKey: ['folders', selectedFileType],
    queryFn: () => apiService.getFolders({ type: selectedFileType, flat: true }),
    enabled: !!selectedFileType,
  });

  const folders: FolderOption[] = foldersResponse?.success && selectedFileType 
    ? foldersResponse.data?.[selectedFileType] || []
    : [];

  const getFileCategory = (file: File): 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' => {
    const type = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg'].includes(extension)) {
      return 'image';
    }
    if (type.startsWith('video/') || ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp', 'ogv'].includes(extension)) {
      return 'video';
    }
    if (type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'].includes(extension)) {
      return 'audio';
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'md', 'csv', 'odt', 'ods', 'odp'].includes(extension)) {
      return 'document';
    }
    if (['py', 'js', 'ts', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'sh', 'php', 'java', 'cpp', 'h', 'sql'].includes(extension)) {
      return 'code';
    }
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz', 'tbz2', 'txz'].includes(extension)) {
      return 'archive';
    }
    return 'document'; // Default fallback
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'video': return <Film className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'archive': return <Archive className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      category: getFileCategory(file),
      progress: 0,
      status: 'pending'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Auto-select file type if not already selected
    if (!selectedFileType && newFiles.length > 0) {
      const mostCommonType = newFiles.reduce((acc, file) => {
        acc[file.category] = (acc[file.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantType = Object.entries(mostCommonType).reduce((a, b) => 
        mostCommonType[a[0]] > mostCommonType[b[0]] ? a : b
      )[0];
      
      setSelectedFileType(dominantType);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const uploadFile = async (fileData: UploadedFile) => {
    setUploadedFiles(prev => 
      prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    try {
      const response = await apiService.uploadFile(
        fileData.file,
        selectedFolder,
        (progress) => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileData.id 
                ? { ...f, progress: Math.round(progress) }
                : f
            )
          );
        }
      );

      if (response.success) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        );
        
        toast({
          title: "Upload Successful",
          description: `${fileData.name} has been uploaded successfully.`,
        });
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${fileData.name}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const uploadAllFiles = async () => {
    if (!selectedFileType) {
      toast({
        title: "File Type Required",
        description: "Please select a file type before uploading.",
        variant: "destructive",
      });
      return;
    }

    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast({
        title: "No Files to Upload",
        description: "All files have already been processed.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
  };

  const retryFailedUploads = async () => {
    const failedFiles = uploadedFiles.filter(f => f.status === 'error');
    if (failedFiles.length === 0) return;

    setIsUploading(true);
    
    for (const file of failedFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !selectedFileType) {
      toast({
        title: "Invalid Input",
        description: "Please enter a folder name and select a file type.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiService.createFolder(newFolderName.trim(), selectedFileType);
      
      if (response.success) {
        toast({
          title: "Folder Created",
          description: `Folder "${newFolderName}" has been created successfully.`,
        });
        
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        refetchFolders();
      } else {
        throw new Error(response.error || 'Failed to create folder');
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create folder',
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'error': return 'text-destructive';
      case 'uploading': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'uploading': return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      default: return null;
    }
  };

  const totalFiles = uploadedFiles.length;
  const completedFiles = uploadedFiles.filter(f => f.status === 'completed').length;
  const failedFiles = uploadedFiles.filter(f => f.status === 'error').length;
  const pendingFiles = uploadedFiles.filter(f => f.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
          Upload Media
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4">
          Add your videos, images, audio files, and documents to your media library
        </p>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            File Type
          </label>
          <Select value={selectedFileType} onValueChange={setSelectedFileType}>
            <SelectTrigger>
              <SelectValue placeholder="Select file type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="code">Code Files</SelectItem>
              <SelectItem value="archive">Archives</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Destination Folder
            </label>
            {selectedFileType && (
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-3 h-3 mr-1" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Folder Name
                      </label>
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createFolder}>
                        Create Folder
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Select 
            value={selectedFolder} 
            onValueChange={setSelectedFolder}
            disabled={!selectedFileType}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedFileType ? "Select folder (optional)..." : "Select file type first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Root Directory</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.path} value={folder.path}>
                  <div className="flex items-center gap-2">
                    <Folder className="w-3 h-3" />
                    {folder.display_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone mb-6 cursor-pointer ${dragOver ? 'dragover' : ''}`}
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
            Support for various file types up to 10GB each
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
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              Document
            </div>
            <div className="flex items-center gap-1">
              <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
              Archive
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="card-gradient rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Upload Queue ({totalFiles} files)
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="text-green-500">{completedFiles} completed</span>
                <span className="text-muted-foreground">{pendingFiles} pending</span>
                {failedFiles > 0 && (
                  <span className="text-destructive">{failedFiles} failed</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {failedFiles > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={retryFailedUploads}
                  disabled={isUploading}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry Failed
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllFiles}
                disabled={isUploading}
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
              <Button 
                onClick={uploadAllFiles}
                disabled={isUploading || pendingFiles === 0}
                size="sm"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-3 h-3 mr-1" />
                    Upload All ({pendingFiles})
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-accent/50 rounded-lg">
                <div className="text-primary flex-shrink-0">
                  {getFileIcon(file.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground truncate text-sm sm:text-base">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusIcon(file.status)}
                      <span className={`text-xs ${getStatusColor(file.status)}`}>
                        {file.status === 'pending' && 'Ready'}
                        {file.status === 'uploading' && `${file.progress}%`}
                        {file.status === 'completed' && 'Done'}
                        {file.status === 'error' && 'Failed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>{file.size}</span>
                    <span className="capitalize">{file.category}</span>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}
                  
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>
                
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 rounded-full hover:bg-destructive/20 transition-colors flex-shrink-0"
                  disabled={file.status === 'uploading'}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;