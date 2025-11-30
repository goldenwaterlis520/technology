import React, { useState } from 'react';
import { playSound } from '../services/audioService';

interface CyberButtonProps {
  id?: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const MotionButton: React.FC<CyberButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  className = "",
  variant = 'primary'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: "border-cyan-500 text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/80 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]",
    secondary: "border-emerald-500 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/80 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]",
    danger: "border-red-500 text-red-400 bg-red-950/40 hover:bg-red-900/80 hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
  };

  return (
    <button
      disabled={disabled}
      onMouseEnter={() => {
        setIsHovered(true);
        if (!disabled) playSound('hover');
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!disabled) {
          playSound('click');
          onClick();
        }
      }}
      className={`
        relative overflow-hidden transition-all duration-200
        border-2 px-6 py-4 rounded-sm font-bold uppercase tracking-widest
        active:scale-95
        ${variants[variant]}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* HUD Corner markers */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-70"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-70"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-70"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-70"></div>
      
      {/* Glitch/Scan effect on hover */}
      {isHovered && !disabled && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-scan"></div>
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current opacity-50"></div>
        </>
      )}

      {children}
    </button>
  );
};