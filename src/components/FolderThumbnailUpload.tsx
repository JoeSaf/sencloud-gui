import React, { useState, useRef } from 'react';
import { Upload, X, Image, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FolderThumbnailUploadProps {
  folderPath: string;
  onThumbnailUploaded: (folderPath: string, thumbnailUrl: string) => void;
  existingThumbnail?: string;
}

const FolderThumbnailUpload: React.FC<FolderThumbnailUploadProps> = ({
  folderPath,
  onThumbnailUploaded,
  existingThumbnail
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingThumbnail || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Create preview URL
      const tempPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(tempPreviewUrl);

      // Convert to base64 and store in localStorage
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        
        // Store folder thumbnail in localStorage
        const folderThumbnails = JSON.parse(localStorage.getItem('folderThumbnails') || '{}');
        folderThumbnails[folderPath] = base64String;
        localStorage.setItem('folderThumbnails', JSON.stringify(folderThumbnails));
        
        onThumbnailUploaded(folderPath, base64String);
        
        toast({
          title: "Thumbnail uploaded",
          description: `Custom thumbnail set for ${folderPath === 'Root' ? 'root directory' : folderPath}`,
        });
        
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to process the image file.",
          variant: "destructive"
        });
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload thumbnail. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const handleRemoveThumbnail = () => {
    const folderThumbnails = JSON.parse(localStorage.getItem('folderThumbnails') || '{}');
    delete folderThumbnails[folderPath];
    localStorage.setItem('folderThumbnails', JSON.stringify(folderThumbnails));
    
    setPreviewUrl(null);
    onThumbnailUploaded(folderPath, '');
    
    toast({
      title: "Thumbnail removed",
      description: `Custom thumbnail removed for ${folderPath === 'Root' ? 'root directory' : folderPath}`,
    });
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
          <button
            onClick={handleRemoveThumbnail}
            className="p-1 hover:bg-destructive/10 rounded text-destructive transition-colors"
            title="Remove custom thumbnail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default FolderThumbnailUpload;