import { useMemo } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type SuccessPathwayBackgroundProps = {
  prefersReducedMotion?: boolean;
  className?: string;
};

const SuccessPathwayBackground = ({
  prefersReducedMotion: prefersReducedMotionProp,
  className,
}: SuccessPathwayBackgroundProps) => {
  const fallbackPrefersReducedMotion = usePrefersReducedMotion();
  const shouldReduceMotion = prefersReducedMotionProp ?? fallbackPrefersReducedMotion;
  const isMobile = useIsMobile();

  const pathwayPoints = useMemo(
    () =>
      (isMobile
        ? [
            { x: 8, y: 85, size: 14, level: 1, delay: 0 },
            { x: 20, y: 70, size: 16, level: 2, delay: 0.4 },
            { x: 12, y: 55, size: 18, level: 3, delay: 0.8 },
            { x: 88, y: 45, size: 20, level: 4, delay: 1.2 },
            { x: 82, y: 25, size: 22, level: 5, delay: 1.6 },
            { x: 92, y: 15, size: 24, level: 6, delay: 2.0 }
          ]
        : [
            { x: 8, y: 85, size: 16, level: 1, delay: 0 },
            { x: 18, y: 75, size: 18, level: 2, delay: 0.3 },
            { x: 12, y: 65, size: 20, level: 3, delay: 0.6 },
            { x: 22, y: 55, size: 22, level: 4, delay: 0.9 },
            { x: 88, y: 45, size: 24, level: 5, delay: 1.2 },
            { x: 82, y: 35, size: 26, level: 6, delay: 1.5 },
            { x: 92, y: 25, size: 28, level: 7, delay: 1.8 },
            { x: 85, y: 15, size: 30, level: 8, delay: 2.1 }
          ]),
    [isMobile]
  );

  const achievementMarkers = useMemo(
    () =>
      (isMobile
        ? [
            { x: 85, y: 60, icon: "💰", text: "First Profit", delay: 1.0 },
            { x: 15, y: 35, icon: "🏆", text: "Challenge", delay: 1.8 },
            { x: 92, y: 25, icon: "📈", text: "Growth", delay: 2.4 }
          ]
        : [
            { x: 5, y: 50, icon: "💰", text: "First Profit", delay: 1.0 },
            { x: 88, y: 60, icon: "🎯", text: "Target Hit", delay: 1.6 },
            { x: 15, y: 30, icon: "🏆", text: "Challenge", delay: 2.2 },
            { x: 92, y: 40, icon: "📈", text: "Scale Up", delay: 2.8 },
            { x: 95, y: 20, icon: "💎", text: "Elite", delay: 3.4 }
          ]),
    [isMobile]
  );

  const pathCoordinates = useMemo(() => {
    if (pathwayPoints.length < 2) return "";
    let path = `M ${pathwayPoints[0].x} ${pathwayPoints[0].y}`;
    for (let i = 1; i < pathwayPoints.length; i++) {
      const current = pathwayPoints[i];
      const prev = pathwayPoints[i - 1];
      const cp1x = prev.x + (current.x - prev.x) * 0.5;
      const cp1y = prev.y;
      const cp2x = prev.x + (current.x - prev.x) * 0.5;
      const cp2y = current.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
    }
    return path;
  }, [pathwayPoints]);

  if (shouldReduceMotion) {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-amber-500/10 via-transparent to-primary/10",
          className
        )}
        aria-hidden
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="static-pathway" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.3)" />
              <stop offset="50%" stopColor="rgba(251, 191, 36, 0.4)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
            </linearGradient>
          </defs>
          <path
            d={pathCoordinates}
            stroke="url(#static-pathway)"
            strokeWidth={isMobile ? 2 : 3}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        
        {pathwayPoints.map((point, index) => (
          <div
            key={`point-${index}`}
            className="absolute flex items-center justify-center rounded-full border-2 border-amber-400/50 bg-gradient-to-br from-amber-400/70 to-yellow-500/70 text-white font-bold text-xs shadow-lg"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: point.size,
              height: point.size,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {point.level}
          </div>
        ))}

        {achievementMarkers.map((marker, index) => (
          <div
            key={`marker-${index}`}
            className="absolute rounded-lg border border-amber-200/30 bg-white/90 px-2 py-1 text-xs font-medium text-amber-800 shadow-sm backdrop-blur"
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="mr-1">{marker.icon}</span>
            {marker.text}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-amber-500/5 via-transparent to-primary/5",
        className
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-t from-amber-400/3 via-transparent to-transparent" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="pathway-gradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.4)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.6)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.4)" />
          </linearGradient>
          <linearGradient id="glow-gradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.8)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.6)" />
          </linearGradient>
        </defs>
        
        <motion.path
          d={pathCoordinates}
          stroke="url(#pathway-gradient)"
          strokeWidth={isMobile ? 1 : 2}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1], 
            opacity: [0, 0.4, 0.3] 
          }}
          transition={{
            duration: 8,
            delay: 1,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />

        <motion.path
          d={pathCoordinates}
          stroke="url(#glow-gradient)"
          strokeWidth={isMobile ? 2 : 3}
          strokeLinecap="round"
          fill="none"
          opacity="0.15"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 0.2] }}
          transition={{
            duration: 6,
            delay: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </svg>

      {pathwayPoints.map((point, index) => (
        <motion.div
          key={`point-${index}`}
          className="absolute flex items-center justify-center rounded-full border border-amber-400/30 bg-gradient-to-br from-amber-400/40 to-yellow-500/40 text-white font-medium text-xs shadow-sm"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: point.size,
            height: point.size,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1], 
            opacity: [0, 0.6]
          }}
          transition={{
            duration: 1,
            delay: point.delay,
            repeat: Infinity,
            repeatDelay: 12,
            ease: "easeOut",
          }}
        >
          <motion.span
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              delay: point.delay + 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {point.level}
          </motion.span>
        </motion.div>
      ))}

      {achievementMarkers.map((marker, index) => (
        <motion.div
          key={`marker-${index}`}
          className="absolute flex items-center gap-1 rounded-lg border border-amber-200/20 bg-white/60 px-2 py-1 text-xs font-medium text-amber-700 shadow-sm backdrop-blur"
          style={{
            left: `${marker.x}%`,
            top: `${marker.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0, 0.5], 
            scale: [0.8, 1]
          }}
          transition={{
            duration: 1.5,
            delay: marker.delay,
            repeat: Infinity,
            repeatDelay: 10,
            ease: "easeOut",
          }}
        >
          <span className="text-sm opacity-70">
            {marker.icon}
          </span>
          {marker.text}
        </motion.div>
      ))}

      {/* Subtle floating particles */}
      {[...Array(isMobile ? 2 : 3)].map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute w-1 h-1 bg-gradient-to-br from-amber-400/40 to-yellow-500/40 rounded-full opacity-30"
          style={{
            left: `${index % 2 === 0 ? Math.random() * 20 + 5 : Math.random() * 20 + 80}%`,
            top: `${80 + Math.random() * 15}%`,
          }}
          animate={{
            y: [-10, -40 - Math.random() * 20],
            x: [0, (Math.random() - 0.5) * 15],
            opacity: [0, 0.3, 0],
            scale: [0, 0.8, 0.3],
          }}
          transition={{
            duration: 6 + Math.random() * 3,
            delay: Math.random() * 4,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export default SuccessPathwayBackground;