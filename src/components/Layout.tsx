// src/components/Layout.tsx
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Upload, Settings, User, LogOut, Search, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import SearchModal from './SearchModal';
import MediaPlayer from './MediaPlayer';

interface LayoutProps {
  children: React.ReactNode;
}

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

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearchItemSelect = (item: any) => {
    const mediaItem: MediaItem = {
      id: item.id,
      title: item.title,
      image: item.image,
      duration: item.duration,
      year: item.year,
      genre: item.genre,
      type: item.type,
      url: item.url,
    };
    
    setSelectedMedia(mediaItem);
    setIsPlayerOpen(true);
  };

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (!isAuthPage) {
          handleSearchOpen();
        }
      }
      
      // Escape to close search
      if (event.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isAuthPage]);

  if (isAuthPage) {
    return <div className="min-h-screen hero-gradient">{children}</div>;
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Top Navigation */}
      <nav className="glass-effect border-b border-border/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 primary-gradient rounded-xl flex items-center justify-center">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">MediaServer</h1>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <button
                onClick={handleSearchOpen}
                className="w-full flex items-center gap-3 px-4 py-2 bg-accent/50 hover:bg-accent/70 rounded-lg border border-border/20 transition-colors text-left"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground flex-1">Search media...</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-border/30 rounded text-muted-foreground">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-border/30 rounded text-muted-foreground">K</kbd>
                </div>
              </button>
            </div>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink
                to="/"
                className={({ isActive }) => 
                  `nav-link text-sm lg:text-base ${isActive ? 'active' : ''}`
                }
              >
                <Home className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-2" />
                Gallery
              </NavLink>
              <NavLink
                to="/upload"
                className={({ isActive }) => 
                  `nav-link text-sm lg:text-base ${isActive ? 'active' : ''}`
                }
              >
                <Upload className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-2" />
                Upload
              </NavLink>
              {user?.is_admin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => 
                    `nav-link text-sm lg:text-base ${isActive ? 'active' : ''}`
                  }
                >
                  <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-2" />
                  Admin
                </NavLink>
              )}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Button */}
              <button 
                onClick={handleSearchOpen}
                className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
              
              {/* User Menu */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{user?.username}</span>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-effect border-t border-border/20 p-4">
          <div className="flex items-center justify-around">
            <NavLink
              to="/"
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Gallery</span>
            </NavLink>
            
            <button
              onClick={handleSearchOpen}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <Search className="w-5 h-5" />
              <span className="text-xs">Search</span>
            </button>
            
            <NavLink
              to="/upload"
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs">Upload</span>
            </NavLink>
            
            {user?.is_admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => 
                  `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Settings className="w-5 h-5" />
                <span className="text-xs">Admin</span>
              </NavLink>
            )}
            
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative pb-20 md:pb-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between text-muted-foreground gap-4">
            <p className="text-xs sm:text-sm text-center sm:text-left">&copy; 2024 MediaServer. All rights reserved.</p>
            <div className="flex items-center gap-3 sm:gap-4">
              <a href="#" className="hover:text-foreground transition-colors text-xs sm:text-sm">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors text-xs sm:text-sm">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors text-xs sm:text-sm">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onItemSelect={handleSearchItemSelect}
      />

      {/* Media Player */}
      <MediaPlayer
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        media={selectedMedia}
      />
    </div>
  );
};

export default Layout;