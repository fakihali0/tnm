import React from "react";
import { motion } from "framer-motion";

interface AnimatedTextProps {
  text: string;
  className?: string;
  variant?: "title" | "description" | "highlight";
  prefersReducedMotion: boolean;
  delay?: number;
}

export function AnimatedText({ 
  text, 
  className = "", 
  variant = "description", 
  prefersReducedMotion,
  delay = 0 
}: AnimatedTextProps) {
  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const words = text.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: variant === "title" ? 0.08 : 0.04,
        delayChildren: delay
      }
    }
  };

  const wordVariants = {
    hidden: { 
      opacity: 0,
      y: variant === "title" ? 30 : 20,
      rotateX: variant === "title" ? -90 : 0
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: variant === "title" ? 100 : 150,
        damping: variant === "title" ? 12 : 15
      }
    }
  };

  if (variant === "highlight") {
    return (
      <motion.span
        className={className}
        initial={{ backgroundSize: "0% 100%" }}
        animate={{ backgroundSize: "100% 100%" }}
        transition={{ duration: 1, delay: delay + 0.5, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(120deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--accent) / 0.2) 100%)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0% 0%"
        }}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block mr-1"
          style={{ transformOrigin: "bottom" }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

interface TypewriterTextProps {
  text: string;
  className?: string;
  prefersReducedMotion: boolean;
  delay?: number;
  speed?: number;
}

export function TypewriterText({ 
  text, 
  className = "", 
  prefersReducedMotion,
  delay = 0,
  speed = 50 
}: TypewriterTextProps) {
  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  return (
    <motion.span
      className={className}
      initial={{ width: 0 }}
      animate={{ width: "auto" }}
      transition={{ 
        duration: text.length * speed / 1000, 
        delay,
        ease: "easeInOut" 
      }}
      style={{ 
        overflow: "hidden",
        whiteSpace: "nowrap",
        ...(isRTL ? {} : { borderRight: "2px solid hsl(var(--primary))" })
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {text}
      {!isRTL && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            delay: text.length * speed / 1000 + delay 
          }}
        >
          |
        </motion.span>
      )}
    </motion.span>
  );
}