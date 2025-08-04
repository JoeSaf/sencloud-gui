import React from 'react';
import MediaCarousel from '../components/MediaCarousel';
import MediaPlayer from '../components/MediaPlayer';
import heroBg from '../assets/hero-bg.jpg';
import movie1 from '../assets/movie1.jpg';
import movie2 from '../assets/movie2.jpg';
import movie3 from '../assets/movie3.jpg';
import movie4 from '../assets/movie4.jpg';
import { Play, Info } from 'lucide-react';

const Gallery: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = React.useState<any>(null);
  const [isPlayerOpen, setIsPlayerOpen] = React.useState(false);
  // Mock data for different categories
  const recentlyAdded = [
    { id: '1', title: 'Cosmic Odyssey', image: movie1, duration: '2h 15m', year: '2024', genre: 'Sci-Fi' },
    { id: '2', title: 'Dark Thunder', image: movie2, duration: '1h 45m', year: '2024', genre: 'Action' },
    { id: '3', title: 'Shadow Conspiracy', image: movie3, duration: '2h 8m', year: '2023', genre: 'Thriller' },
    { id: '4', title: 'Mystic Realms', image: movie4, duration: '2h 32m', year: '2024', genre: 'Fantasy' },
    { id: '5', title: 'Stellar Adventures', image: movie1, duration: '1h 58m', year: '2023', genre: 'Adventure' },
    { id: '6', title: 'Urban Legends', image: movie2, duration: '1h 42m', year: '2024', genre: 'Horror' },
  ];

  const popularMovies = [
    { id: '7', title: 'Galaxy Wars', image: movie1, duration: '2h 22m', year: '2023', genre: 'Sci-Fi' },
    { id: '8', title: 'Fire Storm', image: movie2, duration: '2h 5m', year: '2024', genre: 'Action' },
    { id: '9', title: 'Night Hunter', image: movie3, duration: '1h 55m', year: '2023', genre: 'Crime' },
    { id: '10', title: 'Dragon Empire', image: movie4, duration: '2h 18m', year: '2024', genre: 'Fantasy' },
    { id: '11', title: 'Space Runners', image: movie1, duration: '1h 48m', year: '2023', genre: 'Adventure' },
  ];

  const tvShows = [
    { id: '12', title: 'Nebula Chronicles', image: movie1, duration: '45m ep', year: '2024', genre: 'Sci-Fi' },
    { id: '13', title: 'Combat Zone', image: movie2, duration: '50m ep', year: '2024', genre: 'Action' },
    { id: '14', title: 'Dark Secrets', image: movie3, duration: '42m ep', year: '2023', genre: 'Mystery' },
    { id: '15', title: 'Magic Kingdoms', image: movie4, duration: '55m ep', year: '2024', genre: 'Fantasy' },
  ];

  const handleItemClick = (item: any) => {
    setSelectedMedia(item);
    setIsPlayerOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 text-glow">
            Cosmic Odyssey
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Journey through the stars in this epic sci-fi adventure that will challenge everything you believe about the universe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button 
              onClick={() => {
                setSelectedMedia({ 
                  title: 'Cosmic Odyssey', 
                  image: heroBg, 
                  duration: '2h 15m', 
                  year: '2024', 
                  genre: 'Sci-Fi' 
                });
                setIsPlayerOpen(true);
              }}
              className="btn-primary flex items-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              Watch Now
            </button>
            <button className="btn-secondary flex items-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <MediaCarousel
          title="Recently Added"
          items={recentlyAdded}
          onItemClick={handleItemClick}
        />

        <MediaCarousel
          title="Popular Movies"
          items={popularMovies}
          onItemClick={handleItemClick}
        />

        <MediaCarousel
          title="TV Shows"
          items={tvShows}
          onItemClick={handleItemClick}
        />
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