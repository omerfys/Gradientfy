import React, { useEffect, useState, useRef, useMemo } from 'react';

interface LoaderScreenProps {
  onLoaded: () => void;
}

interface AngleKeyframe {
  t: number;
  a: number;
}

function shortestAngleDiff(target: number, current: number): number {
  return ((target - current + 180) % 360) - 180;
}

// Procedurally generate a brand new set of random rotation angles each time LoaderScreen mounts!
// The center is ALWAYS fixed at (50%, 50%), only the angles and pauses are randomized.
function generateRandomAngleKeyframes(): AngleKeyframe[] {
  // Generate 4 randomized target angles (-180 to +180 deg)
  const rawTargets = [
    Math.floor(Math.random() * 360) - 180,
    Math.floor(Math.random() * 360) - 180,
    Math.floor(Math.random() * 360) - 180,
    Math.floor(Math.random() * 360) - 180,
  ];

  // Chain consecutive angles via the shortest angular path to ensure natural, cinematic transitions
  let currentAngle = rawTargets[0];
  const chained: number[] = [currentAngle];

  for (let i = 1; i < rawTargets.length; i++) {
    const diff = shortestAngleDiff(rawTargets[i], currentAngle);
    currentAngle += diff;
    chained.push(currentAngle);
  }

  return [
    { t: 0.00, a: chained[0] }, // Start at random initial angle
    { t: 0.15, a: chained[0] }, // Brief initial pause
    { t: 0.50, a: chained[1] }, // Smooth rotation to random angle 1
    { t: 0.70, a: chained[1] }, // Brief pause
    { t: 0.90, a: chained[2] }, // Smooth rotation to random angle 2
    { t: 1.00, a: chained[2] }, // Holds angle firmly while dark overlay dissolves
  ];
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const v = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return v * v * (3 - 2 * v);
}

function interpolateAngle(keyframes: AngleKeyframe[], t: number): number {
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0 = keyframes[i];
    const k1 = keyframes[i + 1];
    if (t >= k0.t && t <= k1.t) {
      const ratio = smoothstep(k0.t, k1.t, t);
      return k0.a + (k1.a - k0.a) * ratio;
    }
  }
  return keyframes[keyframes.length - 1].a;
}

