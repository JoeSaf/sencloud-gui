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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">MediaServer</h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <NavLink
                to="/"
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Home className="w-4 h-4 mr-2" />
                Gallery
              </NavLink>
              <NavLink
                to="/upload"
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </NavLink>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                <User className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                <LogOut className="w-5 h-5 text-muted-foreground" />
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
      <footer className="border-t border-border/20 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-muted-foreground">
            <p>&copy; 2024 MediaServer. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;