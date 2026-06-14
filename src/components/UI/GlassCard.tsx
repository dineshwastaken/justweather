/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useApp } from '../../context/AppContext';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode;
  className?: string;
  glowColor?: string; // Optional overlay glow color (e.g., violet, cyan)
  gradient?: boolean; // If true, adds a subtle soft top-to-bottom glassy gradient
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowColor,
  gradient = false,
  ...props
}) => {
  const { predictedTemperature, interactionState } = useApp();
  const frostOpacity = predictedTemperature < 21 ? Math.min(1.0, (21 - predictedTemperature) / 15) : 0;

  // Ultra-realistic refractive physical noise texture SVG
  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E")`;

  // Compute coordinate tilting coordinates
  const tiltX = interactionState.mousePosition.y * 4.0;
  const tiltY = interactionState.mousePosition.x * 5.0;

  return (
    <motion.div
      {...props}
      animate={{
        rotateX: tiltX,
        rotateY: tiltY,
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      whileHover={{ 
        scale: 1.025,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      className={`
        relative 
        overflow-hidden 
        rounded-3xl 
        border border-white/12 
        bg-white/[0.07] 
        backdrop-blur-xl 
        hover:backdrop-blur-2xl
        shadow-[0_22px_55px_rgba(0,0,0,0.5)] 
        shadow-black/25
        inset-shadow-sm
        before:absolute before:inset-0 
        before:rounded-[1.4rem] 
        before:border-t before:border-l before:border-white/20 
        before:pointer-events-none 
        hover:border-white/30
        transition-all 
        duration-500
        group
        ${className}
      `}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
        ...props.style
      }}
    >
      {/* 1. Ground Refraction Organic Noise Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60 rounded-3xl"
        style={{ backgroundImage: noiseBg }}
      />

      {/* 2. Sophisticated Liquid Glass Iridescent Radial Gradient (Fades in smoothly on hover) */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-550 ease-out pointer-events-none rounded-3xl"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0) 72%)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* 3. Optional Soft Inner Gradient Vibe */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/15 pointer-events-none rounded-3xl" />
      )}

      {/* 4. Receptive Custom Ambient Glow Base */}
      {glowColor && (
        <div 
          className="absolute -top-16 -left-16 w-32 h-32 rounded-full filter blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: glowColor }}
        />
      )}

      {/* 4.5. Dynamic Frost Vignette (visible for low temperatures < 21°C) */}
      {frostOpacity > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-500 border border-white/20"
          style={{
            opacity: frostOpacity,
            background: 'radial-gradient(circle, rgba(235,248,255,0) 80%, rgba(220,240,255,0.18) 100%)',
            boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.12)',
          }}
        />
      )}

      {/* 5. Child Elements Content Container */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
