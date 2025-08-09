// src/pages/Gallery.tsx - Updated navigation section
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import MediaCarousel from '../components/MediaCarousel';
import MediaPlayer from '../components/MediaPlayer';
import FolderThumbnailUpload from '../components/FolderThumbnailUpload';
import { apiService, MediaFile } from '../services/api';
import { Cloud, Play, Info, Loader2, AlertCircle, Folder, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import heroBg from '../assets/hero-bg.png';

interface MediaItem {
  id: string;
  title: string;
  image: string;
  duration?: string;
  year?: string;
  genre?: string;
  type?: string;
  url?: string;
}

const Gallery: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [featuredMedia, setFeaturedMedia] = useState<MediaItem | null>(null);
  const [folderThumbnails, setFolderThumbnails] = useState<{[key: string]: string}>({});
  const libraryRef = useRef<HTMLDivElement>(null);

  // Load folder thumbnails from localStorage
  useEffect(() => {
    try {
      const savedThumbnails = localStorage.getItem('folderThumbnails');
      if (savedThumbnails) {
        setFolderThumbnails(JSON.parse(savedThumbnails));
      }
    } catch (error) {
      console.error('Error loading folder thumbnails:', error);
    }
  }, []);

  // Fetch all media files
  const { 
    data: mediaResponse, 
    isLoading: mediaLoading, 
    error: mediaError,
    refetch: refetchMedia 
  } = useQuery({
    queryKey: ['media-files'],
    queryFn: () => apiService.getFiles(),
    refetchOnWindowFocus: false,
  });

  const isLoading = mediaLoading;
  const error = mediaError;

  // Transform backend data to frontend format with folder thumbnails
  const transformMediaFile = useCallback((file: MediaFile): MediaItem => {
    const baseTitle = file.filename.replace(/\.[^/.]+$/, '');
    const formattedTitle = baseTitle
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    // Extract directory from file path for folder thumbnail
    const pathParts = file.relative_path.split('/');
    const directory = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'Root';
    const folderThumbnail = folderThumbnails[directory];

    return {
      id: file.relative_path,
      title: formattedTitle,
      image: folderThumbnail || (file.thumbnail 
        ? apiService.getThumbnailUrl(file.thumbnail)
        : '/placeholder.svg'),
      duration: file.type === 'video' ? 'Unknown' : undefined,
      year: new Date(file.modified).getFullYear().toString(),
      genre: file.type === 'video' ? 'Video' : file.type === 'audio' ? 'Audio' : 'Media',
      type: file.type,
      url: apiService.getStreamUrl(file.relative_path),
    };
  }, [folderThumbnails]);

  // Process media files with memoization
  const mediaFiles = mediaResponse?.success ? mediaResponse.data || [] : [];
  const allMedia = useMemo(() => mediaFiles.map(transformMediaFile), [mediaFiles]);

  // Group files by directory with memoization
  const mediaByDirectory = useMemo(() => {
    const result: { [key: string]: { [type: string]: MediaItem[] } } = {};
    
    allMedia.forEach(item => {
      // Extract directory from the item id (path)
      const pathParts = item.id.split('/');
      const directory = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'Root';
      const type = item.type || 'unknown';
      
      if (!result[directory]) {
        result[directory] = {};
      }
      if (!result[directory][type]) {
        result[directory][type] = [];
      }
      
      result[directory][type].push(item);
    });
    
    return result;
  }, [allMedia]);

  // Get last watched media from localStorage
  const getLastWatchedMedia = () => {
    try {
      const lastWatched = localStorage.getItem('lastWatchedMedia');
      if (lastWatched) {
        const parsed = JSON.parse(lastWatched);
        return allMedia.find(item => item.id === parsed.id);
      }
    } catch (error) {
      console.error('Error getting last watched media:', error);
    }
    return null;
  };

  // Set featured media and get most recent
  useEffect(() => {
    if (allMedia.length > 0 && !featuredMedia) {
      const recentVideo = allMedia
        .filter(item => item.type === 'video')
        .sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'))[0];
      setFeaturedMedia(recentVideo || allMedia[0]);
    }
  }, [allMedia, featuredMedia]);

  // Get most recently added media
  const mostRecentMedia = useMemo(() => {
    if (allMedia.length === 0) return null;
    return allMedia
      .sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'))[0];
  }, [allMedia]);

  // Get last watched media
  const lastWatchedMedia = useMemo(() => {
    return getLastWatchedMedia();
  }, [allMedia]);

  const handleItemClick = useCallback(async (item: MediaItem) => {
    // Set initial media immediately to avoid delays
    setSelectedMedia(item);
    setIsPlayerOpen(true);
    
    // Save to localStorage for continue watching
    try {
      localStorage.setItem('lastWatchedMedia', JSON.stringify({
        id: item.id,
        title: item.title,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving last watched media:', error);
    }
    
    // Enhance with video info if needed (but don't re-set if same item)
    if (item.type === 'video' && item.duration === 'Unknown') {
      try {
        const videoInfo = await apiService.getVideoInfo(item.id);
        if (videoInfo.success && videoInfo.data) {
          const secs = Number((videoInfo.data as any).duration ?? 0);
          const enhancedItem = {
            ...item,
            duration: secs > 0 
              ? `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
              : item.duration,
          };
          // Only update if the selected media is still the same item
          setSelectedMedia(current => current?.id === item.id ? enhancedItem : current);
        }
      } catch (error) {
        console.error('Error fetching video info:', error);
      }
    }
  }, []);

  // Memoized next episode
  const nextEpisode = useMemo(() => {
    if (!selectedMedia) return null;
    
    const sameTypeMedia = allMedia.filter(item => 
      item.type === selectedMedia.type && 
      item.genre === selectedMedia.genre &&
      item.id !== selectedMedia.id
    );
    
    return sameTypeMedia.length > 0 ? sameTypeMedia[0] : null;
  }, [selectedMedia, allMedia]);

  // Memoized recommended media
  const recommendedMedia = useMemo(() => {
    if (!selectedMedia) return [];
    
    return allMedia
      .filter(item => 
        item.id !== selectedMedia.id && 
        (item.type === selectedMedia.type || item.genre === selectedMedia.genre)
      )
      .slice(0, 8);
  }, [selectedMedia, allMedia]);

  const handleNextEpisode = useCallback(() => {
    if (nextEpisode) {
      handleItemClick(nextEpisode);
    }
  }, [nextEpisode, handleItemClick]);

  const handleRecommendedSelect = useCallback((item: MediaItem) => {
    handleItemClick(item);
  }, [handleItemClick]);

  const handleFeaturedPlay = () => {
    if (featuredMedia) {
      handleItemClick(featuredMedia);
    }
  };

  const handleBrowseLibrary = () => {
    libraryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleThumbnailUploaded = useCallback((folderPath: string, thumbnailUrl: string) => {
    setFolderThumbnails(prev => {
      const updated = {
        ...prev,
        [folderPath]: thumbnailUrl
      };
      try {
        localStorage.setItem('folderThumbnails', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist folder thumbnails:', e);
      }
      return updated;
    });
  }, []);

  const handleRefresh = () => {
    refetchMedia();
    toast({
      title: "Refreshing",
      description: "Reloading media library...",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your media library...</p>
        </div>
      </div>
    );
  }

  if (error || !mediaResponse?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Failed to Load Media
          </h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading your media library. Please try again.
          </p>
          <button 
            onClick={handleRefresh} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get recent video items (last 10)
  const recentItems = allMedia
    .filter((m) => m.type === 'video')
    .sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] flex items-center justify-center bg-cover bg-center"
        style={{ 
          backgroundImage: featuredMedia?.image && featuredMedia.image !== '/placeholder.svg' 
            ? `url(${featuredMedia.image})` 
            : `url(${heroBg})` 
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
            {mostRecentMedia ? mostRecentMedia.title : 'Recently Added Media'}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            {lastWatchedMedia 
              ? `Continue watching: ${lastWatchedMedia.title}`
              : 'Your personal media streaming platform. Upload, organize, and enjoy your content anywhere.'
            }
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {featuredMedia && (
              <button 
                onClick={handleFeaturedPlay}
                className="btn-primary flex items-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Play Now
              </button>
            )}
            <button 
              onClick={handleBrowseLibrary}
              className="flex items-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              Browse Library
            </button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div ref={libraryRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Recent Items */}
        {recentItems.length > 0 && (
          <MediaCarousel
            title="Recently Added"
            items={recentItems}
            onItemClick={handleItemClick}
          />
        )}

        {/* Directory-based Categories */}
        {Object.entries(mediaByDirectory).map(([directory, typeGroups]) => (
          <div key={directory} className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                {directory === 'Root' ? 'Root Directory' : directory}
              </h2>
              <FolderThumbnailUpload
                folderPath={directory}
                fileType="video"
                onThumbnailUploaded={handleThumbnailUploaded}
                existingThumbnail={folderThumbnails[directory]}
              />
            </div>

            {/* Type subcategories within directory */}
            {Object.entries(typeGroups).map(([type, items]) => (
              <div key={`${directory}-${type}`} className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground capitalize flex items-center gap-2">
                    {type === 'video' && <Play className="w-4 h-4 text-primary" />}
                    {type === 'audio' && <span className="w-4 h-4 text-center text-primary">♫</span>}
                    {type === 'image' && <span className="w-4 h-4 text-center text-primary">🖼</span>}
                    {type}s ({items.length})
                  </h3>
                  
                  {items.length > 6 && (
                    <Link
                      to={`/browse/${type}?folder=${encodeURIComponent(directory === 'Root' ? '' : directory)}`}
                      className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {/* Show first 6 items */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {items.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="media-card group cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/placeholder.svg') {
                              target.src = '/placeholder.svg';
                            }
                          }}
                        />
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 primary-gradient rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                            <Play className="w-5 h-5 text-primary-foreground ml-1" />
                          </div>
                        </div>

                        {item.duration && item.duration !== 'Unknown' && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 rounded-lg text-xs text-white flex items-center gap-1">
                            <span className="w-2.5 h-2.5 text-center">⏱</span>
                            {item.duration}
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors text-sm">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{item.year}</span>
                          {item.genre && (
                            <span className="px-1.5 py-0.5 bg-accent rounded-md">
                              {item.genre}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show "View All" button if more than 6 items */}
                {items.length > 6 && (
                  <div className="mt-4 text-center">
                    <Link
                      to={`/browse/${type}?folder=${encodeURIComponent(directory === 'Root' ? '' : directory)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors text-sm"
                    >
                      View All {items.length} {type}s
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Empty State */}
        {Object.keys(mediaByDirectory).length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Media Found
            </h3>
            <p className="text-muted-foreground mb-6">
              Start building your library by uploading some media files.
            </p>
            <Link 
              to="/upload" 
              className="btn-primary"
            >
              Upload Media
            </Link>
          </div>
        )}
      </div>

      {/* Media Player Modal */}
      <MediaPlayer
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        media={selectedMedia}
        nextEpisode={nextEpisode}
        onNextEpisode={handleNextEpisode}
        recommendedMedia={recommendedMedia}
        onRecommendedSelect={handleRecommendedSelect}
      />
    </div>
  );
};

export default Gallery;