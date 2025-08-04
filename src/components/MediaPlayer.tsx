import React from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward } from 'lucide-react';

interface MediaPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    title: string;
    image: string;
    duration?: string;
    year?: string;
    genre?: string;
  } | null;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ isOpen, onClose, media }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(45); // Mock current time in minutes
  const [volume, setVolume] = React.useState(75);

  if (!isOpen || !media) return null;

  const totalDuration = media.duration ? parseInt(media.duration) * 60 : 7200; // Convert to seconds or default
  const progress = (currentTime * 60) / totalDuration * 100;

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

          {/* Video Player Area */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {/* Placeholder Video/Thumbnail */}
            <div 
              className="w-full h-full bg-cover bg-center relative"
              style={{ backgroundImage: `url(${media.image})` }}
            >
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <p className="text-white text-lg">Click to play</p>
                </div>
              </div>
            </div>

            {/* Player Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full h-1 bg-white/30 rounded-full cursor-pointer">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-white/70 mt-1">
                  <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>{media.duration || '2:00:00'}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    ) : (
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                    )}
                  </button>
                  <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Volume Control */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <div className="w-20 h-1 bg-white/30 rounded-full cursor-pointer">
                      <div 
                        className="h-full bg-white rounded-full"
                        style={{ width: `${isMuted ? 0 : volume}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Media Info */}
          <div className="text-white px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{media.title}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base text-white/70">
              {media.year && <span>{media.year}</span>}
              {media.duration && <span>{media.duration}</span>}
              {media.genre && <span>{media.genre}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;