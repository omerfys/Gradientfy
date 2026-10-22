import React, { useState, useEffect } from 'react';
import { GradientParams } from '../engine';
import { RESOLUTION_PRESETS } from '../types/gradient';
import { 
  exportImage, 
  exportSvg, 
  exportGif, 
  exportVideo, 
  generateCss, 
  generateTailwind, 
  generateReactComponent, 
  downloadBlob, 
  downloadText 
} from '../utils/exporter';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Film, 
  Image as ImageIcon, 
  Code, 
  Lock, 
  Unlock, 
  Sparkles,
  FileCode,
  FileJson
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: GradientParams;
  presetName: string;
}

type ExportCategory = 'image' | 'video' | 'code';
type ImageFormat = 'png' | 'jpeg' | 'webp' | 'svg';
type VideoFormat = 'webm' | 'gif';
type CodeFormat = 'css' | 'tailwind' | 'react' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  params,
  presetName,
}) => {
  const [category, setCategory] = useState<ExportCategory>('image');
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('webm');
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('css');

  // Resolution state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('4k');
  const [width, setWidth] = useState<number>(3840);
  const [height, setHeight] = useState<number>(2160);
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1);
  const [aspectLocked, setAspectLocked] = useState<boolean>(true);
  const [quality, setQuality] = useState<number>(0.95);

  // Video loop settings
  const [videoDuration, setVideoDuration] = useState<number>(Math.min(params.loopSeconds || 10, 10));
  const [videoFps, setVideoFps] = useState<number>(30);

  // Status & Progress
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Keyboard shortcut: Esc dismisses modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = RESOLUTION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (aspectLocked && width > 0) {
      const ratio = height / width;
      setHeight(Math.round(newWidth * ratio));
    }
    setSelectedPresetId('custom');
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (aspectLocked && height > 0) {
      const ratio = width / height;
      setWidth(Math.round(newHeight * ratio));
    }
    setSelectedPresetId('custom');
  };

  const finalWidth = width * scaleMultiplier;
  const finalHeight = height * scaleMultiplier;
  const cleanName = presetName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Action: Export Still Image
  const handleExportImage = async () => {
    setIsExporting(true);
    setExportProgress(0.2);

    try {
      if (imageFormat === 'svg') {
        const svgContent = exportSvg(params, finalWidth, finalHeight);
        downloadText(svgContent, `${cleanName}-${finalWidth}x${finalHeight}.svg`, 'image/svg+xml');
      } else {
        const blob = await exportImage({
          params,
          width: finalWidth,
          height: finalHeight,
          format: imageFormat,
          quality,
        });
        downloadBlob(blob, `${cleanName}-${finalWidth}x${finalHeight}.${imageFormat}`);
      }
    } catch (err) {
      console.error('Image export failed:', err);
      alert('Export failed. Please check browser WebGL capabilities.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Action: Export Video or Animated GIF
  const handleExportVideo = async () => {
    setIsExporting(true);
    setExportProgress(0.01);

    try {
      if (videoFormat === 'gif') {
        const blob = await exportGif({
          params,
          width: Math.min(finalWidth, 800),
          height: Math.min(finalHeight, 600),
          durationSeconds: videoDuration,
          fps: Math.min(videoFps, 20),
          onProgress: (p) => setExportProgress(p),
        });
        downloadBlob(blob, `${cleanName}-loop.gif`);
      } else {
        const blob = await exportVideo({
          params,
          width: Math.min(finalWidth, 1920),
          height: Math.min(finalHeight, 1080),
          durationSeconds: videoDuration,
          fps: videoFps,
          onProgress: (p) => setExportProgress(p),
        });
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        downloadBlob(blob, `${cleanName}-loop.${ext}`);
      }
    } catch (err) {
      console.error('Video export failed:', err);
      alert('Video export failed. Make sure your browser supports MediaRecorder.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const getCodeSnippet = (): string => {
    if (codeFormat === 'css') return generateCss(params);
    if (codeFormat === 'tailwind') return generateTailwind(params);
    if (codeFormat === 'react') return generateReactComponent(params, presetName);
    return JSON.stringify(params, null, 2);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = () => {
    const ext = codeFormat === 'css' ? 'css' : codeFormat === 'react' ? 'tsx' : codeFormat === 'tailwind' ? 'txt' : 'json';
    downloadText(getCodeSnippet(), `${cleanName}-gradient.${ext}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-3xl rounded-3xl bg-[#0c101a] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-[#07090e]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30">
              <Download className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Export & Download
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {presetName}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Download in any resolution and format without watermarks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs: Images / Video & GIF / Code (Liquid Sliding Pill Animation) */}
        <div className="relative p-1.5 border-b border-white/[0.08] bg-[#090d16]">
          {/* Background Liquid Sliding Pill */}
          <div 
            className="absolute top-1.5 bottom-1.5 rounded-xl btn-gradient-yellow transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
            style={{
              width: 'calc(33.333% - 4px)',
              left: category === 'image' ? '4px' : category === 'video' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
            }}
          />

          <div className="grid grid-cols-3 gap-1 relative z-10">
            <button
              onClick={() => setCategory('image')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                category === 'image' ? '!text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon className={`w-4 h-4 ${category === 'image' ? 'text-black' : 'text-zinc-400'}`} />
              <span>Images</span>
            </button>

            <button
              onClick={() => setCategory('video')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                category === 'video' ? '!text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className={`w-4 h-4 ${category === 'video' ? 'text-black' : 'text-zinc-400'}`} />
              <span>Video & GIF</span>
            </button>

            <button
              onClick={() => setCategory('code')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                category === 'code' ? '!text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code className={`w-4 h-4 ${category === 'code' ? 'text-black' : 'text-zinc-400'}`} />
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1">
          
          {/* ================= CATEGORY 1: STILL IMAGE ================= */}
          {category === 'image' && (
            <div className="flex flex-col gap-6">
              
              {/* Format selection chips */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Select Image Format
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['png', 'jpeg', 'webp', 'svg'] as ImageFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setImageFormat(fmt)}
                      className={`flex flex-col items-center justify-center py-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                        imageFormat === fmt
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400 shadow-sm'
                          : 'bg-white/[0.02] text-zinc-400 hover:text-white border-white/[0.06]'
                      }`}
                    >
                      <span>{fmt === 'jpeg' ? 'JPG' : fmt}</span>
                      <span className="text-[10px] font-normal text-zinc-500 lowercase">
                        {fmt === 'png' ? 'lossless' : fmt === 'svg' ? 'vector' : 'optimized'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Presets Grid */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Resolution Presets
                  </label>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    Target: {finalWidth} × {finalHeight} px
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {RESOLUTION_PRESETS.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => handleSelectPreset(res.id)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                        selectedPresetId === res.id
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-sm'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-zinc-200">{res.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-400">
                          {res.aspect}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        {res.width} × {res.height}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Resolution Inputs */}
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <label className="text-xs font-semibold text-zinc-300">
                  Custom Dimensions & Scaling
                </label>
                
                <div className="flex items-center gap-3">
                  {/* Width */}
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-400">Width (px)</span>
                    <input
                      type="number"
                      min="100"
                      max="8192"
                      value={width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Aspect Lock */}
                  <div className="flex flex-col items-center pt-4">
                    <button
                      onClick={() => setAspectLocked(!aspectLocked)}
                      title={aspectLocked ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
                      className={`p-2 rounded-lg border transition-colors ${
                        aspectLocked
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                          : 'bg-white/[0.05] text-zinc-500 border-white/[0.06]'
                      }`}
                    >
                      {aspectLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Height */}
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-400">Height (px)</span>
                    <input
                      type="number"
                      min="100"
                      max="8192"
                      value={height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Scale Multiplier */}
                  <div className="w-24 flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-400">DPR Scale</span>
                    <select
                      value={scaleMultiplier}
                      onChange={(e) => setScaleMultiplier(parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    >
                      <option value="1" className="bg-zinc-900">1x (Default)</option>
                      <option value="2" className="bg-zinc-900">2x (Retina)</option>
                      <option value="4" className="bg-zinc-900">4x (Super)</option>
                    </select>
                  </div>
                </div>

                {/* Quality slider for JPG/WebP */}
                {(imageFormat === 'jpeg' || imageFormat === 'webp') && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-white/[0.06] mt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Compression Quality</span>
                      <span className="font-mono text-amber-400 font-bold">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                    />
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= CATEGORY 2: VIDEO & ANIMATION ================= */}
          {category === 'video' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Select Animation Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVideoFormat('webm')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all ${
                      videoFormat === 'webm'
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400 shadow-sm'
                        : 'bg-white/[0.02] text-zinc-400 hover:text-white border-white/[0.06]'
                    }`}
                  >
                    <span className="uppercase text-sm">WebM / MP4 Video Loop</span>
                    <span className="text-[11px] font-normal text-zinc-500 mt-1">
                      1080p 60fps high-bitrate video, seamless loop
                    </span>
                  </button>

                  <button
                    onClick={() => setVideoFormat('gif')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all ${
                      videoFormat === 'gif'
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400 shadow-sm'
                        : 'bg-white/[0.02] text-zinc-400 hover:text-white border-white/[0.06]'
                    }`}
                  >
                    <span className="uppercase text-sm">Animated GIF</span>
                    <span className="text-[11px] font-normal text-zinc-500 mt-1">
                      Standalone looping GIF file for docs & READMEs
                    </span>
                  </button>
                </div>
              </div>

              {/* Video parameters */}
              <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">Loop Duration</span>
                    <span className="font-mono text-amber-400 font-bold">{videoDuration} seconds</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="1"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                  <span className="text-[10px] text-zinc-500">
                    Math-timed to match the shader cycle for an imperceptible seam.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-xs text-zinc-300 font-semibold">Framerate</span>
                  <div className="flex items-center gap-2">
                    {[15, 30, 60].map((fps) => (
                      <button
                        key={fps}
                        onClick={() => setVideoFps(fps)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                          videoFps === fps
                            ? 'btn-gradient-yellow !text-black shadow-sm'
                            : 'bg-white/[0.05] text-zinc-400 border-white/[0.06]'
                        }`}
                      >
                        {fps} FPS
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= CATEGORY 3: CODE & DEVELOPER ================= */}
          {category === 'code' && (
            <div className="flex flex-col gap-4">
              
              {/* Code format switcher */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'css', label: 'CSS', icon: FileCode },
                  { id: 'tailwind', label: 'Tailwind CSS', icon: Sparkles },
                  { id: 'react', label: 'React / JSX', icon: Code },
                  { id: 'json', label: 'JSON Config', icon: FileJson },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = codeFormat === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCodeFormat(item.id as CodeFormat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'btn-gradient-yellow !text-black shadow-sm'
                          : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Code display block */}
              <div className="relative rounded-2xl bg-[#05070c] border border-white/10 p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[300px]">
                <pre>{getCodeSnippet()}</pre>
                
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-all active:scale-95"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Progress Bar */}
          {isExporting && (
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex justify-between text-xs font-semibold text-amber-300">
                <span>Rendering GPU Frame(s)...</span>
                <span>{Math.round(exportProgress * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-150"
                  style={{ width: `${Math.max(5, exportProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between p-5 border-t border-white/[0.08] bg-[#07090e]">
          <div className="text-xs text-zinc-400">
            {category === 'image' && <span>Output: <strong>{finalWidth} × {finalHeight} px</strong> {imageFormat.toUpperCase()}</span>}
            {category === 'video' && <span>Duration: <strong>{videoDuration}s</strong> @ {videoFps}fps {videoFormat.toUpperCase()}</span>}
            {category === 'code' && <span>Format: <strong>{codeFormat.toUpperCase()}</strong></span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            {category === 'image' && (
              <button
                onClick={handleExportImage}
                disabled={isExporting}
                className="btn-gradient-yellow px-6 py-2.5 rounded-xl text-xs font-bold gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-black" />
                <span>{isExporting ? 'Generating...' : `Download ${imageFormat.toUpperCase()}`}</span>
              </button>
            )}

            {category === 'video' && (
              <button
                onClick={handleExportVideo}
                disabled={isExporting}
                className="btn-gradient-yellow px-6 py-2.5 rounded-xl text-xs font-bold gap-2 disabled:opacity-50"
              >
                <Film className="w-4 h-4 text-black" />
                <span>{isExporting ? 'Rendering Video...' : `Record & Download ${videoFormat.toUpperCase()}`}</span>
              </button>
            )}

            {category === 'code' && (
              <button
                onClick={handleCopyCode}
                className="btn-gradient-yellow px-6 py-2.5 rounded-xl text-xs font-bold gap-2"
              >
                {copiedCode ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{copiedCode ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
