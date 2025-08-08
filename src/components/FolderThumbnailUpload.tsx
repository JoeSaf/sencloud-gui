// Enhanced FolderThumbnailUpload.tsx with inheritance support

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image, Check, Users, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '../services/api';

interface FolderThumbnailUploadProps {
  folderPath: string;
  fileType: 'image' | 'video' | 'audio';
  onThumbnailUploaded: (folderPath: string, thumbnailUrl: string) => void;
  existingThumbnail?: string;
}

interface FolderThumbnailData {
  thumbnail_url: string;
  inherit_to_children: boolean;
  uploaded_at: string;
}

const FolderThumbnailUpload: React.FC<FolderThumbnailUploadProps> = ({
  folderPath,
  fileType,
  onThumbnailUploaded,
  existingThumbnail
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingThumbnail || null);
  const [inheritToChildren, setInheritToChildren] = useState(false);
  const [thumbnailData, setThumbnailData] = useState<FolderThumbnailData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing thumbnail data on mount
  useEffect(() => {
    loadThumbnailData();
  }, [folderPath, fileType]);

  const loadThumbnailData = async () => {
    try {
      const response = await fetch(`/api/folder-thumbnail/${fileType}/${encodeURIComponent(folderPath)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.thumbnail_url) {
          setPreviewUrl(data.thumbnail_url);
          // If this is a full thumbnail data object, extract inheritance info
          if (data.inherit_to_children !== undefined) {
            setInheritToChildren(data.inherit_to_children);
            setThumbnailData(data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading thumbnail data:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('thumbnail', file);
      formData.append('folder_path', folderPath);
      formData.append('file_type', fileType);
      formData.append('inherit_to_children', inheritToChildren.toString());

      // Upload to backend
      const response = await fetch('/api/folder-thumbnail', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setPreviewUrl(result.thumbnail_url);
        setThumbnailData({
          thumbnail_url: result.thumbnail_url,
          inherit_to_children: inheritToChildren,
          uploaded_at: new Date().toISOString()
        });
        
        onThumbnailUploaded(folderPath, result.thumbnail_url);
        
        toast({
          title: "Thumbnail uploaded",
          description: `Custom thumbnail set for ${folderPath === 'Root' ? 'root directory' : folderPath}${inheritToChildren ? ' (will inherit to subfolders)' : ''}`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload thumbnail. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveThumbnail = async () => {
    try {
      const response = await fetch('/api/folder-thumbnail', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_path: folderPath,
          file_type: fileType
        })
      });

      if (response.ok) {
        setPreviewUrl(null);
        setThumbnailData(null);
        setInheritToChildren(false);
        onThumbnailUploaded(folderPath, '');
        
        toast({
          title: "Thumbnail removed",
          description: `Custom thumbnail removed for ${folderPath === 'Root' ? 'root directory' : folderPath}`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove thumbnail');
      }
    } catch (error) {
      console.error('Error removing thumbnail:', error);
      toast({
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Failed to remove thumbnail.",
        variant: "destructive"
      });
    }
  };

  const handleInheritanceToggle = async () => {
    if (!thumbnailData) {
      setInheritToChildren(!inheritToChildren);
      return;
    }

    try {
      // Re-upload with new inheritance setting
      const response = await fetch('/api/folder-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_path: folderPath,
          file_type: fileType,
          inherit_to_children: !inheritToChildren,
          // Keep existing thumbnail
          keep_existing: true
        })
      });

      if (response.ok) {
        const newInheritance = !inheritToChildren;
        setInheritToChildren(newInheritance);
        setThumbnailData({
          ...thumbnailData,
          inherit_to_children: newInheritance
        });
        
        toast({
          title: "Inheritance updated",
          description: `Thumbnail ${newInheritance ? 'will now' : 'will no longer'} inherit to subfolders`,
        });
      }
    } catch (error) {
      console.error('Error updating inheritance:', error);
      toast({
        title: "Update failed",
        description: "Failed to update inheritance setting.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {previewUrl ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded overflow-hidden border-2 border-primary">
            <img 
              src={previewUrl} 
              alt="Folder thumbnail" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Inheritance toggle */}
          <button
            onClick={handleInheritanceToggle}
            className={`p-1 rounded transition-colors ${
              inheritToChildren 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
            title={`${inheritToChildren ? 'Inherits' : 'No inheritance'} to subfolders`}
          >
            {inheritToChildren ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
          </button>
          
          <button
            onClick={handleRemoveThumbnail}
            className="p-1 hover:bg-destructive/10 rounded text-destructive transition-colors"
            title="Remove custom thumbnail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-accent hover:bg-accent/80 rounded transition-colors disabled:opacity-50"
            title="Upload custom thumbnail for this folder"
          >
            {isUploading ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            Custom
          </button>
          
          {/* Inheritance toggle for new uploads */}
          <button
            onClick={() => setInheritToChildren(!inheritToChildren)}
            className={`p-1 rounded transition-colors text-xs ${
              inheritToChildren 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
            title={`${inheritToChildren ? 'Will inherit' : 'No inheritance'} to subfolders`}
          >
            {inheritToChildren ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default FolderThumbnailUpload;