import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  prefersReducedMotion: boolean;
  asChild?: boolean;
  [key: string]: any;
}

export function MagneticButton({
  children,
  className = "",
  variant = "default",
  size = "default",
  prefersReducedMotion,
  asChild,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 200, damping: 20 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [-50, 50], [10, -10]);
  const rotateY = useTransform(springX, [-50, 50], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Magnetic effect - stronger when closer
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    const maxDistance = 100;
    
    if (distance < maxDistance) {
      const strength = (maxDistance - distance) / maxDistance;
      x.set(distanceX * strength * 0.3);
      y.set(distanceY * strength * 0.3);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    if (prefersReducedMotion) return;
    x.set(0);
    y.set(0);
  };

  const buttonStyle = prefersReducedMotion 
    ? {} 
    : {
        x: springX,
        y: springY,
        rotateX,
        rotateY,
        transformPerspective: 1000,
      };

  if (prefersReducedMotion) {
    return (
      <Button
        className={className}
        variant={variant}
        size={size}
        asChild={asChild}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <motion.div
      className="inline-block"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      <motion.div
        ref={ref}
        style={buttonStyle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative"
      >
        {/* Ripple effect background */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20"
          initial={{ scale: 0, opacity: 0 }}
          animate={isPressed ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Gradient flow animation */}
        {variant === "default" && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]"
            animate={isHovered ? { backgroundPosition: "100% 0%" } : { backgroundPosition: "0% 0%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ zIndex: -1 }}
          />
        )}

        {/* Glow effect */}
        <motion.div
          className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/50 to-accent/50 blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.7 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ zIndex: -2 }}
        />

        <Button
          className={`relative z-10 ${className}`}
          variant={variant}
          size={size}
          asChild={asChild}
          {...props}
        >
          {children}
        </Button>

        {/* Success particle burst */}
        {isPressed && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  opacity: 1 
                }}
                animate={{
                  x: Math.cos(i * Math.PI / 3) * 30,
                  y: Math.sin(i * Math.PI / 3) * 30,
                  scale: [0, 1, 0],
                  opacity: [1, 0.7, 0]
                }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeOut",
                  delay: i * 0.05
                }}
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)"
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}