import React from 'react';
import { ViewMode } from '../types/gradient';
import { Sparkles, Heart } from 'lucide-react';
import { GradientfyLogo } from './GradientfyLogo';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  favoritesCount: number;
  totalPresets: number;
  onRandomPreset: () => void;
  onReplayIntro?: () => void;
  isReady?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  favoritesCount,
  totalPresets,
  onReplayIntro,
  isReady = true,
}) => {
  return (
    <header 
      className={`sticky top-0 z-50 w-full bg-[#030611]/80 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
        {/* Left: Custom Gradientfy Logo + Brand name */}
        <div 
          onClick={() => {
            onSelectView('catalog');
            onReplayIntro?.();
          }}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <GradientfyLogo size={30} className="group-hover:scale-105 transition-transform" />

          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[20px] tracking-[-0.025em] bg-gradient-to-r from-[#ffe57f] via-[#fff5cc] to-white bg-clip-text text-transparent group-hover:brightness-110 transition-all leading-none">
            Gradientfy
          </span>
        </div>

        {/* Center: Clean Minimal Nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-300">
          <button
            onClick={() => onSelectView('catalog')}
            className={`transition-colors hover:text-white ${
              currentView === 'catalog' ? 'text-white font-semibold' : 'text-zinc-400'
            }`}
          >
            Presets
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-white/10 text-zinc-300">
              {totalPresets}
            </span>
          </button>

          <button
            onClick={() => onSelectView('studio')}
            className={`transition-colors hover:text-white ${
              currentView === 'studio' ? 'text-white font-semibold' : 'text-zinc-400'
            }`}
          >
            Editor
          </button>

          <button
            onClick={() => onSelectView('collections')}
            className={`transition-colors hover:text-white ${
              currentView === 'collections' ? 'text-white font-semibold' : 'text-zinc-400'
            }`}
          >
            Collections
          </button>

          <button
            onClick={() => onSelectView('favorites')}
            className={`flex items-center gap-1.5 transition-colors hover:text-white ${
              currentView === 'favorites' ? 'text-white font-semibold' : 'text-zinc-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-zinc-400'}`} />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-rose-500/20 text-rose-300">
                {favoritesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right: Vibrant Gradient Yellow Pill Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectView('studio')}
            className="btn-gradient-yellow px-5 py-2 rounded-full text-xs sm:text-sm font-bold gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Open Studio</span>
          </button>
        </div>

      </div>
    </header>
  );
};
