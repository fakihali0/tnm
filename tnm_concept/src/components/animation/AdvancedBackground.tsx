import React from "react";
import { motion } from "framer-motion";

interface AdvancedBackgroundProps {
  prefersReducedMotion: boolean;
}

export function AdvancedBackground({ prefersReducedMotion }: AdvancedBackgroundProps) {
  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient wave background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/3"
        animate={{ 
          background: [
            "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--background)) 50%, hsl(var(--primary) / 0.03) 100%)",
            "linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--background)) 50%, hsl(var(--accent) / 0.05) 100%)",
            "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--background)) 50%, hsl(var(--primary) / 0.03) 100%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Pulsing blur elements */}
      <motion.div
        className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
          x: [-20, 20, -20]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"
        animate={{ 
          scale: [1.1, 0.9, 1.1],
          opacity: [0.3, 0.6, 0.3],
          y: [-30, 30, -30]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Morphing geometric shapes */}
      <motion.div
        className="absolute top-1/4 left-12 w-32 h-32 bg-primary/5 blur-sm"
        style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}
        animate={{
          clipPath: [
            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            "polygon(20% 10%, 80% 0%, 90% 40%, 100% 80%, 60% 90%, 40% 100%, 10% 60%, 0% 20%)",
            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)"
          ],
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-1/4 right-12 w-24 h-24 bg-accent/5 blur-sm rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.7, 0.3],
          borderRadius: ["50%", "30%", "50%"]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Subtle parallax depth layers */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/2 to-transparent"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Screen edge glow effects */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </div>
  );
}