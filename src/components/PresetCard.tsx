import React, { useState } from 'react';
import { PresetItem } from '../types/gradient';
import { GradientCanvas } from './GradientCanvas';
import { staticFallbackCss } from '../engine';
import { Heart } from 'lucide-react';

interface PresetCardProps {
  preset: PresetItem;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenStudio: (preset: PresetItem) => void;
  onOpenExport?: (preset: PresetItem) => void;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isFavorite,
  onToggleFavorite,
  onOpenStudio,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      onClick={() => onOpenStudio(preset)}
      className="group flex flex-col gap-3 cursor-pointer w-full select-none"
    >
      {/* 1. Standalone Rounded Rectangle Screen Frame */}
      <div 
        className="relative w-full aspect-[16/10] rounded-3xl border border-white/[0.08] group-hover:border-amber-400/30 overflow-hidden shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-amber-500/10 group-hover:scale-[1.01]"
        style={{
          background: staticFallbackCss(preset.params),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Shimmer Light Ray Loading Animation */}
        {!imageLoaded && !imageError && preset.image && (
          <div className="absolute inset-0 z-0 bg-[#070a12]/60">
            <div className="shimmer-ray" />
          </div>
        )}

        {/* Baseline Static Image: Stays underneath at time=0 so there is ZERO jump */}
        {preset.image && !imageError && (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={`${preset.image}?v=5`}
              alt={preset.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        )}

        {/* Live WebGL2 Animation on Hover or if image failed */}
        {(isHovered || imageError) && (
          <div className="absolute inset-0 w-full h-full">
            <GradientCanvas 
              params={preset.params} 
              interactive={true}
              transparentBackground={true}
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* 2. Outside the screen: Preset Name and Favorite Heart */}
      <div className="flex items-center justify-between px-1.5 pt-0.5">
        <h3 className="font-bold text-white text-base sm:text-lg tracking-tight group-hover:text-amber-300 transition-colors">
          {preset.name}
        </h3>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(preset.id);
          }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-90"
        >
          <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-rose-500 fill-rose-500' : 'stroke-[1.75]'}`} />
        </button>
      </div>
    </div>
  );
};
