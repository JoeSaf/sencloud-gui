import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Upload, Settings, User, LogOut, Search, Play } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

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
              <NavLink
                to="/admin"
                className={({ isActive }) => 
                  `nav-link text-sm lg:text-base ${isActive ? 'active' : ''}`
                }
              >
                <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-2" />
                Admin
              </NavLink>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="p-1.5 sm:p-2 rounded-lg hover:bg-accent transition-colors">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
              <button className="p-1.5 sm:p-2 rounded-lg hover:bg-accent transition-colors">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
              <button className="hidden sm:block p-1.5 sm:p-2 rounded-lg hover:bg-accent transition-colors">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
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
    </div>
  );
};

export default Layout;