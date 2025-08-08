// src/services/api.ts - Complete updated version with folder thumbnail support
import { useState, useEffect, useCallback } from 'react';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MediaFile {
  filename: string;
  relative_path: string;
  folder: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive';
  size: number;
  modified: string;
  thumbnail?: string;
  url: string;
  folder_thumbnail?: string;
  has_folder_thumbnail?: boolean;
}

export interface VideoInfo {
  filename: string;
  duration: number;
  size: number;
  video_codec?: string;
  audio_codec?: string;
  format?: string;
  resolution?: string;
  bitrate?: string;
  web_compatible: boolean;
  stream_url: string;
}

export interface User {
  id: string;
  username: string;
  is_admin: boolean;
}

export interface SearchParams {
  query?: string;
  type?: string;
  folder?: string;
  limit?: number;
  offset?: number;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface FolderThumbnailData {
  thumbnail_url: string;
  inherit_to_children: boolean;
  uploaded_at: string;
  thumbnail_filename?: string;
  auto_generated?: boolean;
}

export interface FolderThumbnailsResponse {
  success: boolean;
  data: { [key: string]: FolderThumbnailData | string };
  error?: string;
}

export interface FolderStructureItem {
  path: string;
  name: string;
  file_type: string;
  file_count: number;
  has_custom_thumbnail: boolean;
  inherits_thumbnail: boolean;
  depth: number;
  thumbnail_url?: string;
  children?: FolderStructureItem[];
}

export interface FolderThumbnailStats {
  total_custom_thumbnails: number;
  auto_generated_thumbnails: number;
  inherited_thumbnails: number;
  by_type: { image: number; video: number; audio: number };
  inheritance_enabled: number;
  total_folders: number;
  folders_without_thumbnails: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use the current hostname for network access
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    } else {
      // For network access, use the current hostname with port 5000
      this.baseUrl = `http://${hostname}:5000`;
    }
    
