import React, { useState, useEffect } from 'react';
import { PresetItem, PresetCollection, ViewMode } from './types/gradient';
import { GradientParams } from './engine';
import { Header } from './components/Header';
import { CatalogView } from './components/CatalogView';
import { StudioView } from './components/StudioView';
import { CollectionsView } from './components/CollectionsView';
import { FavoritesView } from './components/FavoritesView';
import { ExportModal } from './components/ExportModal';
import { GradientCanvas } from './components/GradientCanvas';
import { renderToCanvas } from './utils/exporter';
import { LoaderScreen } from './components/LoaderScreen';
import { 
  ArrowUp, 
  Sparkles, 
  Shuffle 
} from 'lucide-react';

// Aurora vertical curtains shader for the bottom section (Matching Image #2 style)
const BOTTOM_AURORA_PARAMS: GradientParams = {
  kind: 'aurora',
  colors: ['#ffffff', '#7aa2f7', '#254394', '#070f2a'],
  background: '#020308',
  speed: 0.4,
  loopSeconds: 18,
  scale: 1.0,
  warp: 0.35,
  blur: 0.38,
  grain: 0.12,
  dither: { enabled: false, cell: 3, levels: 8 },
  seed: 19,
  interaction: { pointer: 0.1, scroll: 0.05 }
};

