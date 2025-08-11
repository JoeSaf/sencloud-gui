// src/components/MediaPlayer.tsx - Complete Updated Version with Episode Navigation
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  SkipBack, 
  SkipForward, 
  Download, 
  ChevronRight, 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  Info,
  Settings,
  Subtitles,
  RotateCcw,
  FastForward,
  Rewind,
  List,
  Clock
} from 'lucide-react';

interface Episode {
  filename: string;
  relative_path: string;
  title: string;
  season?: number;
  episode?: number;
  series_name?: string;
  stream_url: string;
  is_current?: boolean;
}

interface MediaPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id?: string;
    title: string;
    image: string;
    duration?: string;
    year?: string;
    genre?: string;
    type?: string;
    url?: string;
  } | null;
  nextEpisode?: {
    id?: string;
    title: string;
    image: string;
    duration?: string;
    year?: string;
    genre?: string;
    type?: string;
    url?: string;
  } | null;
  onNextEpisode?: () => void;
  recommendedMedia?: Array<{
    id?: string;
    title: string;
    image: string;
    duration?: string;
    year?: string;
    genre?: string;
    type?: string;
    url?: string;
  }>;
  onRecommendedSelect?: (media: any) => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  isOpen, 
  onClose, 
  media, 
  nextEpisode: propNextEpisode, 
  onNextEpisode,
  recommendedMedia = [],
  onRecommendedSelect 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState(true);
  
  // Enhanced mobile fullscreen states
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);

  // Episode navigation states
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null);
  const [previousEpisode, setPreviousEpisode] = useState<Episode | null>(null);
  const [episodeList, setEpisodeList] = useState<Episode[]>([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(-1);
  const [episodeLoading, setEpisodeLoading] = useState(false);

  // Determine media type
  const isVideo = media?.type === 'video';
  const isAudio = media?.type === 'audio';
  const isImage = media?.type === 'image';

  // Mobile device detection
  const isMobileDevice = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }, []);

  // Get current media element reference
  const getCurrentMediaElement = useCallback(() => {
    if (media?.type === 'video') {
      return videoRef.current;
    } else if (media?.type === 'audio') {
      return audioRef.current;
    }
    return null;
  }, [media?.type]);

  // Episode navigation hook
  const fetchEpisodeData = useCallback(async () => {
    if (!media?.url || media.type !== 'video') return;
    
    setEpisodeLoading(true);
    try {
      const filename = media.url.split('/stream/')[1];
      if (!filename) return;

      // Fetch next episode
      const nextResponse = await fetch(`/api/episode/next/${filename}`);
      const nextData = await nextResponse.json();

      // Fetch previous episode
      const prevResponse = await fetch(`/api/episode/previous/${filename}`);
      const prevData = await prevResponse.json();

      // Fetch all episodes in series
      const seriesResponse = await fetch(`/api/series/${filename}`);
      const seriesData = await seriesResponse.json();

      setNextEpisode(nextData.success ? nextData.next_episode : null);
      setPreviousEpisode(prevData.success ? prevData.previous_episode : null);
      
      if (seriesData.success) {
        setEpisodeList(seriesData.episodes);
        setCurrentEpisodeIndex(seriesData.episodes.findIndex((ep: Episode) => ep.is_current));
      }
    } catch (error) {
      console.error('Error fetching episode data:', error);
    } finally {
      setEpisodeLoading(false);
    }
  }, [media]);

  // Episode navigation functions
  const playNextEpisode = useCallback(() => {
    if (nextEpisode && onRecommendedSelect) {
      const nextMedia = {
        id: nextEpisode.relative_path,
        title: nextEpisode.title,
        url: nextEpisode.stream_url,
        type: 'video',
        image: media?.image || '/placeholder.svg',
        year: media?.year,
        genre: media?.genre
      };
      onRecommendedSelect(nextMedia);
      setShowNextEpisode(false);
    }
  }, [nextEpisode, onRecommendedSelect, media]);

  const playPreviousEpisode = useCallback(() => {
    if (previousEpisode && onRecommendedSelect) {
      const prevMedia = {
        id: previousEpisode.relative_path,
        title: previousEpisode.title,
        url: previousEpisode.stream_url,
        type: 'video',
        image: media?.image || '/placeholder.svg',
        year: media?.year,
        genre: media?.genre
      };
      onRecommendedSelect(prevMedia);
    }
  }, [previousEpisode, onRecommendedSelect, media]);

  const playEpisodeFromList = useCallback((episode: Episode) => {
    if (onRecommendedSelect) {
      const episodeMedia = {
        id: episode.relative_path,
        title: episode.title,
        url: episode.stream_url,
        type: 'video',
        image: media?.image || '/placeholder.svg',
        year: media?.year,
        genre: media?.genre
      };
      onRecommendedSelect(episodeMedia);
      setShowEpisodeList(false);
    }
  }, [onRecommendedSelect, media]);

  // Enhanced mobile fullscreen functions
  const enterMobileFullscreen = useCallback(async () => {
    if (!playerContainerRef.current) return;
    
    const container = playerContainerRef.current;
    
    try {
      console.log('Entering mobile fullscreen mode');
      
      // Lock screen orientation to landscape
      if (screen.orientation && (screen.orientation as any).lock) {
        try {
          await (screen.orientation as any).lock('landscape');
          console.log('Screen orientation locked to landscape');
        } catch (e) {
          console.log('Orientation lock not supported or failed:', e);
        }
      }
      
      setIsMobileFullscreen(true);
      
      // Apply fullscreen styles
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.right = '0';
      container.style.bottom = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.zIndex = '9999';
      container.style.background = '#000';
      
      // Try native fullscreen first
      if ('requestFullscreen' in container) {
        try {
          await container.requestFullscreen();
          setIsNativeFullscreen(true);
          console.log('Native fullscreen activated');
        } catch (e) {
          console.log('Native fullscreen failed, using fallback:', e);
        }
      } else {
        // iOS Safari fallback - try video element fullscreen
        const videoElement = container.querySelector('video');
        if (videoElement && 'webkitRequestFullscreen' in videoElement) {
          try {
            await (videoElement as any).webkitRequestFullscreen();
            setIsNativeFullscreen(true);
            console.log('iOS video fullscreen activated');
          } catch (e) {
            console.log('iOS fullscreen failed:', e);
          }
        }
      }
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Hide browser UI on mobile by scrolling
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);
      
    } catch (error) {
      console.error('Mobile fullscreen setup failed:', error);
    }
  }, []);

  const exitMobileFullscreen = useCallback(async () => {
    if (!playerContainerRef.current) return;
    
    const container = playerContainerRef.current;
    
    try {
      console.log('Exiting mobile fullscreen mode');
      
      // Unlock orientation
      if (screen.orientation && (screen.orientation as any).unlock) {
        try {
          (screen.orientation as any).unlock();
          console.log('Screen orientation unlocked');
        } catch (e) {
          console.log('Orientation unlock failed:', e);
        }
      }
      
      setIsMobileFullscreen(false);
      
      // Remove fullscreen styles
      container.style.position = '';
      container.style.top = '';
      container.style.left = '';
      container.style.right = '';
      container.style.bottom = '';
      container.style.width = '';
      container.style.height = '';
      container.style.zIndex = '';
      container.style.background = '';
      
      // Exit native fullscreen
      if (isNativeFullscreen) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsNativeFullscreen(false);
        console.log('Native fullscreen exited');
      }
      
      // Restore body scrolling
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
    } catch (error) {
      console.error('Exit mobile fullscreen failed:', error);
    }
  }, [isNativeFullscreen]);

  // Standard fullscreen functions for desktop
  const enterFullscreen = useCallback(async () => {
    if (!playerContainerRef.current) return;
    
    try {
      const element = playerContainerRef.current;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      } else {
        // Fallback for browsers that don't support fullscreen API
        setIsFullscreen(true);
        
        // Lock orientation on mobile if available
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {
            console.log('Orientation lock failed:', e);
          }
        }
      }
    } catch (error) {
      console.log('Fullscreen failed, using fallback:', error);
      // Fallback for mobile
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      } else {
        // Fallback
        setIsFullscreen(false);
        
        // Unlock orientation if available
        if (screen.orientation && (screen.orientation as any).unlock) {
          try {
            (screen.orientation as any).unlock();
          } catch (e) {
            console.log('Orientation unlock failed:', e);
          }
        }
      }
    } catch (error) {
      console.log('Exit fullscreen failed:', error);
      setIsFullscreen(false);
    }
  }, []);

  // Unified fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const isCurrentlyFullscreen = isFullscreen || isMobileFullscreen;
    
    if (isCurrentlyFullscreen) {
      if (isMobileDevice()) {
        exitMobileFullscreen();
      } else {
        exitFullscreen();
      }
    } else {
      if (isMobileDevice()) {
        enterMobileFullscreen();
      } else {
        enterFullscreen();
      }
    }
    
    setIsFullscreen(!isCurrentlyFullscreen);
  }, [isFullscreen, isMobileFullscreen, isMobileDevice, enterMobileFullscreen, exitMobileFullscreen, enterFullscreen, exitFullscreen]);

  // Handle close
  const handleClose = useCallback(() => {
    const mediaElement = getCurrentMediaElement();
    if (mediaElement) {
      mediaElement.pause();
      setIsPlaying(false);
    }
    // Clear timeout on close
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
    
    // Exit fullscreen if active
    if (isFullscreen || isMobileFullscreen) {
      if (isMobileDevice()) {
        exitMobileFullscreen();
      } else {
        exitFullscreen();
      }
      setIsFullscreen(false);
    }
    
    onClose();
  }, [getCurrentMediaElement, isFullscreen, isMobileFullscreen, isMobileDevice, exitMobileFullscreen, exitFullscreen, onClose]);

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle mouse movement for auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
    
    // Only auto-hide if in fullscreen and playing
    if ((isFullscreen || isMobileFullscreen) && isPlaying && !isImage) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isFullscreen, isMobileFullscreen, isPlaying, isImage]);

  // Play/Pause toggle
  const togglePlayPause = useCallback(async () => {
    const mediaElement = getCurrentMediaElement();
    if (!mediaElement) return;
    
    try {
      if (isPlaying) {
        await mediaElement.pause();
      } else {
        await mediaElement.play();
      }
      
      // Show controls briefly after play/pause
      setShowControls(true);
      if ((isFullscreen || isMobileFullscreen) && !isPlaying) {
        handleMouseMove(); // Use existing mouse move logic
      }
      
    } catch (error) {
      console.log('Play/Pause failed:', error);
    }
  }, [getCurrentMediaElement, isPlaying, isFullscreen, isMobileFullscreen, handleMouseMove]);

  const toggleMute = useCallback(() => {
    const mediaElement = getCurrentMediaElement();
    if (!mediaElement) return;
    
    const newMuted = !isMuted;
    mediaElement.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted, getCurrentMediaElement]);

  const adjustVolume = useCallback((delta: number) => {
    const mediaElement = getCurrentMediaElement();
    if (!mediaElement) return;
    
    const newVolume = Math.max(0, Math.min(100, volume + delta));
    setVolume(newVolume);
    mediaElement.volume = newVolume / 100;
    setIsMuted(false);
    mediaElement.muted = false;
  }, [volume, getCurrentMediaElement]);

  const skipTime = useCallback((seconds: number) => {
    const mediaElement = getCurrentMediaElement();
    if (!mediaElement || duration === 0) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    mediaElement.currentTime = newTime;
    setCurrentTime(newTime);
  }, [getCurrentMediaElement, duration, currentTime]);

  // Fetch episode data when media changes
  useEffect(() => {
    fetchEpisodeData();
  }, [fetchEpisodeData]);

  // Initialize media when opened
  useEffect(() => {
    if (isOpen && media) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setShowControls(true);
      setShowNextEpisode(false);
      setShowRecommendations(false);
      setShowSettings(false);
      setShowEpisodeList(false);
      
      // Clear any existing timeouts
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      
      // Set up media source without autoplay
      const mediaElement = getCurrentMediaElement();
      if (mediaElement && media.url) {
        mediaElement.src = media.url;
        mediaElement.load();
      }
    } else {
      // Clean up when closing
      const mediaElement = getCurrentMediaElement();
      if (mediaElement) {
        mediaElement.pause();
        setIsPlaying(false);
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
  }, [isOpen, media, getCurrentMediaElement]);

  // Enhanced fullscreen change handler with mobile support
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check various fullscreen properties for cross-browser compatibility
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      console.log('Fullscreen changed:', isInFullscreen);
      setIsNativeFullscreen(isInFullscreen);
      
      // Update main fullscreen state
      const isInAnyFullscreen = isInFullscreen || isMobileFullscreen;
      setIsFullscreen(isInAnyFullscreen);
      
      // Always show controls when not in fullscreen
      if (!isInAnyFullscreen) {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = null;
        }
      } else {
        // In fullscreen, show controls initially then manage visibility
        setShowControls(true);
        // Only start hiding timer if media is playing
        if (isPlaying) {
          setTimeout(() => handleMouseMove(), 500); // Small delay to prevent conflicts
        }
      }
    };

    // Listen to all fullscreen change events for cross-browser support
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isMobileFullscreen, isPlaying, handleMouseMove]);

  // Handle orientation change on mobile
  useEffect(() => {
    const handleOrientationChange = () => {
      if (isMobileDevice() && (isFullscreen || isMobileFullscreen)) {
        // Slight delay to allow orientation change to complete
        setTimeout(() => {
          const container = playerContainerRef.current;
          if (container && isMobileFullscreen) {
            container.style.width = '100vw';
            container.style.height = '100vh';
          }
        }, 100);
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isFullscreen, isMobileFullscreen, isMobileDevice]);

  // Fixed media event handlers
  useEffect(() => {
    const mediaElement = getCurrentMediaElement();
    if (!mediaElement || !isOpen) return;

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration || 0);
      setIsBuffering(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
      // Clear any hiding timers when media ends
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      
      // Auto-play next episode if available
      if (autoplayNext && nextEpisode) {
        setShowNextEpisode(true);
        // Auto-play after 5 seconds
        setTimeout(() => {
          if (nextEpisode) {
            playNextEpisode();
          }
        }, 5000);
      } else if (recommendedMedia.length > 0) {
        setShowRecommendations(true);
      }
    };

    const handlePlay = () => {
      console.log('Media play event fired - setting isPlaying to true');
      setIsPlaying(true);
      setIsBuffering(false);
      
      // Don't immediately start hiding controls - wait for user interaction to stop
      setShowControls(true);
    };
    
    const handlePause = () => {
      console.log('Media pause event fired - setting isPlaying to false');
      setIsPlaying(false);
      setShowControls(true);
      
      // Clear hiding timer when paused
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    const handleError = (e: Event) => {
      console.error('Media error:', e);
      setIsBuffering(false);
      setIsPlaying(false);
      setShowControls(true);
    };

    // Add all event listeners
    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('ended', handleEnded);
    mediaElement.addEventListener('play', handlePlay);
    mediaElement.addEventListener('pause', handlePause);
    mediaElement.addEventListener('waiting', handleWaiting);
    mediaElement.addEventListener('canplay', handleCanPlay);
    mediaElement.addEventListener('error', handleError);

    return () => {
      // Clean up all event listeners
      if (mediaElement) {
        mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
        mediaElement.removeEventListener('ended', handleEnded);
        mediaElement.removeEventListener('play', handlePlay);
        mediaElement.removeEventListener('pause', handlePause);
        mediaElement.removeEventListener('waiting', handleWaiting);
        mediaElement.removeEventListener('canplay', handleCanPlay);
        mediaElement.removeEventListener('error', handleError);
      }
    };
  }, [getCurrentMediaElement, isOpen, autoplayNext, nextEpisode, playNextEpisode, recommendedMedia.length]);

  // Set volume and playback rate
  useEffect(() => {
    const mediaElement = getCurrentMediaElement();
    if (mediaElement) {
      mediaElement.volume = isMuted ? 0 : volume / 100;
      mediaElement.playbackRate = playbackRate;
    }
  }, [getCurrentMediaElement, volume, isMuted, playbackRate]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'KeyF':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          event.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (event.shiftKey && previousEpisode) {
            playPreviousEpisode();
          } else {
            skipTime(-10);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (event.shiftKey && nextEpisode) {
            playNextEpisode();
          } else {
            skipTime(10);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          adjustVolume(5);
          break;
        case 'ArrowDown':
          event.preventDefault();
          adjustVolume(-5);
          break;
        case 'KeyN':
          event.preventDefault();
          if (nextEpisode) {
            playNextEpisode();
          }
          break;
        case 'KeyP':
          event.preventDefault();
          if (previousEpisode) {
            playPreviousEpisode();
          }
          break;
        case 'KeyL':
          event.preventDefault();
          setShowEpisodeList(!showEpisodeList);
          break;
        case 'Escape':
          event.preventDefault();
          if (isFullscreen || isMobileFullscreen) {
            toggleFullscreen();
          } else {
            handleClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen, togglePlayPause, toggleFullscreen, toggleMute, skipTime, adjustVolume, 
    isFullscreen, isMobileFullscreen, handleClose, nextEpisode, previousEpisode, 
    playNextEpisode, playPreviousEpisode, showEpisodeList
  ]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isMobileFullscreen) {
        exitMobileFullscreen();
      }
      // Restore body scrolling
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Clear any timeouts
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isMobileFullscreen, exitMobileFullscreen]);

  // Player container classes with mobile fullscreen support
  const getPlayerClasses = () => {
    const baseClasses = "relative bg-black rounded-lg overflow-hidden";
    
    if (isMobileFullscreen) {
      return `${baseClasses} fixed inset-0 z-[9999] !rounded-none`;
    }
    
    if (isFullscreen) {
      return `${baseClasses} w-full h-full`;
    }
    
    return `${baseClasses} w-full aspect-video max-h-[80vh]`;
  };

  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full h-full max-w-7xl mx-auto relative">
        <div 
          ref={playerContainerRef}
          className={getPlayerClasses()}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(true)}
        >
          {/* Video Player */}
          {isVideo && (
            <video 
              ref={videoRef} 
              className="w-full h-full object-contain"
              poster={media.image !== '/placeholder.svg' ? media.image : undefined}
              preload="metadata"
              playsInline
              controls={false}
              onDoubleClick={toggleFullscreen}
              style={{ 
                WebkitPlaysinline: true, // iOS Safari
                WebkitTransform: 'translateZ(0)' // Hardware acceleration
              } as any}
            />
          )}

          {/* Audio Player with Visualization */}
          {isAudio && (
            <div className="w-full h-full flex items-center justify-center relative">
              <audio 
                ref={audioRef} 
                preload="metadata" 
                controls={false}
              />
              <div 
                className="w-full h-full bg-cover bg-center relative"
                style={{ 
                  backgroundImage: media.image !== '/placeholder.svg' 
                    ? `url(${media.image})` 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-sm">
                      {isPlaying ? (
                        <Pause className="w-16 h-16 text-white" />
                      ) : (
                        <Play className="w-16 h-16 text-white ml-2" />
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{media.title}</h2>
                    <p className="text-white/70">
                      {media.year && `${media.year} • `}
                      {media.duration || 'Audio'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Viewer */}
          {isImage && (
            <img 
              src={media.image} 
              alt={media.title}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {/* Loading/Buffering Indicator */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
            </div>
          )}

          {/* Top Controls Bar - Enhanced with Episode Info */}
          {(isFullscreen || isMobileFullscreen) && (
            <div 
              className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-all duration-300 ${
                showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
              }`}
              style={{ pointerEvents: showControls ? 'auto' : 'none' }}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <div className="text-white">
                    <h3 className="font-semibold">{media.title}</h3>
                    {episodeList.length > 1 && (
                      <p className="text-sm text-white/70">
                        Episode {currentEpisodeIndex + 1} of {episodeList.length}
                        {nextEpisode && ` • Next: ${nextEpisode.title}`}
                      </p>
                    )}
                    {media.year && <p className="text-sm text-white/70">{media.year}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {episodeList.length > 1 && (
                    <button
                      onClick={() => setShowEpisodeList(!showEpisodeList)}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                      title="Episode List (L)"
                    >
                      <List className="w-5 h-5 text-white" />
                    </button>
                  )}
                  {media.url && (
                    <a
                      href={media.url}
                      download
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          {!isImage && (
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 ${
                showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              style={{ pointerEvents: showControls ? 'auto' : 'none' }}
            >
              {/* Progress Bar */}
              <div className="px-4 pb-2">
                <div className="flex items-center gap-2 text-sm text-white mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div 
                  className="relative h-1 bg-white/30 rounded-full cursor-pointer group"
                  onClick={(e) => {
                    const mediaElement = getCurrentMediaElement();
                    if (mediaElement && duration) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      const newTime = percent * duration;
                      mediaElement.currentTime = newTime;
                      setCurrentTime(newTime);
                    }
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all group-hover:bg-red-500"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, marginLeft: '-6px' }}
                  />
                </div>
              </div>

              {/* Control Buttons - Enhanced with Episode Navigation */}
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center gap-2">
                  {previousEpisode && (
                    <button
                      onClick={playPreviousEpisode}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                      title="Previous Episode (Shift+Left)"
                    >
                      <SkipBack className="w-5 h-5 text-white" />
                    </button>
                  )}

                  <button
                    onClick={() => skipTime(-10)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                    title="Rewind 10s"
                  >
                    <Rewind className="w-5 h-5 text-white" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </button>

                  <button
                    onClick={() => skipTime(10)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                    title="Forward 10s"
                  >
                    <FastForward className="w-5 h-5 text-white" />
                  </button>

                  {nextEpisode && (
                    <button
                      onClick={playNextEpisode}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                      title="Next Episode (Shift+Right)"
                    >
                      <SkipForward className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                    
                    {/* Volume Slider - Hidden on mobile */}
                    <div className="hidden sm:block">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const newVolume = parseInt(e.target.value);
                          setVolume(newVolume);
                          const mediaElement = getCurrentMediaElement();
                          if (mediaElement) {
                            mediaElement.volume = newVolume / 100;
                            if (newVolume > 0) {
                              setIsMuted(false);
                              mediaElement.muted = false;
                            }
                          }
                        }}
                        className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${isMuted ? 0 : volume}%, rgba(255,255,255,0.3) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.3) 100%)`
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                  >
                    <Settings className="w-5 h-5 text-white" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                    title={isFullscreen || isMobileFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
                  >
                    {isFullscreen || isMobileFullscreen ? (
                      <Minimize2 className="w-5 h-5 text-white" />
                    ) : (
                      <Maximize2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Center Play/Pause Overlay */}
          {!isImage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                onClick={togglePlayPause}
                className={`p-4 rounded-full bg-black/50 backdrop-blur-sm transition-all transform hover:scale-110 pointer-events-auto ${
                  showControls ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>
          )}

          {/* Enhanced Settings Panel with Episode Controls */}
          {showSettings && (
            <div className="absolute bottom-20 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 min-w-48">
              <h4 className="text-white font-semibold mb-3">Playback Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-sm block mb-1">Playback Speed</label>
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="w-full bg-white/20 text-white rounded p-2 text-sm"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>Normal</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
                {/* Volume control for mobile */}
                <div className="sm:hidden">
                  <label className="text-white/70 text-sm block mb-1">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const newVolume = parseInt(e.target.value);
                      setVolume(newVolume);
                      const mediaElement = getCurrentMediaElement();
                      if (mediaElement) {
                        mediaElement.volume = newVolume / 100;
                        if (newVolume > 0) {
                          setIsMuted(false);
                          mediaElement.muted = false;
                        }
                      }
                    }}
                    className="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer"
                  />
                </div>
                {/* Autoplay Next Episode Toggle */}
                {(nextEpisode || episodeList.length > 1) && (
                  <div className="flex items-center justify-between">
                    <label className="text-white/70 text-sm">Autoplay Next Episode</label>
                    <button
                      onClick={() => setAutoplayNext(!autoplayNext)}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        autoplayNext ? 'bg-red-600' : 'bg-white/30'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        autoplayNext ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Episode List Overlay */}
          {showEpisodeList && episodeList.length > 0 && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-end">
              <div className="bg-white h-full w-80 overflow-y-auto">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Episodes</h3>
                    <button
                      onClick={() => setShowEpisodeList(false)}
                      className="p-1 rounded-full hover:bg-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {episodeList[0]?.series_name && (
                    <p className="text-sm text-gray-600 mt-1">{episodeList[0].series_name}</p>
                  )}
                </div>
                <div className="p-2">
                  {episodeList.map((episode, index) => (
                    <button
                      key={episode.relative_path}
                      onClick={() => playEpisodeFromList(episode)}
                      className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                        episode.is_current ? 'bg-red-100 border border-red-300' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {episode.season && episode.episode ? 
                              `S${episode.season}E${episode.episode.toString().padStart(2, '0')}` :
                              `Episode ${index + 1}`
                            }
                          </div>
                          <div className="text-sm text-gray-600 truncate">{episode.title}</div>
                        </div>
                        {episode.is_current && (
                          <div className="ml-2 w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Next Episode Overlay */}
          {showNextEpisode && nextEpisode && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
                <div className="mb-4">
                  <Clock className="w-12 h-12 mx-auto text-red-600 mb-2" />
                  <h3 className="text-lg font-semibold mb-2">Up Next</h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-600 mb-2">{nextEpisode.title}</p>
                  {nextEpisode.season && nextEpisode.episode && (
                    <p className="text-sm text-gray-500">
                      Season {nextEpisode.season}, Episode {nextEpisode.episode}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNextEpisode(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={playNextEpisode}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Play Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Overlay */}
          {showRecommendations && recommendedMedia.length > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">You might also like</h3>
                  <button
                    onClick={() => setShowRecommendations(false)}
                    className="p-1 rounded-full hover:bg-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {recommendedMedia.slice(0, 6).map((item, index) => (
                    <div
                      key={index}
                      className="cursor-pointer group"
                      onClick={() => {
                        setShowRecommendations(false);
                        onRecommendedSelect?.(item);
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full aspect-[3/4] object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                      <h4 className="text-sm font-medium mt-2 line-clamp-2">{item.title}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Click to show/hide controls */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setShowControls(!showControls)}
            style={{ pointerEvents: showControls ? 'none' : 'auto' }}
          />
        </div>

        {/* Close button for non-fullscreen mode */}
        {!isFullscreen && !isMobileFullscreen && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MediaPlayer;