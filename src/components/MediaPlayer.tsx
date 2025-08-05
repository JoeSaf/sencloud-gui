// src/components/MediaPlayer.tsx
import React, { useRef, useEffect, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward, Download, ChevronRight, Plus, ThumbsUp, ThumbsDown, Info } from 'lucide-react';

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

  const mediaRef = media?.type === 'video' ? videoRef : audioRef;

  // Handle mouse movement to show/hide controls in fullscreen
  const handleMouseMove = () => {
    if (!isFullscreen) return;
    
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000); // Hide after 3 seconds of inactivity
    
    setControlsTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setShowControls(true); // Always show controls when exiting fullscreen
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    } else {
      // Pause media when closing
      if (mediaRef.current) {
        mediaRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isOpen, mediaRef]);

  // Handle media events
  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement || !isOpen) return;

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('ended', handleEnded);
    mediaElement.addEventListener('play', handlePlay);
    mediaElement.addEventListener('pause', handlePause);

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('ended', handleEnded);
      mediaElement.removeEventListener('play', handlePlay);
      mediaElement.removeEventListener('pause', handlePause);
    };
  }, [mediaRef, isOpen]);

  // Set volume
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted, mediaRef]);

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
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isOpen || !media) return null;

  const isVideo = media.type === 'video';
  const isAudio = media.type === 'audio';
  const isImage = media.type === 'image';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Media Player Area */}
          <div 
            className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4"
            onMouseMove={handleMouseMove}
            style={{ cursor: isFullscreen && !showControls ? 'none' : 'default' }}
          >
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
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
                        {isPlaying ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </div>
                      <p className="text-white text-lg font-medium">{media.title}</p>
                      <p className="text-white/70 text-sm">Audio Track</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image Viewer */}
            {isImage && (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={media.url || media.image}
                  alt={media.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {/* Fallback for unknown types */}
            {!isVideo && !isAudio && !isImage && (
              <div className="w-full h-full flex items-center justify-center bg-accent/20">
                <div className="text-center">
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-foreground text-lg">Preview not available</p>
                  <p className="text-muted-foreground text-sm">
                    {media.type?.toUpperCase()} file
                  </p>
                </div>
              </div>
            )}

            {/* Next Episode Overlay */}
            {showNextEpisode && nextEpisode && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="bg-background/95 backdrop-blur-sm rounded-lg p-6 max-w-md mx-4 text-center">
                  <h3 className="text-xl font-semibold mb-2">Up Next</h3>
                  <img 
                    src={nextEpisode.image} 
                    alt={nextEpisode.title}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-lg font-medium mb-2">{nextEpisode.title}</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowNextEpisode(false);
                        onNextEpisode?.();
                      }}
                      className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Play Next Episode
                    </button>
                    <button
                      onClick={() => setShowNextEpisode(false)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Overlay */}
            {showRecommendations && recommendedMedia.length > 0 && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center overflow-y-auto">
                <div className="bg-background/95 backdrop-blur-sm rounded-lg p-6 max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">More Like This</h3>
                    <button
                      onClick={() => setShowRecommendations(false)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {recommendedMedia.slice(0, 8).map((item, index) => (
                      <div 
                        key={item.id || index}
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
                        <h4 className="text-sm font-medium line-clamp-2">{item.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {item.year && <span>{item.year}</span>}
                          {item.duration && <span>{item.duration}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Netflix-style top overlay with action buttons */}
            {!isFullscreen && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 sm:p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{media.title}</h1>
                    <div className="flex items-center gap-3">
                      {media.year && <span className="text-white/80 text-sm">{media.year}</span>}
                      {media.genre && <span className="text-white/80 text-sm">{media.genre}</span>}
                      {media.duration && <span className="text-white/80 text-sm">{media.duration}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
                      title="Add to List"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                    <button 
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
                      title="Like"
                    >
                      <ThumbsUp className="w-5 h-5 text-white" />
                    </button>
                    <button 
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
                      title="Dislike"
                    >
                      <ThumbsDown className="w-5 h-5 text-white" />
                    </button>
                    <button 
                      onClick={() => setShowRecommendations(true)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
                      title="More Info"
                    >
                      <Info className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Controls Overlay - Only for video and audio */}
            {(isVideo || isAudio) && (
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${
                  isFullscreen && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                {/* Progress Bar */}
                <div className="mb-4">
                  <div 
                    className="w-full h-1 bg-white/30 rounded-full cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-white/70 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{duration ? formatTime(duration) : media.duration || '0:00'}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <button 
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      onClick={() => {
                        if (mediaRef.current) {
                          mediaRef.current.currentTime = Math.max(0, currentTime - 10);
                        }
                      }}
                    >
                      <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </button>
                    <button 
                      onClick={togglePlayPause}
                      className="p-3 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      ) : (
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                      )}
                    </button>
                    <button 
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      onClick={() => {
                        if (mediaRef.current && duration) {
                          mediaRef.current.currentTime = Math.min(duration, currentTime + 10);
                        }
                      }}
                    >
                      <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Volume Control */}
                    <div className="hidden sm:flex items-center gap-2">
                      <button 
                        onClick={toggleMute}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <div 
                        className="w-20 h-1 bg-white/30 rounded-full cursor-pointer"
                        onClick={handleVolumeChange}
                      >
                        <div 
                          className="h-full bg-white rounded-full"
                          style={{ width: `${isMuted ? 0 : volume}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Download Button */}
                    {media.url && (
                      <a
                        href={media.url}
                        download={media.title}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </a>
                    )}

                    {/* Fullscreen Button - Only for video */}
                    {isVideo && (
                      <button 
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      >
                        <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Media Info and Actions */}
          <div className="text-white px-2">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{media.title}</h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base text-white/70">
                  {media.year && <span>{media.year}</span>}
                  {media.duration && <span>{media.duration}</span>}
                  {media.genre && <span>{media.genre}</span>}
                  {media.type && (
                    <span className="px-2 py-1 bg-primary/20 rounded-md text-primary text-xs uppercase">
                      {media.type}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {nextEpisode && (
                  <button
                    onClick={() => {
                      setShowNextEpisode(false);
                      onNextEpisode?.();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <span>Next Episode</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {recommendedMedia.length > 0 && (
                  <button
                    onClick={() => setShowRecommendations(true)}
                    className="px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    More Like This
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;