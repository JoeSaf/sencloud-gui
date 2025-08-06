// src/components/MediaPlayer.tsx - Enhanced with auto-fullscreen and Netflix-style controls
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
  Rewind
} from 'lucide-react';

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
  nextEpisode, 
  onNextEpisode,
  recommendedMedia = [],
  onRecommendedSelect 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const mediaRef = media?.type === 'video' ? videoRef : audioRef;

  // Auto-enter fullscreen when media starts playing
  const autoEnterFullscreen = useCallback(async () => {
    if (!playerContainerRef.current || hasStartedPlaying) return;

    try {
      // For mobile devices, request screen orientation lock to landscape
      if ('screen' in window && 'orientation' in window.screen && window.screen.orientation) {
        try {
          // Type assertion for orientation lock which may not be in all TypeScript definitions
          const orientation = window.screen.orientation as any;
          if (orientation.lock) {
            await orientation.lock('landscape');
          }
        } catch (error) {
          console.log('Screen orientation lock not supported or failed:', error);
        }
      }

      // Enter fullscreen
      if (playerContainerRef.current.requestFullscreen) {
        await playerContainerRef.current.requestFullscreen();
      }
      
      setHasStartedPlaying(true);
    } catch (error) {
      console.log('Fullscreen request failed:', error);
      setHasStartedPlaying(true);
    }
  }, [hasStartedPlaying]);

  // Netflix-style control hiding with proper timeout management
  const hideControlsTimer = useCallback(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
      setControlsTimeout(null);
    }
    
    // Always show controls when paused or not in fullscreen
    if (!isPlaying || !isFullscreen) {
      setShowControls(true);
      return;
    }

    // Hide controls after 3 seconds of inactivity when playing in fullscreen
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  }, [isPlaying, isFullscreen, controlsTimeout]);

  // Show controls and reset timer on mouse movement
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControlsTimer();
  }, [hideControlsTimer]);

  // Handle mouse leave to start hiding timer
  const handleMouseLeave = useCallback(() => {
    if (isPlaying && isFullscreen) {
      hideControlsTimer();
    }
  }, [isPlaying, isFullscreen, hideControlsTimer]);

  // Media control functions
  const togglePlayPause = useCallback(() => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      const playPromise = mediaRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Play failed:', error);
        });
      }
    }
  }, [isPlaying, mediaRef]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const adjustVolume = useCallback((delta: number) => {
    const newVolume = Math.max(0, Math.min(100, volume + delta));
    setVolume(newVolume);
    setIsMuted(false);
  }, [volume]);

  const skipTime = useCallback((seconds: number) => {
    if (!mediaRef.current || duration === 0) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    mediaRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [mediaRef, duration, currentTime]);

  const enterFullscreen = useCallback(async () => {
    if (!playerContainerRef.current) return;
    
    try {
      // For mobile devices, request screen orientation lock to landscape
      if ('screen' in window && 'orientation' in window.screen && window.screen.orientation) {
        try {
          const orientation = window.screen.orientation as any;
          if (orientation.lock) {
            await orientation.lock('landscape');
          }
        } catch (error) {
          console.log('Screen orientation lock failed:', error);
        }
      }
      
      await playerContainerRef.current.requestFullscreen();
    } catch (error) {
      console.log('Fullscreen request failed:', error);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;

    if (document.fullscreenElement) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [exitFullscreen, enterFullscreen]);

  // Improved close functionality
  const handleClose = useCallback(() => {
    // Clear any timeouts
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
      setControlsTimeout(null);
    }

    // Pause media
    if (mediaRef.current) {
      mediaRef.current.pause();
    }

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }

    // Unlock screen orientation on mobile
    if ('screen' in window && 'orientation' in window.screen && window.screen.orientation) {
      try {
        window.screen.orientation.unlock();
      } catch (error) {
        console.log('Screen orientation unlock failed:', error);
      }
    }

    // Reset states
    setIsPlaying(false);
    setIsFullscreen(false);
    setShowControls(true);
    setHasStartedPlaying(false);

    // Close modal
    onClose();
  }, [controlsTimeout, mediaRef, onClose]);

  // Keyboard and mouse event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Prevent browser defaults for media keys
      const mediaKeys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyF', 'KeyM', 'Escape'];
      if (mediaKeys.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
          togglePlayPause();
          break;
        case 'ArrowLeft':
          skipTime(-10);
          break;
        case 'ArrowRight':
          skipTime(10);
          break;
        case 'ArrowUp':
          adjustVolume(5);
          break;
        case 'ArrowDown':
          adjustVolume(-5);
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'Escape':
          handleClose();
          break;
        case 'Comma':
          if (event.shiftKey) {
            changePlaybackRate(playbackRate - 0.25);
          }
          break;
        case 'Period':
          if (event.shiftKey) {
            changePlaybackRate(playbackRate + 0.25);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isOpen, 
    playbackRate, 
    handleClose,
    togglePlayPause,
    skipTime,
    adjustVolume,
    toggleFullscreen,
    toggleMute
  ]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      
      if (!isInFullscreen) {
        setShowControls(true);
        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
          setControlsTimeout(null);
        }
      } else {
        hideControlsTimer();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hideControlsTimer, controlsTimeout]);

  // Reset state when modal opens/closes and auto-start playback
  useEffect(() => {
    if (isOpen && media) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setShowControls(true);
      setHasStartedPlaying(false);
      
      // Auto-start playback after a short delay to ensure everything is loaded
      const autoPlayTimer = setTimeout(() => {
        if (mediaRef.current) {
          const playPromise = mediaRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log('Auto-play failed:', error);
              // Auto-play was prevented, user will need to click play
            });
          }
        }
      }, 100);
      
      return () => clearTimeout(autoPlayTimer);
    } else {
      if (mediaRef.current) {
        mediaRef.current.pause();
        setIsPlaying(false);
      }
      // Clean up on close
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
        setControlsTimeout(null);
      }
    }
  }, [isOpen, media, mediaRef, controlsTimeout]);

  // Handle media events
  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement || !isOpen) return;

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
      setIsBuffering(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
      if (nextEpisode) {
        setShowNextEpisode(true);
      } else if (recommendedMedia.length > 0) {
        setShowRecommendations(true);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      // Auto-enter fullscreen on first play
      if (!hasStartedPlaying) {
        autoEnterFullscreen();
      }
      // Start control hiding timer
      hideControlsTimer();
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
      // Clear hiding timer when paused
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
        setControlsTimeout(null);
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('ended', handleEnded);
    mediaElement.addEventListener('play', handlePlay);
    mediaElement.addEventListener('pause', handlePause);
    mediaElement.addEventListener('waiting', handleWaiting);
    mediaElement.addEventListener('canplay', handleCanPlay);

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('ended', handleEnded);
      mediaElement.removeEventListener('play', handlePlay);
      mediaElement.removeEventListener('pause', handlePause);
      mediaElement.removeEventListener('waiting', handleWaiting);
      mediaElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [mediaRef, isOpen, nextEpisode, recommendedMedia, hasStartedPlaying, autoEnterFullscreen, hideControlsTimer, controlsTimeout]);

  // Set volume and playback rate
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = isMuted ? 0 : volume / 100;
      mediaRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate, mediaRef]);

  // Update controls visibility based on playing state and fullscreen
  useEffect(() => {
    hideControlsTimer();
  }, [isPlaying, isFullscreen, hideControlsTimer]);


  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    mediaRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setVolume(newVolume);
    setIsMuted(false);
  };


  const changePlaybackRate = (rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(2, rate));
    setPlaybackRate(clampedRate);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isOpen || !media) return null;

  const isVideo = media.type === 'video';
  const isAudio = media.type === 'audio';
  const isImage = media.type === 'image';

  return (
    <div 
      ref={playerContainerRef}
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden`}
      style={{ cursor: isFullscreen && !showControls ? 'none' : 'default' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Close Button - Always visible but with proper styling */}
      <button
        onClick={handleClose}
        className={`absolute top-4 right-4 z-60 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 ${
          showControls || !isFullscreen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Media Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Video Player */}
        {isVideo && media.url && (
          <video
            ref={videoRef}
            src={media.url}
            className="w-full h-full object-contain"
            poster={media.image !== '/placeholder.svg' ? media.image : undefined}
            preload="metadata"
            playsInline
          />
        )}

        {/* Audio Player with Visualization */}
        {isAudio && media.url && (
          <div className="w-full h-full flex items-center justify-center relative">
            <audio ref={audioRef} src={media.url} preload="metadata" />
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
                      <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 border-4 border-white/30 rounded-full"></div>
                        <div 
                          className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"
                          style={{ animationDuration: '2s' }}
                        ></div>
                      </div>
                    ) : (
                      <Play className="w-16 h-16 text-white" />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{media.title}</h2>
                  <p className="text-white/80">Audio Playback</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer */}
        {isImage && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={media.url || media.image} 
              alt={media.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Loading Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-40">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Media Controls - Netflix-style with proper visibility */}
      {(isVideo || isAudio) && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 z-50 ${
            showControls ? 
              'opacity-100 translate-y-0' : 
              'opacity-0 translate-y-full pointer-events-none'
          }`}
        >
          {/* Progress Bar */}
          <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-3 sm:pb-4">
            <div 
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-red-600 rounded-full transition-all relative group-hover:bg-red-500"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-white/70 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{duration ? formatTime(duration) : media.duration || '0:00'}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => skipTime(-10)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                title="Rewind 10s"
              >
                <Rewind className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              
              <button 
                onClick={togglePlayPause}
                className="p-3 sm:p-4 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                ) : (
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1" />
                )}
              </button>
              
              <button 
                onClick={() => skipTime(10)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                title="Forward 10s"
              >
                <FastForward className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>

              {nextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors touch-manipulation"
                  title="Next Episode"
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-white text-xs sm:text-sm hidden sm:inline">Next</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Volume Control */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>
                <div 
                  className="w-16 sm:w-24 h-1 bg-white/30 rounded-full cursor-pointer group touch-manipulation hidden sm:block"
                  onClick={handleVolumeChange}
                >
                  <div 
                    className="h-full bg-white rounded-full group-hover:bg-white/80 transition-colors"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  ></div>
                </div>
                <span className="text-white/70 text-xs sm:text-sm w-6 sm:w-8 text-right hidden sm:inline">
                  {Math.round(isMuted ? 0 : volume)}
                </span>
              </div>

              {/* Settings */}
              <div className="relative hidden sm:block">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                
                {showSettings && (
                  <div className="absolute bottom-12 right-0 bg-black/90 backdrop-blur-sm rounded-lg p-4 w-48">
                    <div className="mb-3">
                      <label className="text-white/70 text-sm">Speed</label>
                      <div className="flex gap-1 mt-1">
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => changePlaybackRate(rate)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              playbackRate === rate 
                                ? 'bg-red-600 text-white' 
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button 
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Episode Overlay */}
      {showNextEpisode && nextEpisode && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-black/90 backdrop-blur-sm rounded-xl p-8 max-w-md mx-4 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Next Episode</h3>
            <div className="mb-6">
              <img 
                src={nextEpisode.image} 
                alt={nextEpisode.title}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
              <h4 className="text-lg font-semibold text-white">{nextEpisode.title}</h4>
              {nextEpisode.duration && (
                <p className="text-white/70 text-sm mt-1">{nextEpisode.duration}</p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowNextEpisode(false)}
                className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                Continue Watching
              </button>
              <button
                onClick={() => {
                  setShowNextEpisode(false);
                  onNextEpisode?.();
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Play Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Overlay */}
      {showRecommendations && recommendedMedia.length > 0 && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-60">
          <div className="bg-black/90 backdrop-blur-sm rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">You might also like</h3>
              <button
                onClick={() => setShowRecommendations(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendedMedia.map((item, index) => (
                <div 
                  key={index}
                  className="group cursor-pointer"
                  onClick={() => {
                    setShowRecommendations(false);
                    onRecommendedSelect?.(item);
                  }}
                >
                  <div className="relative overflow-hidden rounded-lg mb-2">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <h4 className="text-sm font-medium line-clamp-2 text-white">{item.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                    {item.year && <span>{item.year}</span>}
                    {item.duration && <span>{item.duration}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {!isFullscreen && (
        <div className="absolute bottom-4 left-4 text-white/50 text-xs z-50">
          <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1">
            Press F for fullscreen • Space to play/pause • ← → to seek
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;
