// src/components/Layout.tsx - Updated with enhanced mobile navigation
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Cloud,
  Upload, 
  Settings, 
  User, 
  LogOut, 
  Search, 
  Play, 
  Menu, 
  X,
  Bell,
  Wifi
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import SearchModal from './SearchModal';
import MediaPlayer from './MediaPlayer';
import MobileNavigation from './MobileNavigation';
import MobileBottomNav from './MobileBottomNav';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (!isAuthPage) {
          handleSearchOpen();
        }
      }
      
      // Escape to close modals
      if (event.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isMobileMenuOpen, isAuthPage]);

  // Navigation items
  const navItems = [
    { 
      to: '/', 
      icon: Home, 
      label: 'Gallery',
      description: 'Browse your media collection'
    },
    { 
      to: '/upload', 
      icon: Upload, 
      label: 'Upload',
      description: 'Add new media files'
    },
    ...(user?.is_admin ? [{
      to: '/admin',
      icon: Settings,
      label: 'Admin',
      description: 'System administration'
    }] : [])
  ];

  if (isAuthPage) {
    return <div className="min-h-screen hero-gradient">{children}</div>;
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-60 bg-destructive text-destructive-foreground text-center py-2 text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <Wifi className="w-4 h-4" />
            You're currently offline. Some features may not work.
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        !isOnline ? 'top-10' : 'top-0'
      } ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-xl border-b border-border/20 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 primary-gradient rounded-xl flex items-center justify-center shadow-lg">
                <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">SenKloud</h1>
                <div className="text-xs text-muted-foreground">Personal Media Hub</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => 
                    `nav-link flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="font-medium text-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
              <button
                onClick={handleSearchOpen}
                className="w-full flex items-center gap-3 px-4 py-3 bg-accent/30 hover:bg-accent/50 rounded-2xl border border-border/20 transition-all duration-200 text-left group shadow-sm hover:shadow-md"
              >
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors flex-1 text-sm">
                  Search your media library...
                </span>
                <div className="flex items-center gap-1 opacity-60">
                  <kbd className="px-2 py-1 text-xs bg-background/50 rounded border font-mono">⌘</kbd>
                  <kbd className="px-2 py-1 text-xs bg-background/50 rounded border font-mono">K</kbd>
                </div>
              </button>
            </div>

            {/* Desktop User Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Notifications */}
              <button className="p-2.5 rounded-xl hover:bg-accent/50 transition-colors relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-accent/30 rounded-2xl border border-border/20">
                <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center ring-2 ring-primary/20">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{user?.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.is_admin ? '👑 Admin' : '👤 User'}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-destructive/20 transition-colors group ml-2"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                </button>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Mobile Search */}
              <button 
                onClick={handleSearchOpen}
                className="p-2.5 rounded-xl hover:bg-accent/50 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-xl hover:bg-accent/50 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-foreground" />
                ) : (
                  <Menu className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Component */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        !isOnline ? 'pt-24 sm:pt-28' : 'pt-16 sm:pt-20'
      } pb-20 md:pb-0`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        user={user}
        onSearchOpen={handleSearchOpen}
      />

      {/* Footer - Hidden on mobile */}
      <footer className="hidden md:block border-t border-border/20 mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between text-muted-foreground gap-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">SenKloud</p>
                <p className="text-xs">© 2025 All rights reserved.</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors text-sm">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors text-sm">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors text-sm">Support</a>
              <a href="#" className="hover:text-foreground transition-colors text-sm">API</a>
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