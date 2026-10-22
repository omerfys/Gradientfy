import React, { useEffect, useRef, useMemo } from 'react';
import { mountGradient, GradientParams, MountedGradient } from '../engine';

interface GradientCanvasProps {
  params: GradientParams;
  className?: string;
  interactive?: boolean;
  paused?: boolean;
  timeSeconds?: number;
  transparentBackground?: boolean;
}

export const GradientCanvas: React.FC<GradientCanvasProps> = ({
  params,
  className = '',
  interactive = true,
  paused = false,
  timeSeconds,
  transparentBackground = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const instanceRef = useRef<MountedGradient | null>(null);

  // If paused, halt motion. If interactive is false, disable pointer warp.
  const activeParams = useMemo(() => {
    let p = params;
    if (paused) {
      p = {
        ...p,
        speed: 0.00001,
      };
    }
    if (!interactive) {
      p = {
        ...p,
        interaction: {
          ...p.interaction,
          pointer: 0,
        },
      };
    }
    return p;
  }, [params, paused, interactive, timeSeconds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const instance = mountGradient(canvas, activeParams, {
        maxDpr: Math.min(window.devicePixelRatio || 1, 2),
        reducedMotion: 'ignore',
        primary: true,
        transparentBackground,
      });
      instanceRef.current = instance;

      return () => {
        instance.unmount();
        instanceRef.current = null;
      };
    } catch (e) {
      console.warn('WebGL2 mount failed:', e);
    }
  }, [activeParams.kind]);

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setParams(activeParams);
    }
  }, [activeParams]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      />
    </div>
  );
};