export const App: React.FC = () => {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [collections, setCollections] = useState<PresetCollection[]>([]);
  // Persisted view from sessionStorage: allows skipping loader on F5 when in editor/collections
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      const saved = sessionStorage.getItem('gradientfy_current_view');
      if (saved === 'studio' || saved === 'collections' || saved === 'favorites') {
        return saved as ViewMode;
      }
    } catch {}
    return 'catalog';
  });

  // Only run loader on homepage (catalog). On F5 in studio/collections/favorites: NO LOADER!
  const [showLoader, setShowLoader] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('gradientfy_current_view');
      if (saved === 'studio' || saved === 'collections' || saved === 'favorites') {
        return false;
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    return true;
  });
  const [activePreset, setActivePreset] = useState<PresetItem | null>(() => {
    try {
      const saved = sessionStorage.getItem('gradientfy_active_preset');
      if (saved) {
        return JSON.parse(saved) as PresetItem;
      }
    } catch {}
    return null;
  });
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string | null>(null);

  // Favorites in localStorage
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('gradientfy_favorites');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportParams, setExportParams] = useState<GradientParams | null>(null);
  const [exportPresetName, setExportPresetName] = useState<string>('Gradient');

  // Load Presets Database
  useEffect(() => {
    async function loadDatabase() {
      try {
        const resp = await fetch('/presets.json');
        if (!resp.ok) throw new Error('Failed to fetch presets.json');
        const data = await resp.json();
        
        const loadedPresets: PresetItem[] = [];
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();

        // 1. First add all official presets from presets.json
        for (const p of (data.presets || [])) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            seenNames.add(p.name.toLowerCase().trim());
            loadedPresets.push(p);
          }
        }

        // 2. Only add custom presets if they have a truly unique id and unique name!
        try {
          const userSaved = localStorage.getItem('gradientfy_custom_presets');
          if (userSaved) {
            const customItems = JSON.parse(userSaved);
            if (Array.isArray(customItems)) {
              const validCustomItems: PresetItem[] = [];
              for (const cp of customItems) {
                if (cp && cp.id && cp.name) {
                  const normName = cp.name.toLowerCase().trim();
                  // Discard any preset that duplicates an existing name or ID (such as duplicate Afterhours)
                  if (!seenIds.has(cp.id) && !seenNames.has(normName)) {
                    seenIds.add(cp.id);
                    seenNames.add(normName);
                    validCustomItems.push(cp);
                    loadedPresets.unshift(cp);
                  }
                }
              }
              // Clean up the browser localStorage to permanently delete existing duplicates!
              localStorage.setItem('gradientfy_custom_presets', JSON.stringify(validCustomItems));
            }
          }
        } catch (e) {
          console.warn('Failed to parse custom presets', e);
        }

        setPresets(loadedPresets);
        setCollections(data.collections || []);

        // URL share parameter ?c=
        const urlParams = new URLSearchParams(window.location.search);
        const sharedCode = urlParams.get('c');
        if (sharedCode) {
          try {
            const parsed = JSON.parse(decodeURIComponent(sharedCode));
            const sharedPreset: PresetItem = {
              id: 'shared-url',
              name: parsed.name || 'Shared Gradient',
              collections: ['shared'],
              looks: [],
              tone: 'dark',
              tier: 'free',
              params: parsed.p || parsed,
            };
            setActivePreset(sharedPreset);
            setCurrentView('studio');
            try {
              sessionStorage.setItem('gradientfy_current_view', 'studio');
              sessionStorage.setItem('gradientfy_active_preset', JSON.stringify(sharedPreset));
            } catch {}
          } catch {
            setActivePreset(loadedPresets[0] || null);
          }
        } else {
          setActivePreset((prev) => {
            if (prev) return prev;
            try {
              const saved = sessionStorage.getItem('gradientfy_active_preset');
              if (saved) {
                const parsed = JSON.parse(saved) as PresetItem;
                const matched = loadedPresets.find((p) => p.id === parsed.id);
                return matched
                  ? { ...matched, params: parsed.params || matched.params, name: parsed.name || matched.name }
                  : parsed;
              }
            } catch {}
            return loadedPresets[0] || null;
          });
        }
        // Auto-generation mode for all 207 presets clean thumbnails
        if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('generate_thumbnails')) {
          const win = window as unknown as Window & {
            __thumbProgress?: { total: number; current: number; status: 'running' | 'done' };
          };
          (async () => {
            console.log(`[Thumbnail Generator] Generating clean snapshots for ${loadedPresets.length} presets...`);
            win.__thumbProgress = { total: loadedPresets.length, current: 0, status: 'running' };
            for (let i = 0; i < loadedPresets.length; i++) {
              const p = loadedPresets[i];
              try {
                const canvas = await renderToCanvas(p.params, 640, 400, 0.0);
                const dataUrl = canvas.toDataURL('image/webp', 0.92);
                await fetch('/api/save-thumbnail', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: p.id, dataUrl }),
                });
                win.__thumbProgress.current = i + 1;
                console.log(`[Thumbnail Generator] (${i + 1}/${loadedPresets.length}) ${p.id} saved`);
              } catch (err) {
                console.error(`[Thumbnail Generator] Failed for ${p.id}:`, err);
              }
            }
            win.__thumbProgress.status = 'done';
            console.log('[Thumbnail Generator] All 207 clean thumbnails successfully generated!');
          })();
        }
      } catch (err) {
        console.error('Failed to load presets database:', err);
      }
    }
    loadDatabase();

  }, []);

  // Guarantee page always opens at the very top on homepage
  useEffect(() => {
    if (currentView === 'catalog' && typeof window !== 'undefined') {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    }
  }, [currentView]);

  // Save favorites to localStorage
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('gradientfy_favorites', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn('Could not save favorites', e);
      }
      return next;
    });
  };

  // Custom preset created in Studio
  const handleSaveCustomPreset = (newPreset: PresetItem) => {
    setPresets((prev) => {
      const normNew = newPreset.name.toLowerCase().trim();
      // Prevent saving duplicates
      if (prev.some((p) => p.name.toLowerCase().trim() === normNew)) {
        return prev;
      }
      const updated = [newPreset, ...prev];
      try {
        const userSaved = localStorage.getItem('gradientfy_custom_presets');
        const customList = userSaved ? JSON.parse(userSaved) : [];
        if (!customList.some((p: PresetItem) => p.name?.toLowerCase().trim() === normNew)) {
          customList.unshift(newPreset);
          localStorage.setItem('gradientfy_custom_presets', JSON.stringify(customList));
        }
      } catch (e) {
        console.warn('Could not persist custom preset', e);
      }
      return updated;
    });
  };

  // Surprise random preset
  const handleRandomPreset = () => {
    if (presets.length === 0) return;
    const randomIdx = Math.floor(Math.random() * presets.length);
    const chosen = presets[randomIdx];
    setActivePreset(chosen);
    setCurrentView('studio');
    try {
      sessionStorage.setItem('gradientfy_current_view', 'studio');
      sessionStorage.setItem('gradientfy_active_preset', JSON.stringify(chosen));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Studio with a specific preset
  const handleOpenStudio = (preset: PresetItem) => {
    setActivePreset(preset);
    setCurrentView('studio');
    try {
      sessionStorage.setItem('gradientfy_current_view', 'studio');
      sessionStorage.setItem('gradientfy_active_preset', JSON.stringify(preset));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle parameter or name change from inside Studio
  const handleUpdateStudioPreset = (newParams: GradientParams, name: string) => {
    setActivePreset((prev) => {
      if (!prev) return null;
      const updated: PresetItem = { ...prev, params: newParams, name };
      try {
        sessionStorage.setItem('gradientfy_active_preset', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Open Export Modal
  const handleOpenExport = (paramsOrPreset: GradientParams | PresetItem, name?: string) => {
    if ('params' in paramsOrPreset) {
      setExportParams(paramsOrPreset.params);
      setExportPresetName(paramsOrPreset.name);
    } else {
      setExportParams(paramsOrPreset);
      setExportPresetName(name || 'Gradient');
    }
    setIsExportOpen(true);
  };

  // Collections selection
  const handleSelectCollection = (slug: string) => {
    setSelectedCollectionFilter(slug);
    setCurrentView('catalog');
    try { sessionStorage.setItem('gradientfy_current_view', 'catalog'); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black relative">
      
      {/* 360° V-Beam Loading Screen (Fixed Top-Level Overlay: Site stays hidden until 100% finished!) */}
      {showLoader && (
        <LoaderScreen onLoaded={() => {
          setShowLoader(false);
          if (currentView === 'catalog' && typeof window !== 'undefined') {
            window.scrollTo(0, 0);
          }
        }} />
      )}
      {/* App Header (Image #1 Style) */}
      <Header
        currentView={currentView}
        isReady={!showLoader}
        onSelectView={(v) => {
          if (v === 'catalog') setSelectedCollectionFilter(null);
          setCurrentView(v);
          try { sessionStorage.setItem('gradientfy_current_view', v); } catch {}
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favorites.size}
        totalPresets={presets.length}
        onRandomPreset={handleRandomPreset}
        onReplayIntro={() => {
          try { sessionStorage.setItem('gradientfy_current_view', 'catalog'); } catch {}
          setCurrentView('catalog');
          window.scrollTo(0, 0);
          setShowLoader(true);
        }}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {currentView === 'catalog' && (
          <CatalogView
            presets={presets}
            collections={collections}
            favorites={favorites}
            isReady={!showLoader}
            onToggleFavorite={toggleFavorite}
            onOpenStudio={handleOpenStudio}
            onOpenExport={(p) => handleOpenExport(p)}
            initialCollection={selectedCollectionFilter}
          />
        )}

        {currentView === 'studio' && activePreset && (
          <StudioView
            key={activePreset.id}
            initialPreset={activePreset}
            allPresets={presets}
            onSelectPreset={(p) => {
              setActivePreset(p);
              try {
                sessionStorage.setItem('gradientfy_active_preset', JSON.stringify(p));
              } catch {}
            }}
            onUpdateParams={handleUpdateStudioPreset}
            onOpenExport={(params, name) => handleOpenExport(params, name)}
            onSaveCustomPreset={handleSaveCustomPreset}
          />
        )}
        {currentView === 'collections' && (
          <CollectionsView
            collections={collections}
            presets={presets}
            onSelectCollection={handleSelectCollection}
          />
        )}

        {currentView === 'favorites' && (
          <FavoritesView
            presets={presets}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenStudio={handleOpenStudio}
            onOpenExport={(p) => handleOpenExport(p)}
            onGoToCatalog={() => setCurrentView('catalog')}
          />
        )}
      </main>

      {/* Global Export Modal */}
      {isExportOpen && exportParams && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          params={exportParams}
          presetName={exportPresetName}
        />
      )}

      {/* =========================================================================
          BOTTOM SECTION (Aurora Curtains + Interactive Actions Station)
          ========================================================================= */}
      <section className="relative w-full min-h-[500px] sm:min-h-[560px] flex items-center justify-center overflow-hidden bg-[#020308] border-t border-white/[0.06] mt-12">
        
        {/* Full-Bleed Live Aurora Shader Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-85">
          <GradientCanvas
            params={BOTTOM_AURORA_PARAMS}
            interactive={false}
            className="w-full h-full scale-[1.02]"
          />
        </div>

        {/* Top and Bottom soft scrim overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06080d] via-transparent to-[#020308] pointer-events-none" />

        {/* Centered Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center gap-6">
          
          {/* Section Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs font-mono text-zinc-300 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>EXPORT WORKBENCH & CODE LAB</span>
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] text-white drop-shadow-2xl max-w-3xl leading-[1.05]">
            Put a live gradient in your app
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-300/90 max-w-2xl font-normal drop-shadow">
            Tune speeds, color stops, and fluid turbulence, then download in any resolution or copy ready-to-run React and CSS code.
          </p>

          {/* High-Impact Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => {
                if (activePreset) {
                  setCurrentView('studio');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="btn-gradient-yellow px-7 py-3 rounded-full text-sm font-bold gap-2"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Open Studio Editor</span>
            </button>
          </div>

          {/* Supported Format Pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center pt-2 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-500 uppercase">Formats:</span>
            {['PNG', 'JPG', 'WebP', 'SVG', 'MP4 Loop', 'Animated GIF', 'CSS', 'Tailwind', 'React JSX'].map((fmt) => (
              <span key={fmt} className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-zinc-300">
                {fmt}
              </span>
            ))}
          </div>

        </div>

      </section>

      {/* =========================================================================
          CLEAN MINIMAL FOOTER
          ========================================================================= */}
      <footer className="w-full bg-[#020308] border-t border-white/[0.06] py-8 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-sans text-sm">Gradientfy</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span>22 Shaders</span>
            <span>•</span>
            <span>8K Quad-Tiled</span>
            <span>•</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
