// src/components/MediaPlayer.tsx - Enhanced with Netflix-style fullscreen controls
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

  const mediaRef = media?.type === 'video' ? videoRef : audioRef;

  // Hide controls after inactivity in fullscreen
  const hideControlsTimer = useCallback(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    if (isFullscreen && isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  }, [isFullscreen, isPlaying, controlsTimeout]);

  // Show controls on mouse movement
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControlsTimer();
  }, [hideControlsTimer]);

  // Keyboard and mouse event handlers - FIXED VERSION
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
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
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

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [
    isOpen, 
    isFullscreen, 
    playbackRate, 
    handleMouseMove, 
    controlsTimeout,
    isPlaying,
    volume,
    isMuted
  ]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      
      if (!isInFullscreen) {
        setShowControls(true);
        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
        }
      } else {
        hideControlsTimer();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hideControlsTimer, controlsTimeout]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setShowControls(true);
    } else {
      if (mediaRef.current) {
        mediaRef.current.pause();
        setIsPlaying(false);
      }
      // Exit fullscreen when closing
      if (isFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isOpen, mediaRef, isFullscreen]);

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
      if (nextEpisode) {
        setShowNextEpisode(true);
      } else if (recommendedMedia.length > 0) {
        setShowRecommendations(true);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    
    const handlePause = () => setIsPlaying(false);
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
  }, [mediaRef, isOpen, nextEpisode, recommendedMedia]);

  // Set volume and playback rate
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = isMuted ? 0 : volume / 100;
      mediaRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate, mediaRef]);

  const togglePlayPause = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(100, volume + delta));
    setVolume(newVolume);
    setIsMuted(false);
  };

  const skipTime = (seconds: number) => {
    if (!mediaRef.current || duration === 0) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    mediaRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

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

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (document.fullscreenElement) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  const enterFullscreen = () => {
    if (playerContainerRef.current) {
      playerContainerRef.current.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
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
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center ${
        isFullscreen ? 'cursor-none' : ''
      }`}
      style={{ cursor: isFullscreen && !showControls ? 'none' : 'default' }}
      onMouseMove={handleMouseMove}
    >
      {/* Close Button - Hide in fullscreen unless controls are shown */}
      {(!isFullscreen || showControls) && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-60 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      )}

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
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Media Controls - Only show for video/audio */}
      {(isVideo || isAudio) && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 ${
            showControls && !isImage ? 
              'opacity-100 translate-y-0' : 
              'opacity-0 translate-y-full pointer-events-none'
          }`}>
          {/* Progress Bar */}
          <div className="px-6 pt-4">
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
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => skipTime(-10)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Rewind 10s"
              >
                <Rewind className="w-6 h-6 text-white" />
              </button>
              
              <button 
                onClick={togglePlayPause}
                className="p-4 hover:bg-white/20 rounded-full transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
              
              <button 
                onClick={() => skipTime(10)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Forward 10s"
              >
                <FastForward className="w-6 h-6 text-white" />
              </button>

              {nextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title="Next Episode"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                  <span className="text-white text-sm">Next</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <div 
                  className="w-24 h-1 bg-white/30 rounded-full cursor-pointer group"
                  onClick={handleVolumeChange}
                >
                  <div 
                    className="h-full bg-white rounded-full group-hover:bg-white/80 transition-colors"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  ></div>
                </div>
                <span className="text-white/70 text-sm w-8 text-right">
                  {Math.round(isMuted ? 0 : volume)}
                </span>
              </div>

              {/* Settings */}
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-white" />
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
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-white" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Episode Overlay */}
      {showNextEpisode && nextEpisode && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
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
                  <h4 className="text-sm font-medium line-clamp-2 text-gray-900">{item.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    {item.year && <span>{item.year}</span>}
                    {item.duration && <span>{item.duration}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint - Only show when not in fullscreen */}
      {!isFullscreen && (
        <div className="absolute bottom-4 left-4 text-white/50 text-xs">
          <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1">
            Press F for fullscreen • Space to play/pause • ← → to seek
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;