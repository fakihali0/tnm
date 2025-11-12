import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EnhancedCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  accent: string;
  floatAnimation?: {
    y: number[];
    rotate: number[];
    duration: number;
    delay: number;
  };
  prefersReducedMotion: boolean;
  variants: any;
  isMobile?: boolean;
}

export function EnhancedCard({
  icon: Icon,
  title,
  description,
  gradient,
  accent,
  floatAnimation,
  prefersReducedMotion,
  variants,
  isMobile = false
}: EnhancedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { stiffness: 200, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-100, 100], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-100, 100], [-15, 15]), springConfig);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || isMobile || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (prefersReducedMotion) return;
    mouseX.set(0);
    mouseY.set(0);
  };

  const floatingProps = (prefersReducedMotion || isMobile || !floatAnimation)
    ? {}
    : {
        animate: {
          y: floatAnimation.y,
          rotate: floatAnimation.rotate,
          scale: [1, 1.01, 1]
        },
        transition: {
          duration: floatAnimation.duration * 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: floatAnimation.delay
        }
      };

  const cardStyle = (prefersReducedMotion || isMobile)
    ? {} 
    : {
        rotateX,
        rotateY,
        transformStyle: "preserve-3d" as const,
      };

  return (
    <motion.div variants={variants}>
      <motion.div
        ref={cardRef}
        className="relative group h-full perspective-1000"
        {...floatingProps}
        style={cardStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={(prefersReducedMotion || isMobile) ? {} : { scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        {/* Simplified glow effect - desktop only */}
        {!prefersReducedMotion && !isMobile && (
          <motion.div
            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 blur-sm hidden sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.8 : 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Simplified border effect - desktop only */}
        {!prefersReducedMotion && !isMobile && (
          <motion.div
            className="absolute inset-0 rounded-2xl border border-primary/20 hidden sm:block"
            animate={{
              borderColor: isHovered 
                ? "hsl(var(--primary) / 0.4)"
                : "hsl(var(--primary) / 0.1)"
            }}
            transition={{ duration: 0.3 }}
          />
        )}

        <Card className={`relative trading-card h-full bg-gradient-to-br ${gradient} border border-white/10 shadow-lg backdrop-blur overflow-hidden`}>
          {/* Simplified shimmer effect - desktop only */}
          {!prefersReducedMotion && !isMobile && (
            <motion.div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent hidden sm:block"
              animate={isHovered ? { x: ["100%", "200%"] } : {}}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}

          <CardHeader className="relative space-y-3 z-10">
            {/* Simplified icon with minimal animation */}
            <motion.span 
              className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full shadow-md ${accent} relative overflow-hidden`}
              animate={(prefersReducedMotion || isMobile) ? {} : {
                boxShadow: [
                  "0 2px 10px hsl(var(--primary) / 0.2)",
                  "0 4px 15px hsl(var(--primary) / 0.3)",
                  "0 2px 10px hsl(var(--primary) / 0.2)"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Simplified icon glow - desktop only */}
              {!prefersReducedMotion && !isMobile && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full hidden sm:block"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2] 
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              
              <motion.div
                animate={(prefersReducedMotion || isMobile) ? {} : { rotate: [0, 2, -2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
              </motion.div>
            </motion.span>

            {/* Simplified typography */}
            <motion.div
              animate={(prefersReducedMotion || isMobile) ? {} : { y: [0, -1, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <CardTitle className="font-poppins text-lg sm:text-xl group-hover:text-primary transition-colors duration-300">
                {title}
              </CardTitle>
            </motion.div>

            <motion.div
              animate={(prefersReducedMotion || isMobile) ? {} : { y: [0, 0.5, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            </motion.div>
          </CardHeader>

          {/* Simplified particle effect - desktop only */}
          {!prefersReducedMotion && !isMobile && isHovered && (
            <motion.div
              className="absolute top-4 right-4 w-1.5 h-1.5 bg-primary/30 rounded-full hidden sm:block"
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}