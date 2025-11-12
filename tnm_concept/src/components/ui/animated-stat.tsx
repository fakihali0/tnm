import { useEffect, useRef, useState } from "react";
import { motion, animate, useInView, useMotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type AnimatedStatProps = {
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
};

export function AnimatedStat({ 
  target, 
  prefix = "",
  suffix = "", 
  decimals = 0, 
  duration = 1.4 
}: AnimatedStatProps) {
  // Handle null/undefined target values
  const safeTarget = target ?? 0;
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { amount: 0.5, once: true });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState("0");
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!motionValue) {
      console.warn('AnimatedStat: motionValue is null, skipping animation setup');
      return;
    }

    try {
      const unsubscribe = motionValue.on("change", (latest) => {
        if (typeof latest === 'number' && !isNaN(latest)) {
          setDisplay(latest.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }));
        }
      });
      return () => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('AnimatedStat: Error during cleanup:', error);
        }
      };
    } catch (error) {
      console.warn('AnimatedStat: Error setting up motion value listener:', error);
      // Fallback to immediate display
      setDisplay(safeTarget.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }));
    }
  }, [motionValue, decimals, target]);

  useEffect(() => {
    if (isInView) {
      if (prefersReducedMotion) {
        // Skip animation and show final value immediately
        setDisplay(safeTarget.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }));
        return;
      }

      if (!motionValue) {
        console.warn('AnimatedStat: motionValue is null, falling back to immediate display');
        setDisplay(safeTarget.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }));
        return;
      }

      try {
        const controls = animate(motionValue, safeTarget, {
          duration,
          ease: "easeOut",
        });
        return controls?.stop;
      } catch (error) {
        console.warn('AnimatedStat animation failed:', error);
        // Fallback to immediate value display
        setDisplay(safeTarget.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }));
      }
    }
  }, [isInView, safeTarget, motionValue, duration, prefersReducedMotion, decimals]);

  return (
    <motion.span 
      ref={ref}
      aria-live="polite"
      aria-label={`${prefix}${safeTarget}${suffix}`}
    >
      {prefix}{display}{suffix}
    </motion.span>
  );
}