import React, { useState, useEffect, useRef } from 'react';
import { PresetItem, GRADIENT_KINDS } from '../types/gradient';
import { GradientParams } from '../engine';
import { GradientCanvas } from './GradientCanvas';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  Shuffle, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus,
  ChevronDown, 
  Undo2, 
  Redo2, 
  Ratio,
  MousePointer,
  Layers,
  Palette,
  Sliders
} from 'lucide-react';

interface StudioViewProps {
  initialPreset: PresetItem;
  allPresets: PresetItem[];
  onSelectPreset: (preset: PresetItem) => void;
  onOpenExport: (params: GradientParams, name: string) => void;
  onSaveCustomPreset: (preset: PresetItem) => void;
  onUpdateParams?: (params: GradientParams, name: string) => void;
}

const ASPECT_RATIOS = [
  { id: 'full', label: 'Full', class: 'w-full h-full' },
  { id: '16-9', label: '16:9', class: 'w-full max-w-5xl aspect-[16/9]' },
  { id: '9-16', label: '9:16', class: 'h-full max-h-[680px] aspect-[9/16]' },
  { id: '1-1', label: '1:1', class: 'h-full max-h-[580px] aspect-square' },
  { id: '3-1', label: '3:1', class: 'w-full max-w-5xl aspect-[3/1]' },
];
function hslToHex(h: number, s: number, l: number): string {
  const light = l / 100;
  const a = (s * Math.min(light, 1 - light)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}


export const StudioView: React.FC<StudioViewProps> = ({
  initialPreset,
  allPresets,
  onSelectPreset,
  onOpenExport,
  onSaveCustomPreset,
  onUpdateParams,
}) => {
  const [params, setParams] = useState<GradientParams>(initialPreset.params);
  const [presetName, setPresetName] = useState(initialPreset.name);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('full');
  const [interactiveCursor, setInteractiveCursor] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Collapsible sections in right inspector (Image #3 style)
  const [openSections, setOpenSections] = useState({
    kind: true,
    colours: true,
    look: true,
    more: true,
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<GradientParams[]>([initialPreset.params]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut: Space toggles shuffle or play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        handleShuffle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [params]);

  // Sync when initialPreset changes
  useEffect(() => {
    setParams(initialPreset.params);
    setPresetName(initialPreset.name);
    setHistory([initialPreset.params]);
    setHistoryIndex(0);
    setIsSaved(false);
  }, [initialPreset]);

  // Animation timeline loop timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => (prev + 0.05) % (params.loopSeconds || 14));
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, params.loopSeconds]);

  const updateParams = (newParams: GradientParams) => {
    setParams(newParams);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newParams);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onUpdateParams?.(newParams, presetName);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const nextParams = history[historyIndex - 1];
      setParams(nextParams);
      onUpdateParams?.(nextParams, presetName);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextParams = history[historyIndex + 1];
      setParams(nextParams);
      onUpdateParams?.(nextParams, presetName);
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    const nextColors = [...params.colors];
    nextColors[index] = newColor;
    updateParams({ ...params, colors: nextColors });
  };

  const handleAddColorStop = () => {
    if (params.colors.length >= 6) return;
    const lastColor = params.colors[params.colors.length - 1] || '#ffffff';
    updateParams({ ...params, colors: [...params.colors, lastColor] });
  };

  const handleRemoveColorStop = () => {
    if (params.colors.length <= 2) return;
    const nextColors = params.colors.slice(0, -1);
    updateParams({ ...params, colors: nextColors });
  };

  // Shuffle button (Image #3 bottom blue button)
  const handleShuffle = () => {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    const newColors = params.colors.map(() => randomHex());
    updateParams({
      ...params,
      colors: newColors,
      background: '#' + Math.floor(Math.random() * 800000).toString(16).padStart(6, '0').toUpperCase(),
      seed: Math.floor(Math.random() * 9999) + 1,
    });
  };

  // Colours button: generate fresh harmonic color palette
  const handleRandomizeColors = () => {
    const count = params.colors.length;
    const baseHue = Math.floor(Math.random() * 360);
    const harmonyModes = ['analogous', 'triadic', 'complementary', 'split', 'monochrome'] as const;
    const mode = harmonyModes[Math.floor(Math.random() * harmonyModes.length)];

    const newColors: string[] = [];
    for (let i = 0; i < count; i++) {
      let hue = baseHue;
      const sat = 65 + Math.floor(Math.random() * 30);
      let light = 40 + Math.floor(Math.random() * 35);

      if (mode === 'analogous') {
        hue = (baseHue + (i - Math.floor(count / 2)) * 30 + 360) % 360;
      } else if (mode === 'triadic') {
        hue = (baseHue + i * 120) % 360;
      } else if (mode === 'complementary') {
        hue = i % 2 === 0 ? baseHue : (baseHue + 180) % 360;
      } else if (mode === 'split') {
        const offsets = [0, 150, 210, 30, 180, 240];
        hue = (baseHue + offsets[i % offsets.length]) % 360;
      } else {
        hue = baseHue;
        light = 25 + Math.floor((i / Math.max(count - 1, 1)) * 60);
      }

      newColors.push(hslToHex(hue, sat, light));
    }

    const bgHue = (baseHue + 180) % 360;
    const bgHex = hslToHex(bgHue, 25, 5);

    updateParams({
      ...params,
      colors: newColors,
      background: bgHex,
      seed: Math.floor(Math.random() * 9999) + 1,
    });
  };

  const handleSavePreset = () => {
    const customItem: PresetItem = {
      id: `custom-${Date.now()}`,
      name: presetName || 'Custom Gradient',
      collections: ['custom'],
      looks: ['custom'],
      tone: 'dark',
      tier: 'free',
      params,
    };
    onSaveCustomPreset(customItem);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!viewportRef.current) return;
    if (!document.fullscreenElement) {
      viewportRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const cycleAspect = () => {
    const ids = ASPECT_RATIOS.map((a) => a.id);
    const nextIdx = (ids.indexOf(aspectRatio) + 1) % ids.length;
    setAspectRatio(ids[nextIdx]);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 py-5 flex flex-col gap-4 font-sans">
      
      {/* Expansive Studio Grid Layout (Matching Image #3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[780px]">
        
        {/* =========================================================================
            LEFT / MAIN: Expansive Wide Canvas Viewport (Takes 8 to 9 cols)
            ========================================================================= */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-3">
          
          {/* Main Visual Viewport Container */}
          <div 
            ref={viewportRef}
            className="relative w-full h-[620px] sm:h-[720px] lg:h-[780px] rounded-3xl bg-[#04060c] border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center p-4 sm:p-6"
          >
            {/* The Live Shader Canvas (Wide and Expansive) */}
            <div className={`${ASPECT_RATIOS.find((a) => a.id === aspectRatio)?.class || 'w-full h-full'} rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 relative`}>
              <GradientCanvas
                params={params}
                interactive={interactiveCursor}
                paused={!isPlaying}
                timeSeconds={currentTime}
                className="w-full h-full"
              />
            </div>

            {/* TOP FLOATING CONTROLS BAR OVER CANVAS (Matching Image #3 Top Bar) */}
            <div className="absolute top-5 inset-x-6 flex items-center justify-between pointer-events-none z-20">
              
              {/* Top Left: Aspect Ratio / Fullscreen controls */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 backdrop-blur-xl border border-white/15 pointer-events-auto shadow-xl">
                <button
                  onClick={cycleAspect}
                  title="Cycle aspect ratio framing"
                  className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Ratio className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause animation' : 'Play animation'}
                  className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen"
                  className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Top Center/Right: Undo/Redo + Save + Solid White Export Button (Image #3) */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-black/60 backdrop-blur-xl border border-white/15 pointer-events-auto shadow-xl">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo"
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo"
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <span className="w-px h-4 bg-white/20" />


                {/* White Export Pill Button (Matching Image #3 Export button) */}
                <button
                  onClick={() => onOpenExport(params, presetName)}
                  className="btn-gradient-yellow px-4 py-1.5 rounded-xl text-xs font-bold gap-1.5 shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Export</span>
                  <ChevronDown className="w-3 h-3 text-black" />
                </button>
              </div>

            </div>

            {/* BOTTOM FLOATING PILL TOOLBAR (Matching Image #3 Bottom Bar) */}
            <div className="absolute bottom-6 inset-x-0 flex items-center justify-center pointer-events-none z-20">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0a0f1d]/90 backdrop-blur-2xl border border-white/15 shadow-2xl pointer-events-auto overflow-x-auto no-scrollbar max-w-[95%]">
                
                {/* Shape Switcher Button */}
                <button
                  onClick={() => {
                    const ids = GRADIENT_KINDS.map((k) => k.id);
                    const nextIdx = (ids.indexOf(params.kind) + 1) % ids.length;
                    updateParams({ ...params, kind: ids[nextIdx] });
                  }}
                  title="Click to cycle shape / shader"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-zinc-200 hover:text-white transition-colors shrink-0"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Shape:</span>
                  <span className="capitalize font-semibold text-white">{params.kind}</span>
                </button>

                {/* Colours: Instant Harmonic Randomizer */}
                <button
                  onClick={handleRandomizeColors}
                  title="Generate fresh harmonic color palette"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-zinc-200 hover:text-white transition-colors shrink-0 active:scale-95"
                >
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span>Colours</span>
                </button>

                {/* Motion: Toggle Play / Pause Animation */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? "Pause motion" : "Play motion"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-zinc-200 hover:text-white transition-colors shrink-0 active:scale-95"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isPlaying ? 'Motion' : 'Paused'}</span>
                </button>

                {/* Interactive Color Swatches (Click to change color) */}
                <div className="flex items-center gap-1.5 px-1 shrink-0">
                  {params.colors.map((c, i) => (
                    <label
                      key={i}
                      title={`Change stop ${i + 1}: ${c}`}
                      className="w-7 h-7 rounded-lg border border-white/30 shadow-md relative cursor-pointer hover:scale-115 transition-transform overflow-hidden block"
                      style={{ backgroundColor: c }}
                    >
                      <input
                        type="color"
                        value={c}
                        onChange={(e) => handleColorChange(i, e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
                {/* Shuffle Blue Button (Matching Image #3 Shuffle Space button) */}
                <button
                  onClick={handleShuffle}
                  className="btn-gradient-yellow px-5 py-2 rounded-xl text-xs font-bold gap-2 active:scale-95 shrink-0"
                >
                  <Shuffle className="w-3.5 h-3.5 text-black" />
                  <span>Shuffle</span>
                  <kbd className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-black/15 text-black border border-black/20 font-bold">
                    Space
                  </kbd>
                </button>

              </div>
            </div>

          </div>

          {/* Time Scrubber and Mouse Warp bar */}
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-2xl bg-[#0c101b] border border-white/[0.08] text-xs">
            <div className="flex items-center gap-3 flex-1">
              <span className="font-mono text-zinc-400 w-16">
                {currentTime.toFixed(1)}s / {params.loopSeconds}s
              </span>
              <input
                type="range"
                min="0"
                max={params.loopSeconds || 14}
                step="0.05"
                value={currentTime}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentTime(parseFloat(e.target.value));
                }}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
              />
            </div>

            <button
              onClick={() => setInteractiveCursor(!interactiveCursor)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs border transition-all ${
                interactiveCursor
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
              }`}
            >
              <MousePointer className="w-3 h-3" />
              <span>Cursor Warp</span>
            </button>
          </div>

        </div>

        {/* =========================================================================
            RIGHT SIDEBAR: Precision Inspector (Matching Image #3 Right Panel)
            ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3">
          
          <div className="flex-1 p-5 rounded-3xl bg-[#0c101b] border border-white/[0.08] flex flex-col gap-5 overflow-y-auto max-h-[840px]">
            
            {/* Inspector Header (Image #3 style: Preset Name + Reset Icon) */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => {
                    setPresetName(e.target.value);
                    onUpdateParams?.(params, e.target.value);
                  }}
                  className="font-bold text-white text-base bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none w-48"
                />
                <span className="text-[11px] font-mono text-zinc-400 block mt-0.5 uppercase">
                  {params.kind} · WebGL2
                </span>
              </div>

              <button
                onClick={() => updateParams(initialPreset.params)}
                title="Reset to original preset"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* 1. SECTION: KIND (Image #3 Style) */}
            <div className="flex flex-col gap-2.5">
              <div 
                onClick={() => setOpenSections({ ...openSections, kind: !openSections.kind })}
                className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-white"
              >
                <span>Kind</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.kind ? 'rotate-180' : ''}`} />
              </div>

              {openSections.kind && (
                <div className="flex flex-col gap-2 pt-1">
                  <select
                    value={params.kind}
                    onChange={(e) => updateParams({ ...params, kind: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white capitalize focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                  >
                    {GRADIENT_KINDS.map((k) => (
                      <option key={k.id} value={k.id} className="bg-zinc-900 text-white">
                        {k.label} ({k.id})
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        const randomIdx = Math.floor(Math.random() * allPresets.length);
                        onSelectPreset(allPresets[randomIdx]);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                    >
                      Presets ({allPresets.length})
                    </button>
                    <button
                      onClick={handleShuffle}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                    >
                      Compare
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. SECTION: COLOURS (Image #3 Style) */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.08]">
              <div 
                onClick={() => setOpenSections({ ...openSections, colours: !openSections.colours })}
                className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-white"
              >
                <span>Colours</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveColorStop();
                    }}
                    disabled={params.colors.length <= 2}
                    className="p-1 rounded hover:bg-white/10 text-zinc-400 disabled:opacity-30"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddColorStop();
                    }}
                    disabled={params.colors.length >= 6}
                    className="p-1 rounded hover:bg-white/10 text-zinc-400 disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.colours ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {openSections.colours && (
                <div className="flex flex-col gap-2 pt-1">
                  
                  {/* Color Staged Swatch Buttons (Image #3 style: swatch box + hex string) */}
                  <div className="grid grid-cols-2 gap-2">
                    {params.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all"
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => handleColorChange(i, e.target.value)}
                          className="w-5 h-5 rounded-md cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="font-mono text-xs text-zinc-200 uppercase font-semibold">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Background Base */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] mt-1">
                    <span className="text-xs text-zinc-400">Background</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={params.background}
                        onChange={(e) => updateParams({ ...params, background: e.target.value })}
                        className="w-5 h-5 rounded-md cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="font-mono text-xs text-zinc-200 uppercase font-semibold">
                        {params.background}
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* 3. SECTION: LOOK (Image #3 Style: Speed, Scale, Warp, Grain) */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.08]">
              <div 
                onClick={() => setOpenSections({ ...openSections, look: !openSections.look })}
                className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-white"
              >
                <span>Look</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.look ? 'rotate-180' : ''}`} />
              </div>

              {openSections.look && (
                <div className="flex flex-col gap-4 pt-1 text-xs">
                  
                  {/* Speed */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Speed</span>
                      <span className="font-mono text-zinc-200 font-bold">{params.speed.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.05"
                      value={params.speed}
                      onChange={(e) => updateParams({ ...params, speed: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer h-1 bg-white/15 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Scale */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Scale</span>
                      <span className="font-mono text-zinc-200 font-bold">{params.scale.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.05"
                      value={params.scale}
                      onChange={(e) => updateParams({ ...params, scale: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer h-1 bg-white/15 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Warp */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Warp</span>
                      <span className="font-mono text-zinc-200 font-bold">{params.warp.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={params.warp}
                      onChange={(e) => updateParams({ ...params, warp: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer h-1 bg-white/15 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Grain */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Grain</span>
                      <span className="font-mono text-zinc-200 font-bold">{params.grain.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.01"
                      value={params.grain}
                      onChange={(e) => updateParams({ ...params, grain: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer h-1 bg-white/15 rounded-lg appearance-none"
                    />
                  </div>

                </div>
              )}
            </div>

            {/* 4. SECTION: MORE (Blur, Loop Seconds, Seed, Dither) */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.08]">
              <div 
                onClick={() => setOpenSections({ ...openSections, more: !openSections.more })}
                className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-white"
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.more ? 'rotate-180' : ''}`} />
              </div>

              {openSections.more && (
                <div className="flex flex-col gap-4 pt-1 text-xs">
                  
                  {/* Blur */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Blur</span>
                      <span className="font-mono text-zinc-200 font-bold">{params.blur.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.02"
                      value={params.blur}
                      onChange={(e) => updateParams({ ...params, blur: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer h-1 bg-white/15 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Loop Duration */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Loop Cycle</span>
                      <span className="font-mono text-zinc-200 font-bold">{params.loopSeconds}s</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="40"
                      step="1"
                      value={params.loopSeconds}
                      onChange={(e) => updateParams({ ...params, loopSeconds: parseInt(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer h-1 bg-white/15 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Halftone Dither Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-zinc-300 font-medium">Bayer Halftone Dither</span>
                    <button
                      onClick={() => updateParams({
                        ...params,
                        dither: { ...params.dither, enabled: !params.dither.enabled }
                      })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        params.dither.enabled ? 'bg-amber-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          params.dither.enabled ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
