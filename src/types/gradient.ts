import { GradientParams, GradientKind } from '../engine';

export interface PresetCollection {
  name: string;
  slug: string;
  order: number;
  description: string;
  entries?: PresetItem[];
}

export interface PresetItem {
  id: string;
  name: string;
  collections: string[];
  image?: string | null;
  looks: string[];
  tone: 'dark' | 'light';
  tier: 'free' | 'pro';
  motion?: string | null;
  params: GradientParams;
}

export interface PresetDatabase {
  total: number;
  collections: PresetCollection[];
  presets: PresetItem[];
}

export type ViewMode = 'catalog' | 'studio' | 'collections' | 'favorites';

export interface ResolutionPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  aspect: string;
  category: 'Screen' | 'Mobile' | 'Social' | 'Banner';
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: '4k', name: '4K Ultra HD', width: 3840, height: 2160, aspect: '16:9', category: 'Screen' },
  { id: '2k', name: '2K QHD', width: 2560, height: 1440, aspect: '16:9', category: 'Screen' },
  { id: 'fhd', name: 'Full HD', width: 1920, height: 1080, aspect: '16:9', category: 'Screen' },
  { id: 'hd', name: '720p HD', width: 1280, height: 720, aspect: '16:9', category: 'Screen' },
  { id: 'ultrawide', name: 'Ultrawide 21:9', width: 3440, height: 1440, aspect: '21:9', category: 'Screen' },
  { id: 'macbook', name: 'MacBook 16"', width: 3456, height: 2234, aspect: '16:10', category: 'Screen' },
  { id: 'mobile-fhd', name: 'Mobile FHD Wallpaper', width: 1080, height: 1920, aspect: '9:16', category: 'Mobile' },
  { id: 'iphone15', name: 'iPhone 15 Pro Max', width: 1290, height: 2796, aspect: '9:19.5', category: 'Mobile' },
  { id: 'ipad', name: 'iPad Pro', width: 2048, height: 2732, aspect: '3:4', category: 'Mobile' },
  { id: 'insta-sq', name: 'Instagram Square', width: 1080, height: 1080, aspect: '1:1', category: 'Social' },
  { id: 'insta-port', name: 'Instagram Portrait', width: 1080, height: 1350, aspect: '4:5', category: 'Social' },
  { id: 'insta-story', name: 'Instagram Story', width: 1080, height: 1920, aspect: '9:16', category: 'Social' },
  { id: 'twitter-hdr', name: 'Twitter / X Banner', width: 1500, height: 500, aspect: '3:1', category: 'Banner' },
  { id: 'yt-banner', name: 'YouTube Banner', width: 2560, height: 1440, aspect: '16:9', category: 'Banner' },
  { id: 'linkedin-hdr', name: 'LinkedIn Banner', width: 1584, height: 396, aspect: '4:1', category: 'Banner' },
];

export const GRADIENT_KINDS: { id: GradientKind; label: string; desc: string }[] = [
  { id: 'mesh', label: 'Mesh', desc: 'Soft color fields drifting through each other' },
  { id: 'grain', label: 'Grain Gradient', desc: 'A grainy, out-of-focus blend of saturated colour' },
  { id: 'aurora', label: 'Aurora', desc: 'Vertical light curtains folding over a dark sky' },
  { id: 'waves', label: 'Waves', desc: 'Layered rolling wave bands of color' },
  { id: 'radial-glow', label: 'Radial Glow', desc: 'Warm glow rising from edge or center' },
  { id: 'linear-flow', label: 'Linear Flow', desc: 'Linear angle blend drifting smoothly' },
  { id: 'ribbon', label: 'Ribbon', desc: 'Curving twisted ribbons of spectral light' },
  { id: 'silk', label: 'Silk', desc: 'Draped sheets of satin folding under light' },
  { id: 'chrome', label: 'Chrome', desc: 'Liquid metal with metallic reflections' },
  { id: 'fluted', label: 'Fluted Glass', desc: 'Light refracted through fluted glass reeds' },
  { id: 'pixel-glass', label: 'Pixel Glass', desc: 'Beveled square glass block grid' },
  { id: 'beam', label: 'Beam', desc: 'Cones of projector and spotlight streaks' },
  { id: 'halo', label: 'Halo', desc: 'Radial rings of light round a core' },
  { id: 'spectrum', label: 'Spectrum', desc: 'Prismatic thin arcs of split spectral light' },
  { id: 'dither-burst', label: 'Dither Burst', desc: 'Halftone dither burst radiating outwards' },
  { id: 'dither-field', label: 'Dither Field', desc: 'Ordered dithering across dusk fields' },
  { id: 'limb', label: 'Limb / Nightside', desc: 'Atmosphere rim of planet against darkness' },
  { id: 'rise', label: 'First Light / Rise', desc: 'Long ramp sky from dark ink to dawn' },
  { id: 'mist', label: 'Mist / Soft Fold', desc: 'Out of focus folds of heavy mist light' },
  { id: 'smear', label: 'Smear', desc: 'Slow shutter smear of vibrant color' },
  { id: 'swirl', label: 'Swirl', desc: 'Vortex swirling color blend' },
  { id: 'void', label: 'Void / Umbra', desc: 'Dark disc with corona spilling around' },
];
