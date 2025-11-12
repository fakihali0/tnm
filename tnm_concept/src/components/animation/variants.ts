import type { Transition, Variants } from "framer-motion";

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

type RevealOptions = {
  direction?: RevealDirection;
  distance?: number;
  transition?: Transition;
};

type StaggerOptions = {
  stagger?: number;
  delayChildren?: number;
  enabled?: boolean;
};

const directionOffsets: Record<Exclude<RevealDirection, "none">, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 }
};

export const baseTransition: Transition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1]
};

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 1, x: 0, y: 0 },
  visible: { opacity: 1, x: 0, y: 0 }
};

export const createRevealVariants = (
  options: RevealOptions = {}
): Variants => {
  const { direction = "up", distance = 40, transition } = options;

  if (direction === "none") {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: transition ?? baseTransition
      }
    };
  }

  const offset = directionOffsets[direction];
  return {
    hidden: {
      opacity: 0,
      x: offset.x * distance,
      y: offset.y * distance
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: transition ?? baseTransition
    }
  };
};

export const createStaggerContainer = (
  options: StaggerOptions = {}
): Variants => {
  const { stagger = 0.12, delayChildren = 0, enabled = true } = options;
  return {
    hidden: {},
    visible: {
      transition: enabled
        ? {
            staggerChildren: stagger,
            delayChildren
          }
        : {}
    }
  };
};

export const resolveMotionVariants = (
  variants: Variants,
  prefersReducedMotion: boolean
): Variants => (prefersReducedMotion ? reducedMotionVariants : variants);
