import { useMemo } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Euro, PoundSterling } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";

type TradingAnimationsProps = {
  prefersReducedMotion?: boolean;
  isMobile?: boolean;
};

const TradingAnimations = ({ prefersReducedMotion, isMobile: isMobileProp }: TradingAnimationsProps) => {
  const fallbackPrefersReducedMotion = usePrefersReducedMotion();
  const fallbackIsMobile = useIsMobile();

  const shouldReduceMotion = prefersReducedMotion ?? fallbackPrefersReducedMotion;
  const isMobile = isMobileProp ?? fallbackIsMobile;

  const symbols = useMemo(
    () => [
      { Icon: DollarSign, delay: 0, x: "10%", y: "20%" },
      { Icon: Euro, delay: 2, x: "80%", y: "15%" },
      { Icon: PoundSterling, delay: 4, x: "15%", y: "70%" },
      { Icon: DollarSign, delay: 6, x: "75%", y: "65%" },
    ],
    []
  );

  const chartElements = useMemo(
    () => [
      { Icon: BarChart3, delay: 1, x: "25%", y: "25%" },
      { Icon: TrendingUp, delay: 3, x: "70%", y: "30%" },
      { Icon: TrendingDown, delay: 5, x: "20%", y: "55%" },
      { Icon: BarChart3, delay: 7, x: "85%", y: "75%" },
    ],
    []
  );

  const maxParticles = 8;

  const particlePositions = useMemo(
    () =>
      Array.from({ length: maxParticles }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
      })),
    []
  );

  const particles = useMemo(
    () =>
      Array.from({ length: isMobile ? 4 : maxParticles }, (_, i) => ({
        id: i,
        delay: i * 0.5,
      })),
    [isMobile]
  );

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute inset-0">
          {symbols.slice(0, 3).map((symbol, index) => (
            <div
              key={`static-symbol-${index}`}
              className="absolute text-primary/20"
              style={{ left: symbol.x, top: symbol.y }}
            >
              <symbol.Icon size={24} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeSymbols = isMobile ? symbols.slice(0, 3) : symbols;
  const activeCharts = isMobile ? chartElements.slice(0, 3) : chartElements;
  const pulseIds = isMobile ? [1, 2] : [1, 2, 3];
  const lineIds = isMobile ? [1, 2] : [1, 2, 3];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Floating Currency Symbols */}
      {activeSymbols.map((symbol, index) => (
        <motion.div
          key={`symbol-${index}`}
          className="absolute text-primary/30"
          style={{ left: symbol.x, top: symbol.y }}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.2, 0.8],
            y: [20, -20, 20],
          }}
          transition={{
            duration: 6,
            delay: symbol.delay * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <symbol.Icon size={24} />
        </motion.div>
      ))}

      {/* Trading Chart Elements */}
      {activeCharts.map((chart, index) => (
        <motion.div
          key={`chart-${index}`}
          className="absolute text-accent/25"
          style={{ left: chart.x, top: chart.y }}
          initial={{ opacity: 0, rotate: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            rotate: [0, 180, 360],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 8,
            delay: chart.delay * 0.3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <chart.Icon size={20} />
        </motion.div>
      ))}

      {/* Market Data Particles */}
      {particles.map((particle) => {
        const position = particlePositions[particle.id];

        return (
          <motion.div
            key={`particle-${particle.id}`}
            className="absolute w-2 h-2 bg-primary/40 rounded-full"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            initial={{ scale: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 4,
              delay: particle.delay * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Pulse Circles */}
      {pulseIds.map((circle) => (
        <motion.div
          key={`pulse-${circle}`}
          className="absolute w-32 h-32 border border-primary/20 rounded-full"
          style={{
            left: `${20 + circle * 25}%`,
            top: `${30 + circle * 15}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 2, 0],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 6,
            delay: circle * 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Network Connection Lines */}
      <svg className="absolute inset-0 w-full h-full">
        {lineIds.map((line) => (
          <motion.path
            key={`line-${line}`}
            d={`M${20 + line * 20},${30 + line * 10} Q${50 + line * 15},${20 + line * 20} ${80 - line * 10},${60 + line * 15}`}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            fill="none"
            opacity="0.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 5,
              delay: line * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default TradingAnimations;