import React, { useState } from 'react';
import { BarChart3, Users, Film, HardDrive, Settings, Trash2, Edit, Eye } from 'lucide-react';
import movie1 from '../assets/movie1.jpg';
import movie2 from '../assets/movie2.jpg';
import movie3 from '../assets/movie3.jpg';
import movie4 from '../assets/movie4.jpg';

interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'tv' | 'music';
  image: string;
  size: string;
  uploadDate: string;
  views: number;
  status: 'active' | 'processing' | 'error';
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'users' | 'settings'>('overview');

  const mediaItems: MediaItem[] = [
    { id: '1', title: 'Cosmic Odyssey', type: 'movie', image: movie1, size: '4.2 GB', uploadDate: '2024-01-15', views: 1250, status: 'active' },
    { id: '2', title: 'Dark Thunder', type: 'movie', image: movie2, size: '3.8 GB', uploadDate: '2024-01-14', views: 890, status: 'active' },
    { id: '3', title: 'Shadow Conspiracy', type: 'tv', image: movie3, size: '2.1 GB', uploadDate: '2024-01-12', views: 2100, status: 'processing' },
    { id: '4', title: 'Mystic Realms', type: 'movie', image: movie4, size: '5.1 GB', uploadDate: '2024-01-10', views: 1680, status: 'active' },
  ];

  const stats = [
    { label: 'Total Media', value: '1,234', icon: Film, color: 'text-blue-400' },
    { label: 'Active Users', value: '567', icon: Users, color: 'text-green-400' },
    { label: 'Storage Used', value: '2.4 TB', icon: HardDrive, color: 'text-yellow-400' },
    { label: 'Monthly Views', value: '89.2K', icon: BarChart3, color: 'text-purple-400' },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card-gradient rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-accent ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card-gradient rounded-xl p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            'New user registered: john.doe@email.com',
            'Media uploaded: "Cosmic Adventure"',
            'System backup completed',
            'User "admin" logged in',
            'Media processed: "Dark Secrets"'
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <p className="text-foreground">{activity}</p>
              <span className="text-xs text-muted-foreground ml-auto">
                {index + 1}h ago
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">Media Library</h3>
        <div className="flex items-center gap-3">
          <select className="input-field">
            <option>All Types</option>
            <option>Movies</option>
            <option>TV Shows</option>
            <option>Music</option>
          </select>
          <select className="input-field">
            <option>All Status</option>
            <option>Active</option>
            <option>Processing</option>
            <option>Error</option>
          </select>
        </div>
      </div>

      <div className="card-gradient rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/50">
              <tr>
                <th className="text-left p-4 text-muted-foreground font-medium">Media</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Type</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Size</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Upload Date</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Views</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mediaItems.map((item) => (
                <tr key={item.id} className="border-b border-border/20">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded-lg"
                      />
                      <span className="font-medium text-foreground">{item.title}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-muted-foreground">{item.type}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{item.size}</td>
                  <td className="p-4 text-muted-foreground">{item.uploadDate}</td>
                  <td className="p-4 text-muted-foreground">{item.views.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-destructive/20 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">System Settings</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="card-gradient rounded-xl p-6">
          <h4 className="text-lg font-medium text-foreground mb-4">General</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Server Name
              </label>
              <input 
                type="text" 
                defaultValue="MediaServer"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Upload Size
              </label>
              <select className="input-field">
                <option>2 GB</option>
                <option>5 GB</option>
                <option>10 GB</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card-gradient rounded-xl p-6">
          <h4 className="text-lg font-medium text-foreground mb-4">Security</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Require Authentication</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Enable 2FA</span>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">Auto-scan Media</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Save Settings</button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'media', label: 'Media', icon: Film },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Manage your media server and monitor system performance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-muted-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'media' && renderMedia()}
      {activeTab === 'settings' && renderSettings()}
    </div>
  );
};

export default Admin;