import React from 'react';

interface GradientfyLogoProps {
  className?: string;
  size?: number;
}

export const GradientfyLogo: React.FC<GradientfyLogoProps> = ({ 
  className = '', 
  size = 28 
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 48 48" 
        width={size} 
        height={size} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Liquid Golden-Amber Gradient */}
          <linearGradient id="logoGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffde6" />
            <stop offset="35%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Subtle Inset Border Gradient */}
          <linearGradient id="logoGradBorder" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(254, 240, 138, 0.6)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0.2)" />
          </linearGradient>
        </defs>

        {/* Milled Dark Container Badge */}
        <rect 
          x="2" 
          y="2" 
          width="44" 
          height="44" 
          rx="13" 
          fill="#080c16" 
          stroke="url(#logoGradBorder)" 
          strokeWidth="1.5" 
        />

        {/* Pure Geometric Gradient "G" Ribbon */}
        <path 
          d="M32 14 C27 9, 14 9, 11 19 C8 29, 17 38, 28 38 C35 38, 38 34, 38 28 L25 28" 
          stroke="url(#logoGradGold)" 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
};
