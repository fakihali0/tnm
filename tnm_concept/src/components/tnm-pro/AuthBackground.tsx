import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useIsMobile } from '@/hooks/use-mobile';

interface AuthBackgroundProps {
  className?: string;
}

export const AuthBackground: React.FC<AuthBackgroundProps> = ({ className = '' }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  // Currency symbols with positions and animations
  const currencySymbols = useMemo(() => {
    const symbols = ['$', '€', '£', '¥', '₿'];
    const count = isMobile ? 8 : 12;
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      symbol: symbols[i % symbols.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      scale: 0.8 + Math.random() * 0.4,
      delay: Math.random() * 3,
      duration: 15 + Math.random() * 10,
    }));
  }, [isMobile]);

  // Chart pattern elements
  const chartElements = useMemo(() => {
    const count = isMobile ? 4 : 6;
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      type: i % 2 === 0 ? 'candlestick' : 'line',
      x: Math.random() * 100,
      y: Math.random() * 100,
      width: 60 + Math.random() * 40,
      height: 40 + Math.random() * 30,
      delay: Math.random() * 2,
    }));
  }, [isMobile]);

  // Data flow particles
  const particles = useMemo(() => {
    const count = isMobile ? 15 : 25;
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
    }));
  }, [isMobile]);

  // Network connection lines
  const networkLines = useMemo(() => {
    const count = isMobile ? 3 : 5;
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x1: Math.random() * 100,
      y1: Math.random() * 100,
      x2: Math.random() * 100,
      y2: Math.random() * 100,
      delay: Math.random() * 3,
    }));
  }, [isMobile]);

  if (prefersReducedMotion) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        {/* Static fintech pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 hero-wave-overlay" />
        
        {/* Static currency symbols */}
        {currencySymbols.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="absolute text-primary/20 font-bold pointer-events-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: `${item.scale * 1.5}rem`,
            }}
          >
            {item.symbol}
          </div>
        ))}
        
        {/* Static chart pattern */}
        <div className="absolute inset-0 hero-chart-grid opacity-30" />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Enhanced background gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/8 to-primary/12" />
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-primary/8" />
      
      {/* Animated currency symbols */}
      {currencySymbols.map((item) => (
        <motion.div
          key={item.id}
          className="absolute text-primary/60 font-bold pointer-events-none drop-shadow-sm"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.scale * 1.5}rem`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            y: [-10, 10, -10],
            x: [-5, 5, -5],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          {item.symbol}
        </motion.div>
      ))}

      {/* Animated chart elements */}
      {chartElements.map((item) => (
        <motion.div
          key={item.id}
          className="absolute pointer-events-none"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.width}px`,
            height: `${item.height}px`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          {item.type === 'candlestick' ? (
            <div className="relative h-full w-full">
              <div className="absolute left-1/2 top-0 w-px h-full bg-primary/20 transform -translate-x-1/2" />
              <div className="absolute left-1/4 top-1/3 w-1/2 h-1/3 bg-primary/25 rounded-sm" />
            </div>
          ) : (
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <path
                d="M10,50 Q30,20 50,50 T90,30"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                opacity="0.25"
              />
            </svg>
          )}
        </motion.div>
      ))}

      {/* Data flow particles */}
      {particles.map((item) => (
        <motion.div
          key={item.id}
          className="absolute rounded-full bg-accent/70 pointer-events-none"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Network connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {networkLines.map((line) => (
          <motion.line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            opacity="0"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: line.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Pulse effects */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/25 pointer-events-none"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 0.15, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-3/4 right-1/4 w-24 h-24 rounded-full bg-accent/20 pointer-events-none"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          delay: 2,
          ease: "easeInOut",
        }}
      />

      {/* Overlay grid pattern */}
      <div className="absolute inset-0 hero-resource-grid opacity-20" />
      
      {/* Blur overlay to ensure form readability */}
      <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />
    </div>
  );
};