    console.log('API Base URL:', this.baseUrl);
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // This is crucial for cross-device sessions
        ...options,
      });

      const contentType = response.headers.get('content-type');
      
      // Check if we got HTML instead of JSON (indicates server redirected to login)
      if (contentType?.includes('text/html')) {
        // Server redirected to login page, user is not authenticated
        if (response.status === 200 && response.url.includes('/login')) {
          return {
            success: false,
            error: 'Authentication required',
          };
        }
      }

      // Handle authentication errors properly
      if (response.status === 401) {
        return {
          success: false,
          error: 'Unauthorized',
        };
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      console.log('Sending login request to server...');
      
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Essential for session cookies
      });

      console.log('Login response status:', response.status);
      console.log('Login response redirected:', response.redirected);
      console.log('Login response URL:', response.url);

      // Check for successful login (redirect or success status)
      if (response.redirected || response.url.includes('/gallery') || response.status === 200) {
        // Try to determine admin status from a follow-up request
        try {
          const statsResponse = await fetch(`${this.baseUrl}/api/admin/stats`, {
            credentials: 'include'
          });
          const isAdmin = statsResponse.ok;
          
          console.log('User is admin:', isAdmin);
          
          return { 
            success: true, 
            data: { 
              id: '1', 
              username, 
              is_admin: isAdmin 
            } 
          };
        } catch (adminCheckError) {
          console.warn('Could not determine admin status:', adminCheckError);
          // Default to non-admin if check fails
          return { 
            success: true, 
            data: { 
              id: '1', 
              username, 
              is_admin: false 
            } 
          };
        }
      }

      // If we get here, login failed
      console.log('Login failed - no redirect detected');
      return { success: false, error: 'Invalid credentials' };
      
    } catch (error) {
      console.error('Login request error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  async register(userData: {
    username: string;
    password: string;
    confirm_password: string;
  }): Promise<ApiResponse> {
    const formData = new FormData();
    Object.entries(userData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.redirected || response.url.includes('/login')) {
        return { success: true, message: 'Registration successful' };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'GET',
        credentials: 'include',
      });
      console.log('Logout request sent to server');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data
      localStorage.removeItem('username');
      localStorage.removeItem('isAdmin');
    }
  }

  // Media Files
  async getFiles(params?: {
    folder?: string;
    type?: string;
  }): Promise<ApiResponse<MediaFile[]>> {
    const searchParams = new URLSearchParams();
    if (params?.folder) searchParams.append('folder', params.folder);
    if (params?.type) searchParams.append('type', params.type);

    return this.request(`/api/files?${searchParams.toString()}`);
  }

  // Search functionality
  async searchFiles(params: SearchParams): Promise<ApiResponse<MediaFile[]>> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('text', params.query);
    if (params.type) searchParams.append('type', params.type);
    if (params.folder) searchParams.append('folder', params.folder);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    return this.request(`/api/search?${searchParams.toString()}`);
  }

  async getFolders(params?: {
    type?: string;
    flat?: boolean;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.flat) searchParams.append('flat', 'true');

    return this.request(`/api/folders?${searchParams.toString()}`);
  }

  async uploadFile(
    file: File, 
    folder?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            success: xhr.status >= 200 && xhr.status < 300,
            data: response,
            error: xhr.status >= 400 ? response.error : undefined,
          });
        } catch {
          resolve({
            success: false,
            error: 'Invalid response',
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Upload failed',
        });
      });

      xhr.open('POST', `${this.baseUrl}/api/upload`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  async uploadMultipleFiles(
    files: File[],
    folder?: string,
    onProgress?: (filename: string, progress: number) => void,
    onFileComplete?: (filename: string, success: boolean, error?: string) => void
  ): Promise<ApiResponse<{ successful: number; failed: number; errors: string[] }>> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const file of files) {
      try {
        const response = await this.uploadFile(
          file,
          folder,
          (progress) => onProgress?.(file.name, progress)
        );

        if (response.success) {
          results.successful++;
          onFileComplete?.(file.name, true);
        } else {
          results.failed++;
          const error = response.error || 'Upload failed';
          results.errors.push(`${file.name}: ${error}`);
          onFileComplete?.(file.name, false, error);
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        results.errors.push(`${file.name}: ${errorMessage}`);
        onFileComplete?.(file.name, false, errorMessage);
      }
    }

    return {
      success: results.successful > 0,
      data: results,
    };
  }

  async deleteFile(filename: string): Promise<ApiResponse> {
    return this.request(`/api/delete/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  }

  async createFolder(folderPath: string, fileType: string): Promise<ApiResponse> {
    return this.request('/api/create-folder', {
      method: 'POST',
      body: JSON.stringify({
        folder_path: folderPath,
        file_type: fileType,
      }),
    });
  }

  async moveFiles(filePaths: string[], destinationFolder: string, destinationType: string): Promise<ApiResponse> {
    return this.request('/api/move-files', {
      method: 'POST',
      body: JSON.stringify({
        file_paths: filePaths,
        destination_folder: destinationFolder,
        destination_type: destinationType,
      }),
    });
  }

  // Video specific
  async getVideoInfo(filename: string): Promise<ApiResponse<VideoInfo>> {
    return this.request(`/api/video/info/${encodeURIComponent(filename)}`);
  }

  getStreamUrl(filename: string): string {
    return `${this.baseUrl}/stream/${encodeURIComponent(filename)}`;
  }

  getThumbnailUrl(filename: string): string {
    return `${this.baseUrl}/thumbnail/${filename}`;
  }

  // Admin
  async getAdminStats(): Promise<ApiResponse> {
    return this.request('/api/admin/stats');
  }

  async refreshJellyfin(): Promise<ApiResponse> {
    return this.request('/api/admin/refresh-jellyfin', {
      method: 'POST',
    });
  }

  async generateThumbnails(): Promise<ApiResponse> {
    return this.request('/api/admin/generate-thumbnails', {
      method: 'POST',
    });
  }

  async cleanupThumbnails(): Promise<ApiResponse> {
    return this.request('/api/admin/cleanup-thumbnails', {
      method: 'POST',
    });
  }

  // Batch operations
  async batchDelete(filenames: string[]): Promise<ApiResponse> {
    return this.request('/api/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ filenames }),
    });
  }

  async getUploadStatus(): Promise<ApiResponse<UploadProgress[]>> {
    return this.request('/api/upload-status');
  }

  // ==================== FOLDER THUMBNAIL METHODS ====================

  /**
   * Get all folder thumbnails from the backend
   */
  async getFolderThumbnails(): Promise<FolderThumbnailsResponse> {
    try {
      const response = await this.request<{ [key: string]: FolderThumbnailData | string }>('/api/folder-thumbnails');
      return {
        success: response.success,
        data: response.data || {},
        error: response.error
      };
    } catch (error) {
      console.error('Error fetching folder thumbnails:', error);
      return { success: false, data: {}, error: 'Failed to fetch folder thumbnails' };
    }
  }

  /**
   * Upload a custom thumbnail for a folder
   */
  async uploadFolderThumbnail(
    file: File,
    folderPath: string,
    fileType: string,
    inheritToChildren: boolean = false
  ): Promise<{ success: boolean; thumbnail_url?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      formData.append('folder_path', folderPath);
      formData.append('file_type', fileType);
      formData.append('inherit_to_children', inheritToChildren.toString());

      const response = await fetch(`${this.baseUrl}/api/folder-thumbnail`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, thumbnail_url: result.thumbnail_url };
      } else {
        return { success: false, error: result.error || 'Upload failed' };
      }
    } catch (error) {
      console.error('Error uploading folder thumbnail:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Delete a custom folder thumbnail
   */
  async deleteFolderThumbnail(
    folderPath: string,
    fileType: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request('/api/folder-thumbnail', {
        method: 'DELETE',
        body: JSON.stringify({
          folder_path: folderPath,
          file_type: fileType
        })
      });

      return { success: response.success, error: response.error };
    } catch (error) {
      console.error('Error deleting folder thumbnail:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get thumbnail for a specific folder
   */
  async getFolderThumbnail(
    folderPath: string,
    fileType: string
  ): Promise<{ success: boolean; thumbnail_url?: string; error?: string }> {
    try {
      const response = await this.request(`/api/folder-thumbnail/${fileType}/${encodeURIComponent(folderPath)}`);
      
      return { 
        success: response.success, 
        thumbnail_url: response.data?.thumbnail_url, 
        error: response.error 
      };
    } catch (error) {
      console.error('Error getting folder thumbnail:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Update inheritance setting for an existing folder thumbnail
   */
  async updateFolderThumbnailInheritance(
    folderPath: string,
    fileType: string,
    inheritToChildren: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request('/api/folder-thumbnail/inheritance', {
        method: 'PATCH',
        body: JSON.stringify({
          folder_path: folderPath,
          file_type: fileType,
          inherit_to_children: inheritToChildren
        })
      });

      return { success: response.success, error: response.error };
    } catch (error) {
      console.error('Error updating inheritance:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get folder structure with thumbnail information
   */
  async getFolderStructureWithThumbnails(fileType?: string): Promise<{
    success: boolean;
    data?: FolderStructureItem[];
    error?: string;
  }> {
    try {
      const url = fileType 
        ? `/api/folder-structure?type=${fileType}&include_thumbnails=true`
        : '/api/folder-structure?include_thumbnails=true';
        
      const response = await this.request<FolderStructureItem[]>(url);
      
      return { 
        success: response.success, 
        data: response.data, 
        error: response.error 
      };
    } catch (error) {
      console.error('Error getting folder structure:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Batch update multiple folder thumbnail inheritance settings
   */
  async batchUpdateThumbnailInheritance(updates: Array<{
    folder_path: string;
    file_type: string;
    inherit_to_children: boolean;
  }>): Promise<{ success: boolean; updated: number; errors?: string[] }> {
    try {
      const response = await this.request('/api/folder-thumbnail/batch-inheritance', {
        method: 'PATCH',
        body: JSON.stringify({ updates })
      });

      if (response.success) {
        return { 
          success: true, 
          updated: response.data?.updated || 0, 
          errors: response.data?.errors 
        };
      } else {
        return { 
          success: false, 
          updated: 0, 
          errors: [response.error || 'Batch update failed'] 
        };
      }
    } catch (error) {
      console.error('Error batch updating inheritance:', error);
      return { success: false, updated: 0, errors: ['Network error'] };
    }
  }

  /**
   * Generate automatic thumbnails for folders that don't have custom ones
   */
  async generateAutoFolderThumbnails(fileType?: string): Promise<{
    success: boolean;
    generated: number;
    error?: string;
  }> {
    try {
      const url = fileType 
        ? `/api/admin/generate-folder-thumbnails?type=${fileType}`
        : '/api/admin/generate-folder-thumbnails';
        
      const response = await this.request(url, { method: 'POST' });
      
      return { 
        success: response.success, 
        generated: response.data?.generated || 0, 
        error: response.error 
      };
    } catch (error) {
      console.error('Error generating auto thumbnails:', error);
      return { success: false, generated: 0, error: 'Network error' };
    }
  }

  /**
   * Clean up orphaned folder thumbnails
   */
  async cleanupOrphanedFolderThumbnails(): Promise<{
    success: boolean;
    removed: number;
    error?: string;
  }> {
    try {
      const response = await this.request('/api/admin/cleanup-folder-thumbnails', { method: 'POST' });
      
      return { 
        success: response.success, 
        removed: response.data?.removed || 0, 
        error: response.error 
      };
    } catch (error) {
      console.error('Error cleaning up thumbnails:', error);
      return { success: false, removed: 0, error: 'Network error' };
    }
  }

  /**
   * Get folder thumbnail statistics
   */
  async getFolderThumbnailStats(): Promise<{
    success: boolean;
    data?: FolderThumbnailStats;
    error?: string;
  }> {
    try {
      const response = await this.request<FolderThumbnailStats>('/api/admin/folder-thumbnail-stats');
      
      return { 
        success: response.success, 
        data: response.data, 
        error: response.error 
      };
    } catch (error) {
      console.error('Error getting thumbnail stats:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Helper method to get folder thumbnail with inheritance logic (client-side)
   */
  getFolderThumbnailWithInheritance(
    folderPath: string, 
    fileType: string, 
    thumbnailsData: { [key: string]: FolderThumbnailData | string }
  ): string | null {
    const folderKey = `${fileType}/${folderPath}`;
    
    // Check exact match first
    if (thumbnailsData[folderKey]) {
      const thumbnailData = thumbnailsData[folderKey];
      if (typeof thumbnailData === 'string') {
        return thumbnailData;
      } else if (thumbnailData.thumbnail_url) {
        return thumbnailData.thumbnail_url;
      }
    }

    // Check for inheritance from parent folders
    if (folderPath !== 'Root') {
      const pathParts = folderPath.split('/');
      
      // Work backwards through parent folders
      for (let i = pathParts.length - 1; i >= 0; i--) {
        const parentPath = i === 0 ? 'Root' : pathParts.slice(0, i).join('/');
        const parentKey = `${fileType}/${parentPath}`;
        
        if (thumbnailsData[parentKey]) {
          const parentData = thumbnailsData[parentKey];
          
          // Check if this parent has inheritance enabled
          if (typeof parentData === 'object' && parentData.inherit_to_children) {
            return parentData.thumbnail_url;
          }
        }
      }
    }

    return null;
  }

  // ==================== END FOLDER THUMBNAIL METHODS ====================

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // File type detection
  getFileCategory(filename: string): 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' {
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    const categories = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'ico'],
      video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp', 'ogv'],
      audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'],
      document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'md', 'csv', 'odt', 'ods', 'odp'],
      code: ['py', 'js', 'ts', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'sh', 'php', 'java', 'cpp', 'h', 'sql'],
      archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz', 'tbz2', 'txz']
    };

    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(extension)) {
        return category as any;
      }
    }

    return 'document'; // Default fallback
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        credentials: 'include',
      });
      return {
        success: response.ok,
        data: response.ok ? { status: 'healthy' } : null,
        error: response.ok ? undefined : 'Service unavailable',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }
}

export const apiService = new ApiService();

// ==================== REACT HOOKS ====================

/**
 * Hook for using folder thumbnails in React components
 */
export const useFolderThumbnails = () => {
  const [thumbnails, setThumbnails] = useState<{ [key: string]: FolderThumbnailData | string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThumbnails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getFolderThumbnails();
      if (response.success) {
        setThumbnails(response.data);
      } else {
        setError(response.error || 'Failed to load thumbnails');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThumbnails();
  }, [loadThumbnails]);

  const uploadThumbnail = useCallback(async (
    file: File,
    folderPath: string,
    fileType: string,
    inheritToChildren: boolean = false
  ) => {
    const result = await apiService.uploadFolderThumbnail(file, folderPath, fileType, inheritToChildren);
    if (result.success) {
      // Reload thumbnails to get updated data
      await loadThumbnails();
    }
    return result;
  }, [loadThumbnails]);

  const deleteThumbnail = useCallback(async (folderPath: string, fileType: string) => {
    const result = await apiService.deleteFolderThumbnail(folderPath, fileType);
    if (result.success) {
      // Reload thumbnails to get updated data
      await loadThumbnails();
    }
    return result;
  }, [loadThumbnails]);

  const getThumbnailWithInheritance = useCallback((folderPath: string, fileType: string): string | null => {
    return apiService.getFolderThumbnailWithInheritance(folderPath, fileType, thumbnails);
  }, [thumbnails]);

  const updateInheritance = useCallback(async (
    folderPath: string,
    fileType: string,
    inheritToChildren: boolean
  ) => {
    const result = await apiService.updateFolderThumbnailInheritance(folderPath, fileType, inheritToChildren);
    if (result.success) {
      await loadThumbnails();
    }
    return result;
  }, [loadThumbnails]);

  return {
    thumbnails,
    loading,
    error,
    loadThumbnails,
    uploadThumbnail,
    deleteThumbnail,
    updateInheritance,
    getThumbnailWithInheritance
  };
};

/**
 * Hook for folder structure with thumbnail information
 */
export const useFolderStructure = (fileType?: string) => {
  const [folderStructure, setFolderStructure] = useState<FolderStructureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFolderStructure = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getFolderStructureWithThumbnails(fileType);
      if (response.success && response.data) {
        setFolderStructure(response.data);
      } else {
        setError(response.error || 'Failed to load folder structure');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [fileType]);

  useEffect(() => {
    loadFolderStructure();
  }, [loadFolderStructure]);

  return {
    folderStructure,
    loading,
    error,
    refetch: loadFolderStructure
  };
};

/**
 * Hook for folder thumbnail statistics (admin only)
 */
export const useFolderThumbnailStats = () => {
  const [stats, setStats] = useState<FolderThumbnailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getFolderThumbnailStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to load stats');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const generateAutoThumbnails = useCallback(async (fileType?: string) => {
    const result = await apiService.generateAutoFolderThumbnails(fileType);
    if (result.success) {
      await loadStats(); // Refresh stats after generation
    }
    return result;
  }, [loadStats]);

  const cleanupOrphaned = useCallback(async () => {
    const result = await apiService.cleanupOrphanedFolderThumbnails();
    if (result.success) {
      await loadStats(); // Refresh stats after cleanup
    }
    return result;
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats,
    generateAutoThumbnails,
    cleanupOrphaned
  };
};

/**
 * Enhanced hook for media files with folder thumbnail information
 */
export const useMediaFiles = (params?: {
  folder?: string;
  type?: string;
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMediaFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getFiles(params);
      if (response.success && response.data) {
        setMediaFiles(response.data);
      } else {
        setError(response.error || 'Failed to load media files');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [params?.folder, params?.type]);

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  return {
    mediaFiles,
    loading,
    error,
    refetch: loadMediaFiles
  };
};

/**
 * Utility functions for folder thumbnail management
 */
export const folderThumbnailUtils = {
  /**
   * Group media files by folder with thumbnail information
   */
  groupFilesByFolder: (
    files: MediaFile[], 
    thumbnailsData: { [key: string]: FolderThumbnailData | string }
  ): Array<{
    path: string;
    displayName: string;
    items: MediaFile[];
    thumbnail?: string;
    fileType: string;
    hasCustomThumbnail: boolean;
    inheritsFromParent: boolean;
  }> => {
    const groups = new Map();
    
    files.forEach(file => {
      const pathParts = file.relative_path.split('/');
      const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'Root';
      const folderKey = `${file.type}/${folderPath}`;
      
      if (!groups.has(folderKey)) {
        // Check for custom thumbnail
        const hasCustomThumbnail = folderKey in thumbnailsData;
        
        // Get thumbnail with inheritance
        const thumbnail = apiService.getFolderThumbnailWithInheritance(
          folderPath, 
          file.type, 
          thumbnailsData
        );
        
        // Check if thumbnail is inherited
        const inheritsFromParent = !hasCustomThumbnail && !!thumbnail;
        
        groups.set(folderKey, {
          path: folderPath,
          displayName: folderPath === 'Root' ? 'Root' : pathParts.slice(-1)[0] || folderPath,
          items: [],
          thumbnail,
          fileType: file.type,
          hasCustomThumbnail,
          inheritsFromParent
        });
      }
      
      groups.get(folderKey).items.push(file);
    });

    return Array.from(groups.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  },

  /**
   * Get folder breadcrumb path
   */
  getFolderBreadcrumbs: (folderPath: string): Array<{ name: string; path: string }> => {
    if (folderPath === 'Root' || !folderPath) {
      return [{ name: 'Root', path: 'Root' }];
    }

    const parts = folderPath.split('/');
    const breadcrumbs = [{ name: 'Root', path: 'Root' }];
    
    for (let i = 0; i < parts.length; i++) {
      const path = parts.slice(0, i + 1).join('/');
      breadcrumbs.push({
        name: parts[i],
        path
      });
    }
    
    return breadcrumbs;
  },

  /**
   * Check if a folder has inherited thumbnail
   */
  hasInheritedThumbnail: (
    folderPath: string,
    fileType: string,
    thumbnailsData: { [key: string]: FolderThumbnailData | string }
  ): boolean => {
    const folderKey = `${fileType}/${folderPath}`;
    
    // If has direct thumbnail, not inherited
    if (folderKey in thumbnailsData) {
      return false;
    }
    
    // Check if any parent has inheritable thumbnail
    return !!apiService.getFolderThumbnailWithInheritance(folderPath, fileType, thumbnailsData);
  },

  /**
   * Get parent folder path
   */
  getParentFolderPath: (folderPath: string): string => {
    if (folderPath === 'Root' || !folderPath) {
      return 'Root';
    }
    
    const parts = folderPath.split('/');
    if (parts.length === 1) {
      return 'Root';
    }
    
    return parts.slice(0, -1).join('/');
  },

  /**
   * Get all child folder paths
   */
  getChildFolderPaths: (
    parentPath: string,
    allFolderPaths: string[]
  ): string[] => {
    const prefix = parentPath === 'Root' ? '' : `${parentPath}/`;
    
    return allFolderPaths.filter(path => {
      if (path === parentPath) return false;
      
      if (parentPath === 'Root') {
        // For root, include direct children only
        return !path.includes('/');
      } else {
        // For other folders, include direct children
        return path.startsWith(prefix) && 
               path.substring(prefix.length).split('/').length === 1;
      }
    });
  },

  /**
   * Validate folder thumbnail file
   */
  validateThumbnailFile: (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'Image must be smaller than 5MB' };
    }
    
    // Check file extensions
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return { 
        valid: false, 
        error: `Unsupported format. Use: ${allowedExtensions.join(', ')}` 
      };
    }
    
    return { valid: true };
  },

  /**
   * Format folder path for display
   */
  formatFolderPathForDisplay: (folderPath: string): string => {
    if (folderPath === 'Root' || !folderPath) {
      return 'Root Directory';
    }
    
    return folderPath.split('/').map(part => 
      part.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ).join(' → ');
  },

  /**
   * Get folder depth level
   */
  getFolderDepth: (folderPath: string): number => {
    if (folderPath === 'Root' || !folderPath) {
      return 0;
    }
    
    return folderPath.split('/').length;
  },

  /**
   * Sort folders by hierarchy and name
   */
  sortFoldersHierarchically: (folders: Array<{ path: string; name: string }>): Array<{ path: string; name: string }> => {
    return folders.sort((a, b) => {
      // Root always comes first
      if (a.path === 'Root') return -1;
      if (b.path === 'Root') return 1;
      
      // Sort by depth first, then alphabetically
      const depthA = folderThumbnailUtils.getFolderDepth(a.path);
      const depthB = folderThumbnailUtils.getFolderDepth(b.path);
      
      if (depthA !== depthB) {
        return depthA - depthB;
      }
      
      return a.path.localeCompare(b.path);
    });
  },

  /**
   * Check if folder is ancestor of another folder
   */
  isAncestorFolder: (ancestorPath: string, descendantPath: string): boolean => {
    if (ancestorPath === 'Root') {
      return descendantPath !== 'Root';
    }
    
    if (descendantPath === 'Root') {
      return false;
    }
    
    return descendantPath.startsWith(`${ancestorPath}/`);
  },

  /**
   * Get all folders that would inherit from a given folder
   */
  getInheritingFolders: (
    parentPath: string,
    allFolderPaths: string[]
  ): string[] => {
    return allFolderPaths.filter(path => 
      folderThumbnailUtils.isAncestorFolder(parentPath, path)
    );
  }
};

// (Removed redundant export type block)