// src/pages/Gallery.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import MediaCarousel from '../components/MediaCarousel';
import MediaPlayer from '../components/MediaPlayer';
import { apiService, MediaFile } from '../services/api';
import { Play, Info, Loader2, AlertCircle, Folder, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import heroBg from '../assets/hero-bg.jpg';

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

  // Transform backend data to frontend format
  const transformMediaFile = (file: MediaFile): MediaItem => {
    const baseTitle = file.filename.replace(/\.[^/.]+$/, '');
    const formattedTitle = baseTitle
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return {
      id: file.relative_path,
      title: formattedTitle,
      image: file.thumbnail 
        ? apiService.getThumbnailUrl(file.thumbnail)
        : '/placeholder.svg',
      duration: file.type === 'video' ? 'Unknown' : undefined,
      year: new Date(file.modified).getFullYear().toString(),
      genre: file.type === 'video' ? 'Video' : file.type === 'audio' ? 'Audio' : 'Media',
      type: file.type,
      url: apiService.getStreamUrl(file.relative_path),
    };
  };

  // Process media files
  const mediaFiles = mediaResponse?.success ? mediaResponse.data || [] : [];
  const allMedia = mediaFiles.map(transformMediaFile);

  // Group files by directory
  const mediaByDirectory: { [key: string]: { [type: string]: MediaItem[] } } = {};
  
  mediaFiles.forEach(file => {
    const directory = file.folder || 'Root';
    const type = file.type;
    
    if (!mediaByDirectory[directory]) {
      mediaByDirectory[directory] = {};
    }
    if (!mediaByDirectory[directory][type]) {
      mediaByDirectory[directory][type] = [];
    }
    
    mediaByDirectory[directory][type].push(transformMediaFile(file));
  });

  // Set featured media
  useEffect(() => {
    if (allMedia.length > 0 && !featuredMedia) {
      const recentVideo = allMedia
        .filter(item => item.type === 'video')
        .sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'))[0];
      setFeaturedMedia(recentVideo || allMedia[0]);
    }
  }, [allMedia, featuredMedia]);

  const handleItemClick = async (item: MediaItem) => {
    if (item.type === 'video') {
      try {
        const videoInfo = await apiService.getVideoInfo(item.id);
        if (videoInfo.success && videoInfo.data) {
          const enhancedItem = {
            ...item,
            duration: videoInfo.data.duration 
              ? `${Math.floor(videoInfo.data.duration / 3600)}h ${Math.floor((videoInfo.data.duration % 3600) / 60)}m`
              : item.duration,
          };
          setSelectedMedia(enhancedItem);
        } else {
          setSelectedMedia(item);
        }
      } catch (error) {
        console.error('Error fetching video info:', error);
        setSelectedMedia(item);
      }
    } else {
      setSelectedMedia(item);
    }
    
    setIsPlayerOpen(true);
  };

  const handleFeaturedPlay = () => {
    if (featuredMedia) {
      handleItemClick(featuredMedia);
    }
  };

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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your media library...</p>
        </div>
      </div>
    );
  }

  if (error || !mediaResponse?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Media
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading your media library. Please try again.
          </p>
          <button 
            onClick={handleRefresh} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get recent items (last 10)
  const recentItems = allMedia
    .sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            {featuredMedia?.title || 'Welcome to MediaServer'}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            {featuredMedia 
              ? `Enjoy your ${featuredMedia.type} collection with seamless streaming and beautiful interface.`
              : 'Your personal media streaming platform. Upload, organize, and enjoy your content anywhere.'
            }
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {featuredMedia && (
              <button 
                onClick={handleFeaturedPlay}
                className="flex items-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Play Now
              </button>
            )}
            <button className="flex items-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm">
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              Browse Library
            </button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                {directory === 'Root' ? 'Root Directory' : directory}
              </h2>
            </div>

            {/* Type subcategories within directory */}
            {Object.entries(typeGroups).map(([type, items]) => (
              <div key={`${directory}-${type}`} className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                    {type === 'video' && <Play className="w-4 h-4" />}
                    {type === 'audio' && <span className="w-4 h-4 text-center">♫</span>}
                    {type === 'image' && <span className="w-4 h-4 text-center">🖼</span>}
                    {type}s ({items.length})
                  </h3>
                  
                  {items.length > 6 && (
                    <Link
                      to={`/browse/${type}?folder=${encodeURIComponent(directory === 'Root' ? '' : directory)}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors text-sm"
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
                      className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                            <Play className="w-5 h-5 text-white ml-1" />
                          </div>
                        </div>

                        {item.duration && item.duration !== 'Unknown' && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 rounded-lg text-xs text-white">
                            {item.duration}
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>{item.year}</span>
                          {item.genre && (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md">
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
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
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Media Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start building your library by uploading some media files.
            </p>
            <Link 
              to="/upload" 
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      />
    </div>
  );
};

export default Gallery;