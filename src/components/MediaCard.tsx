import React from 'react';
import { Play, Clock, Calendar } from 'lucide-react';

interface MediaCardProps {
  title: string;
  image: string;
  duration?: string;
  year?: string;
  genre?: string;
  onClick?: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
  title,
  image,
  duration,
  year,
  genre,
  onClick
}) => {
  return (
    <div className="media-card group" onClick={onClick}>
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-16 h-16 primary-gradient rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </div>

        {/* Duration Badge */}
        {duration && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/80 rounded-lg text-xs text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {year && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {year}
            </div>
          )}
          {genre && (
            <span className="px-2 py-1 bg-accent rounded-md text-xs">
              {genre}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;