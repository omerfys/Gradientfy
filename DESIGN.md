# Design System & Art Direction: Gradientfy

## 1. Concept Card

- **Idea:** A precision digital optics laboratory where mathematical GPU shaders generate, calibrate, and export living light gradients at extreme resolutions.
- **Metaphor:** The Chromatic Darkroom — light refraction, beam diffractions, spectrographic wavelengths ($\lambda$), calibrated color stops, and optical bench crosshairs.
- **Signature:** The Interactive Optical Viewport: real-time 60 FPS WebGL2 shader surface responsive to mouse refraction warp, with scrubbable seamless loop timelines and instant multi-tile 8K rendering.
- **Emotion:** High-tech, hypnotic, laboratory-grade precision, and cinematic polish.
- **Motion Verb:** "Refract like glass, fold like satin, dither like film."
- **Screenshot Frame:** The Studio Workbench with floating crosshairs, wavelength readouts, color harmonic spectrum bar, and the high-res quad-tiled export drawer.

---

## 2. Art Direction System

### Palette by Role
- `ground`: `#06080d` (Deep obsidian darkroom void)
- `surface`: `#0c101b` (Milled anodized aluminum workbench panels)
- `elevated`: `#111726` (Floating optical lenses and control station cards)
- `ink`: `#f4f4f7` (Pure luminescent typographic white)
- `muted`: `#868c9f` (Technical indices, metadata, and calibrated units)
- `line`: `rgba(255, 255, 255, 0.08)` (Hairline architectural boundaries)
- `line-hover`: `rgba(255, 255, 255, 0.22)` (Active focus and highlighted boundaries)
- `accent`: `#8b5cf6` to `#06b6d4` (Prismatic spectral violet to cyan refraction)

### Typography
- **Display & Interface:** *Mona Sans* / *Inter* (Variable, geometric with humanist warmth, set with tight negative tracking `-0.035em` and optical alignment).
- **Technical & Data Readout:** *JetBrains Mono* (Tabular figures `tabular-nums` for coordinates, framerate `FR: 60`, wavelengths `λ 420-750nm`, and HEX color definitions).
- **Scale:**
  - Mega Display: `clamp(2.5rem, 5vw, 4.5rem)`
  - Section Headings: `clamp(1.5rem, 2.5vw, 2.25rem)`
  - Subheadings / Card Titles: `0.9375rem (15px)`
  - Body & Microcopy: `0.8125rem (13px)`
  - Metadata & Badges: `0.6875rem (11px)`

### Grid & Spacing
- Four-corners framing with architectural alignment.
- Subtle `32px` hairline optical grid pattern in hero and studio viewport.
- Precision corner reticles (`+`) denoting calibrated focal zones.

### Motion Language
- **Continuous Life at Rest:** Shaders run at 60 FPS WebGL2 continuous loop; background ambient light breathes organically.
- **Micro-Interactions:** Inner text rolls, color swatches scale smoothly on hover, and active states snap crisply with `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Keyboard Shortcuts:**
  - `/` → Focus Catalog search
  - `Space` → Toggle play / pause in Studio
  - `Esc` → Dismiss modal dialogs

---

## 3. Genericness Test

- *Did it land on generic AI SaaS card kits?* **No.** Instead of soft generic purple blobs and rounded SaaS pricing cards, Gradientfy is constructed as an optical instrument bench with technical metadata, specimen identifiers (`SPE-001`), quad-tiled render capabilities, and real-time GPU shader parameters.
- *Is color applied as decoration?* **No.** The interface remains dark and monochrome (`#06080d`), allowing the user's gradient creations and optical shaders to provide the chromatic focal point.
