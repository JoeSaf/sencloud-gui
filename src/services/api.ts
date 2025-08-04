// src/services/api.ts
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

class ApiService {
  private baseUrl: string;
  private isAuthenticated: boolean = false;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    // Check cached auth status first
    this.isAuthenticated = this.getCachedAuthStatus();
    
    // Then verify with server
    this.checkAuthStatus();
  }

  private async checkAuthStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/stats`, {
        credentials: 'include'
      });
      this.isAuthenticated = response.ok;
      
      // Store auth status in localStorage for persistence
      if (response.ok) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authCheckTime', Date.now().toString());
      } else {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authCheckTime');
      }
    } catch {
      this.isAuthenticated = false;
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authCheckTime');
    }
  }

  // Check if we have a valid cached auth status
  private getCachedAuthStatus(): boolean {
    const isAuth = localStorage.getItem('isAuthenticated');
    const authTime = localStorage.getItem('authCheckTime');
    
    if (!isAuth || !authTime) return false;
    
    // Check if auth is still valid (2 days = 172800000 ms)
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - parseInt(authTime) > TWO_DAYS;
    
    if (isExpired) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authCheckTime');
      return false;
    }
    
    return isAuth === 'true';
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
        credentials: 'include',
        ...options,
      });

      if (response.status === 401) {
        this.isAuthenticated = false;
        window.location.href = '/login';
        throw new Error('Unauthorized');
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
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.redirected || response.url.includes('/gallery')) {
        this.isAuthenticated = true;
        // Store auth status with 2-day expiry
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authCheckTime', Date.now().toString());
        return { success: true, data: { id: '1', username, is_admin: true } };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isAuthenticated = false;
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authCheckTime');
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

  // Utility
  getAuthStatus(): boolean {
    return this.isAuthenticated;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const apiService = new ApiService();