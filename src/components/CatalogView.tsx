import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PresetItem, PresetCollection } from '../types/gradient';
import { PresetCard } from './PresetCard';
import { GradientCanvas } from './GradientCanvas';
import { GradientParams } from '../engine';
import { 
  Search, 
  X, 
  Filter, 
  ArrowUpDown, 
  Layers, 
  Heart, 
  RotateCcw,
  LayoutGrid,
  Columns2
} from 'lucide-react';

interface CatalogViewProps {
  presets: PresetItem[];
  collections: PresetCollection[];
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpenStudio: (preset: PresetItem) => void;
  onOpenExport: (preset: PresetItem) => void;
  initialCollection?: string | null;
  isReady?: boolean;
}

const HERO_SHADER_PARAMS: GradientParams = {
  kind: 'silk',
  colors: ['#ffffff', '#9dd9ff', '#3d6fd0', '#0e1538'],
  background: '#030510',
  speed: 0.5,
  loopSeconds: 16,
  scale: 1.0,
  warp: 0.38,
  blur: 0.32,
  grain: 0.1,
  dither: { enabled: false, cell: 3, levels: 8 },
  seed: 31,
  interaction: { pointer: 0.18, scroll: 0.08 }
};

export const CatalogView: React.FC<CatalogViewProps> = ({
  presets,
  collections,
  favorites,
  onToggleFavorite,
  onOpenStudio,
  onOpenExport,
  initialCollection = null,
  isReady = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(initialCollection);
  const [selectedKind, setSelectedKind] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [toneFilter, setToneFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'colors-desc' | 'speed-desc'>('name-asc');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [columnsMode, setColumnsMode] = useState<'wide' | 'grid'>('wide'); // 2 cols vs 3 cols for expansive wide cards

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const catalogGridRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut: '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered & sorted presets with guaranteed deduplication
  const filteredPresets = useMemo(() => {
    const seen = new Set<string>();
    return presets
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesKind = p.params.kind.toLowerCase().includes(q);
          const matchesCollection = p.collections.some((c) => c.toLowerCase().includes(q));
          const matchesLooks = p.looks.some((l) => l.toLowerCase().includes(q));
          const matchesColor = p.params.colors.some((col) => col.toLowerCase().includes(q));
          if (!matchesName && !matchesKind && !matchesCollection && !matchesLooks && !matchesColor) {
            return false;
          }
        }

        if (selectedCollection && !p.collections.includes(selectedCollection)) {
          return false;
        }

        if (selectedKind && p.params.kind !== selectedKind) {
          return false;
        }

        if (tierFilter !== 'all' && p.tier !== tierFilter) {
          return false;
        }

        if (toneFilter !== 'all' && p.tone !== toneFilter) {
          return false;
        }

        if (favoritesOnly && !favorites.has(p.id)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'colors-desc') return b.params.colors.length - a.params.colors.length;
        if (sortBy === 'speed-desc') return b.params.speed - a.params.speed;
        return 0;
      });
  }, [presets, searchQuery, selectedCollection, selectedKind, tierFilter, toneFilter, favoritesOnly, favorites, sortBy]);

  const uniqueKinds = useMemo(() => {
    const set = new Set<string>();
    for (const p of presets) {
      if (p.params.kind) set.add(p.params.kind);
    }
    return Array.from(set).sort();
  }, [presets]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCollection(null);
    setSelectedKind(null);
    setTierFilter('all');
    setToneFilter('all');
    setFavoritesOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCollection || selectedKind || tierFilter !== 'all' || toneFilter !== 'all' || favoritesOnly;

  return (
    <div className="flex flex-col">
      
      {/* =========================================================================
          HERO SECTION (Matching Image #1: Silk Wave glow, Stars, Centered Typography)
          ========================================================================= */}
      <section className="relative w-full h-[calc(100vh-4rem)] min-h-[580px] flex items-center justify-center overflow-hidden bg-[#030510] border-b border-white/[0.06]">
        
        {/* Full-bleed Silk Wave Shader Canvas */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <GradientCanvas
            params={HERO_SHADER_PARAMS}
            interactive={true}
            className="w-full h-full scale-[1.02]"
          />
        </div>

        {/* Top-to-bottom dark gradient scrim: keeps text area dark & crisp like Image #1 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030510] via-[#030510]/50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06080d] to-transparent pointer-events-none" />

        {/* Subtle background optical stars: no glow, soft blur, low opacity */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[62%] left-[20%] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[1px]">
            <svg viewBox="0 0 32 32" className="w-7 h-7 text-white">
              <path d="M16 0 L18 13 L32 16 L18 19 L16 32 L14 19 L0 16 L14 13 Z" fill="currentColor" />
            </svg>
          </div>

          <div className="absolute top-[75%] left-[56%] -translate-x-1/2 -translate-y-1/2 opacity-25 blur-[1.2px]">
            <svg viewBox="0 0 32 32" className="w-4 h-4 text-white">
              <path d="M16 0 L18 13 L32 16 L18 19 L16 32 L14 19 L0 16 L14 13 Z" fill="currentColor" />
            </svg>
          </div>

          <div className="absolute top-[70%] left-[68%] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[1px]">
            <svg viewBox="0 0 32 32" className="w-6 h-6 text-white">
              <path d="M16 0 L18 13 L32 16 L18 19 L16 32 L14 19 L0 16 L14 13 Z" fill="currentColor" />
            </svg>
          </div>

          <div className="absolute top-[52%] left-[18%] -translate-x-1/2 -translate-y-1/2 opacity-25 blur-[1.5px]">
            <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 text-white">
              <path d="M16 0 L18 13 L32 16 L18 19 L16 32 L14 19 L0 16 L14 13 Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Hero Centered Content (Smooth entrance animation when loading finishes) */}
        <div 
          className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center text-center gap-4 sm:gap-5 transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 text-xs text-zinc-300 shadow-lg">
            <span>shadcn registry · WebGPU · WebGL fallback · 207 presets</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] leading-[1.05] drop-shadow-2xl bg-gradient-to-r from-[#ffe57f] via-[#fff5cc] to-white bg-clip-text text-transparent">
            Moving gradients, <br />
            shipped as code.
          </h1>

          <p className="text-sm sm:text-base md:text-[17px] text-zinc-300/90 leading-relaxed max-w-2xl font-normal drop-shadow">
            Gradientfy draws backgrounds live on the GPU and ships them as React components you install with the shadcn CLI. Tune any preset, then copy the code or export a still or a loop.
          </p>

          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={() => onOpenStudio(presets[0])}
              className="btn-gradient-yellow px-7 py-2.5 rounded-full text-sm font-bold"
            >
              Open the editor
            </button>

            <button
              onClick={() => {
                catalogGridRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse gradients
            </button>
          </div>

        </div>

      </section>

      {/* =========================================================================
          CATALOG SECTION: Generous Wide Cards Grid (No "popular collections" clutter)
          ========================================================================= */}
      <section 
        ref={catalogGridRef}
        className="max-w-[1536px] mx-auto px-4 sm:px-8 py-10 flex flex-col gap-6 w-full"
      >
        
        {/* Sticky Filter Toolbar */}
        <div className="flex flex-col gap-3.5 sticky top-16 z-30 bg-[#06080d]/95 backdrop-blur-xl pt-2 pb-3 border-b border-white/[0.08]">
          
          {/* Search Bar + Selectors */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 207 gradients by name, kind, collection, or #hex..."
                className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all font-sans"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded font-mono text-[10px] bg-white/10 text-zinc-400 border border-white/10 pointer-events-none">
                  /
                </kbd>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as 'all' | 'free' | 'pro')}
                className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
              >
                <option value="all" className="bg-zinc-900">All Tiers (207)</option>
                <option value="free" className="bg-zinc-900">Free Tier (39)</option>
                <option value="pro" className="bg-zinc-900">Pro Tier (168)</option>
              </select>

              <select
                value={toneFilter}
                onChange={(e) => setToneFilter(e.target.value as 'all' | 'dark' | 'light')}
                className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
              >
                <option value="all" className="bg-zinc-900">All Tones</option>
                <option value="dark" className="bg-zinc-900">Dark Ground</option>
                <option value="light" className="bg-zinc-900">Light Ground</option>
              </select>

              <div className="relative flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white/[0.04] border border-white/[0.1] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="name-asc" className="bg-zinc-900">Name (A-Z)</option>
                  <option value="name-desc" className="bg-zinc-900">Name (Z-A)</option>
                  <option value="colors-desc" className="bg-zinc-900">Most Colors</option>
                  <option value="speed-desc" className="bg-zinc-900">Speed</option>
                </select>
                <ArrowUpDown className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              </div>

              {/* View Switcher: Wide (2 cols) vs Grid (3 cols) */}
              <div className="hidden sm:flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setColumnsMode('wide')}
                  title="Expansive Wide Cards (2 columns)"
                  className={`p-1.5 rounded-lg transition-colors ${
                    columnsMode === 'wide' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setColumnsMode('grid')}
                  title="Standard Grid (3 columns)"
                  className={`p-1.5 rounded-lg transition-colors ${
                    columnsMode === 'grid' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all shrink-0 ${
                  favoritesOnly
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border-white/[0.1]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'text-rose-500 fill-rose-500' : ''}`} />
                <span className="font-sans">Saved</span>
              </button>
            </div>
          </div>

          {/* Collection Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
            <span className="text-zinc-500 font-mono uppercase text-[10px] tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              COLLECTIONS:
            </span>

            <button
              onClick={() => setSelectedCollection(null)}
              className={`px-3 py-1 rounded-full shrink-0 transition-all font-medium ${
                selectedCollection === null
                  ? 'btn-gradient-yellow !text-black'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              All (207)
            </button>

            {collections.map((col) => (
              <button
                key={col.slug}
                onClick={() => setSelectedCollection(selectedCollection === col.slug ? null : col.slug)}
                className={`px-3 py-1 rounded-full shrink-0 transition-all font-medium capitalize ${
                  selectedCollection === col.slug
                    ? 'btn-gradient-yellow !text-black'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>

          {/* Shader Kind Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px] tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              SHADERS:
            </span>

            <button
              onClick={() => setSelectedKind(null)}
              className={`px-2.5 py-0.5 rounded-md shrink-0 text-[11px] font-semibold transition-all ${
                selectedKind === null
                  ? 'bg-zinc-200 text-zinc-950 font-bold'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white'
              }`}
            >
              ALL
            </button>

            {uniqueKinds.map((kind) => (
              <button
                key={kind}
                onClick={() => setSelectedKind(selectedKind === kind ? null : kind)}
                className={`px-2.5 py-0.5 rounded-md shrink-0 text-[11px] font-semibold transition-all uppercase ${
                  selectedKind === kind
                    ? 'bg-zinc-200 text-zinc-950 font-bold'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white'
                }`}
              >
                {kind}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="ml-auto flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-sans text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

        </div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
          <span>
            CATALOG: <strong className="text-white font-bold">{filteredPresets.length}</strong> EXPANSIVE GRADIENTS
            {selectedCollection && (
              <span> IN <span className="text-blue-400 uppercase">{selectedCollection}</span></span>
            )}
            {selectedKind && (
              <span> WITH <span className="text-cyan-400 uppercase">{selectedKind}</span></span>
            )}
          </span>
          <span className="hidden sm:inline">
            OKLAB PERCEPTUAL GPU RASTER
          </span>
        </div>

        {/* 207 Specimen Cards Grid (Expansive Wide Cards) */}
        {filteredPresets.length > 0 ? (
          <div className={`grid gap-7 sm:gap-8 ${
            columnsMode === 'wide' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filteredPresets.slice(0, visibleCount).map((preset, idx) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                index={idx}
                isFavorite={favorites.has(preset.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenStudio={onOpenStudio}
                onOpenExport={onOpenExport}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No gradients matched the filter criteria</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Adjust your search keywords or clear filters.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="mt-2 btn-gradient-yellow px-5 py-2.5 rounded-xl text-xs font-bold"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredPresets.length && (
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={() => setVisibleCount((prev) => prev + 24)}
              className="px-6 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-amber-400/40 hover:text-amber-300 text-white text-xs font-mono font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              LOAD NEXT 24 PRESETS ({filteredPresets.length - visibleCount} REMAINING)
            </button>
          </div>
        )}

      </section>

    </div>
  );
};
