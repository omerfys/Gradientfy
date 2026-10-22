import React from 'react';
import { PresetCollection, PresetItem } from '../types/gradient';
import { Layers, ArrowRight } from 'lucide-react';

interface CollectionsViewProps {
  collections: PresetCollection[];
  presets: PresetItem[];
  onSelectCollection: (slug: string) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  presets,
  onSelectCollection,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      
      {/* Exhibition Section Header */}
      <div className="flex flex-col gap-3 max-w-2xl crosshair-corner">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 w-fit font-mono">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300">
            15 CALIBRATED OPTICAL ARCHIVES
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.035em] text-white leading-tight">
          Curated Specimen Collections
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          From liquid chrome reflections and draped satin silks to atmospheric polar auroras and deep bitlight Bayer dithers.
        </p>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col, idx) => {
          const colPresets = presets.filter((p) => p.collections.includes(col.slug));
          const samplePreset = colPresets[0];
          const collCode = `COL-${String(idx + 1).padStart(2, '0')}`;

          return (
            <div
              key={col.slug}
              onClick={() => onSelectCollection(col.slug)}
              className="group relative flex flex-col justify-between p-6 rounded-3xl bg-[#0c101b] border border-white/[0.08] hover:border-amber-400/50 hover:bg-[#101526] transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer overflow-hidden"
            >
              {/* Subtle Atmospheric Glow */}
              <div 
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
                style={{
                  backgroundColor: samplePreset?.params.colors[0] || '#8b5cf6'
                }}
              />

              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-zinc-500">
                      {collCode}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {col.name}
                    </h3>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold bg-white/10 text-zinc-300 border border-white/10">
                    {colPresets.length} PRESETS
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {col.description}
                </p>
              </div>

              {/* Sample Palette Dots & Action */}
              <div className="relative z-10 flex items-center justify-between pt-6 mt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  {samplePreset?.params.colors.slice(0, 4).map((color, colorIdx) => (
                    <span
                      key={colorIdx}
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <span className="text-[11px] font-mono text-zinc-500 ml-1 uppercase">
                    {samplePreset?.params.kind}
                  </span>
                </div>

                <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all">
                  <span>ENTER ARCHIVE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
