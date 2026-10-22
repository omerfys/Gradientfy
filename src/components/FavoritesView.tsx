import React from 'react';
import { PresetItem } from '../types/gradient';
import { PresetCard } from './PresetCard';
import { Heart, Layers } from 'lucide-react';

interface FavoritesViewProps {
  presets: PresetItem[];
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpenStudio: (preset: PresetItem) => void;
  onOpenExport: (preset: PresetItem) => void;
  onGoToCatalog: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  presets,
  favorites,
  onToggleFavorite,
  onOpenStudio,
  onOpenExport,
  onGoToCatalog,
}) => {
  const favoritePresets = presets.filter((p) => favorites.has(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 w-fit">
          <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-amber-300">
            Saved Gradients
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Your Favorite Gradients ({favoritePresets.length})
        </h1>

        <p className="text-sm text-zinc-400">
          Gradients you have bookmarked for quick access and batch export.
        </p>
      </div>

      {favoritePresets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {favoritePresets.map((preset, idx) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              index={idx}
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
              onOpenStudio={onOpenStudio}
              onOpenExport={onOpenExport}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-16 rounded-3xl bg-white/[0.02] border border-white/[0.05] text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No favorites saved yet</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-sm">
              Click the heart icon on any gradient card in the catalog to add it to your favorites.
            </p>
          </div>
          <button
            onClick={onGoToCatalog}
            className="btn-gradient-yellow px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold gap-2"
          >
            <Layers className="w-4 h-4 text-black" />
            <span>Browse Catalog</span>
          </button>
        </div>
      )}

    </div>
  );
};
