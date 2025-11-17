"use client";

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ShinyText: React.FC<ShinyTextProps> = ({ text, disabled = false, speed = 5, className = '', style }) => {
  const animationDuration = `${speed}s`;
    const baseColor: string = (style?.color as string) || '#84cc16';
    const defaultGradient: string = (style?.backgroundImage as string) || `linear-gradient(120deg, ${baseColor}00 40%, ${baseColor} 50%, ${baseColor}00 60%)`;

  return (
    <div
      className={`bg-clip-text inline-block ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        color: baseColor,
        backgroundImage: defaultGradient,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animationDuration: animationDuration,
        ...style
      }}
    >
      {text}
    </div>
  );
};

export default ShinyText;

