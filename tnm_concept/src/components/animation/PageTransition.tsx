import { forwardRef, useEffect, useRef } from "react";
import { HTMLMotionProps, Transition, Variants, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import { cn } from "@/lib/utils";

let hasPageTransitionCommitted = false;

const springTransition: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.9,
  opacity: { duration: 0.25 },
};

const reducedTransition: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

const defaultVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const pageMotionStates = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
} as const;

export const usePageMotion = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return {
    variants: prefersReducedMotion ? reducedMotionVariants : defaultVariants,
    transition: prefersReducedMotion ? reducedTransition : springTransition,
    states: pageMotionStates,
  };
};

type PageTransitionProps = HTMLMotionProps<"div">;

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({
    className,
    children,
    variants: variantsProp,
    transition: transitionProp,
    ...rest
  }, ref) => {
    const { variants, transition, states } = usePageMotion();
    const initialStateRef = useRef(
      hasPageTransitionCommitted ? states.initial : states.animate,
    );

    useEffect(() => {
      if (hasPageTransitionCommitted) {
        return;
      }

      const frame = requestAnimationFrame(() => {
        hasPageTransitionCommitted = true;
      });

      return () => cancelAnimationFrame(frame);
    }, []);

    return (
      <motion.div
        ref={ref}
        className={cn("h-full w-full", className)}
        initial={initialStateRef.current}
        animate={states.animate}
        exit={states.exit}
        variants={variantsProp ?? variants}
        transition={transitionProp ?? transition}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = "PageTransition";