export const LoaderScreen: React.FC<LoaderScreenProps> = ({ onLoaded }) => {
  const [isExiting, setIsExiting] = useState(false);

  // Brand new randomized angle sequence generated on every single load!
  const angleKeyframes = useMemo(() => generateRandomAngleKeyframes(), []);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const vSystemRef = useRef<HTMLDivElement | null>(null);

  // Pulse DOM Refs for direct transform performance
  const pulseUpperRef = useRef<HTMLDivElement | null>(null);
  const pulseLowerRef = useRef<HTMLDivElement | null>(null);
  const vertexFlareRef = useRef<HTMLDivElement | null>(null);

  const V_APERTURE = 44; // 44-degree V aperture opening
  const HALF_APERTURE = V_APERTURE / 2; // 22 deg

  // Lock page scrolling while loading animation is active
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onScroll, { passive: false });
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('wheel', preventDefault);
      window.removeEventListener('touchmove', preventDefault);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    // Check prefers-reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(onLoaded, 300);
      }, 400);
      return;
    }

    const startTime = performance.now();
    // 1.6s duration: fast, responsive, and cinematic!
    const totalDuration = 1600;
    let frameId: number;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / totalDuration);

      // 1. Calculate smooth angle (center is permanently anchored at x: 50%, y: 50%)
      const currentAngle = interpolateAngle(angleKeyframes, t);

      // 2. Conic-gradient mask opening rotates around the PERMANENT CENTER (50% 50%)
      const maskStart = currentAngle + 90 - HALF_APERTURE;

      if (overlayRef.current) {
        if (t >= 0.90) {
          overlayRef.current.style.opacity = `${Math.max(0, 1 - (t - 0.90) / 0.10)}`;
        } else {
          // Permanently anchored at 50% 50%: reveals the real website underneath through the rotating V!
          const mask = `conic-gradient(from ${maskStart}deg at 50% 50%, transparent 0deg, transparent ${V_APERTURE}deg, #000000 ${V_APERTURE}deg, #000000 360deg)`;
          overlayRef.current.style.maskImage = mask;
          overlayRef.current.style.setProperty('-webkit-mask-image', mask);
          overlayRef.current.style.opacity = '1';
        }
      }

      // 3. Rotate the V-System in place around its permanently fixed center pivot (50% 50%)
      if (vSystemRef.current) {
        vSystemRef.current.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg)`;
        if (t >= 0.90) {
          vSystemRef.current.style.opacity = `${Math.max(0, 1 - (t - 0.90) / 0.10)}`;
        } else {
          vSystemRef.current.style.opacity = '1';
        }
      }

      // 4. Energy Pulses along the V-rails
      const raySpan = Math.max(window.innerWidth, window.innerHeight) * 1.2;
      const timeSec = elapsed / 1000;

      // Pulse 1 on Upper Rail (Period: 1.2s)
      const cycle1 = timeSec % 1.2;
      if (pulseUpperRef.current) {
        if (cycle1 < 0.65) {
          const norm1 = cycle1 / 0.65;
          const pos1 = (1.0 - Math.pow(norm1, 1.25)) * raySpan;
          const op1 = Math.sin(norm1 * Math.PI) * 0.95;
          pulseUpperRef.current.style.transform = `translateX(${pos1}px)`;
          pulseUpperRef.current.style.opacity = `${op1}`;
        } else {
          pulseUpperRef.current.style.opacity = '0';
        }
      }

      // Pulse 2 on Lower Rail (Period: 1.0s)
      const cycle2 = (timeSec + 0.4) % 1.0;
      if (pulseLowerRef.current) {
        if (cycle2 < 0.55) {
          const norm2 = cycle2 / 0.55;
          const pos2 = Math.pow(norm2, 0.85) * raySpan;
          const op2 = Math.sin(norm2 * Math.PI) * 0.95;
          pulseLowerRef.current.style.transform = `translateX(${pos2}px)`;
          pulseLowerRef.current.style.opacity = `${op2}`;
        } else {
          pulseLowerRef.current.style.opacity = '0';
        }
      }

      // Vertex flare when pulse reaches apex
      const flare1 = Math.abs(cycle1 - 0.6) < 0.08 ? Math.pow(1 - Math.abs(cycle1 - 0.6) / 0.08, 2) : 0;
      const flare2 = Math.abs(cycle2 - 0.08) < 0.08 ? Math.pow(1 - Math.abs(cycle2 - 0.08) / 0.08, 2) : 0;
      const cornerIntensity = Math.max(flare1, flare2);

      if (vertexFlareRef.current) {
        vertexFlareRef.current.style.opacity = `${cornerIntensity * 0.85}`;
        vertexFlareRef.current.style.transform = `scale(${1 + cornerIntensity * 0.5})`;
      }
      if (t < 1.0) {
        frameId = requestAnimationFrame(tick);
      } else {
        // Complete -> smoothly reveal full website
        setIsExiting(true);
        setTimeout(() => {
          onLoaded();
        }, 300);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [onLoaded, angleKeyframes]);

  return (
    <div
      role="status"
      aria-label="Loading Gradientfy Experience"
      className={`fixed inset-0 z-[99999] touch-none select-none overflow-hidden transition-all duration-400 ease-out ${
        isExiting ? 'opacity-0 scale-[1.01] pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'
      }`}
    >
      {/* =========================================================================
          DARK OVERLAY WITH CENTER-ANCHORED ROTATING V-MASK:
          Center is permanently locked at (50% 50%). Zero translate.
          Every load generates a fresh, randomized sequence of angles and pauses!
          Reveals the real website underneath through the rotating V window!
          ========================================================================= */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-[#04060c] pointer-events-none transition-opacity duration-300"
      />

      {/* Subtle Atmospheric Vignette at boundaries */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(4,6,12,0.6)_100%)] pointer-events-none" />

      {/* =========================================================================
          CENTER-ANCHORED V-SHAPED APERTURE SYSTEM:
          Permanently anchored at left: 50%, top: 50%.
          Rotates in place around its own central pivot.
          ========================================================================= */}
      <div 
        ref={vSystemRef}
        className="absolute left-1/2 top-1/2 pointer-events-none z-20"
        style={{
          width: '1px',
          height: '1px',
          transform: 'translate(-50%, -50%) rotate(0deg)',
        }}
      >
        {/* UPPER V-EDGE RAIL */}
        <div
          className="absolute top-0 left-0 h-[2px] w-[140vmax] origin-left overflow-hidden pointer-events-none"
          style={{ transform: `rotate(-${HALF_APERTURE}deg)` }}
        >
          {/* Baseline Guide Rail */}
          <div className="h-full w-full bg-gradient-to-r from-white/35 via-white/10 to-transparent opacity-40" />

          {/* Inward Travelling Energy Pulse */}
          <div 
            ref={pulseUpperRef}
            className="absolute top-0 h-full w-72 rounded-full pointer-events-none opacity-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(254, 240, 138, 0.3) 30%, #ffffff 80%, rgba(251, 191, 36, 0.95) 100%)',
              filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.8))',
            }}
          />
        </div>

        {/* LOWER V-EDGE RAIL */}
        <div
          className="absolute top-0 left-0 h-[2px] w-[140vmax] origin-left overflow-hidden pointer-events-none"
          style={{ transform: `rotate(${HALF_APERTURE}deg)` }}
        >
          {/* Baseline Guide Rail */}
          <div className="h-full w-full bg-gradient-to-r from-white/35 via-white/10 to-transparent opacity-40" />

          {/* Outward Travelling Energy Pulse */}
          <div 
            ref={pulseLowerRef}
            className="absolute top-0 h-full w-72 rounded-full pointer-events-none opacity-0"
            style={{
              background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.95) 0%, #ffffff 20%, rgba(254, 240, 138, 0.3) 70%, transparent 100%)',
              filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.8))',
            }}
          />
        </div>

        {/* VERTEX OPTICAL APEX NODE (Permanently centered at 50% 50%) */}
        <div 
          ref={vertexFlareRef}
          className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full pointer-events-none opacity-0 transition-opacity duration-100 flex items-center justify-center z-20"
        >
          <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-md animate-pulse" />
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)]" />
        </div>
      </div>

    </div>
  );
};
