import { motion } from "framer-motion";

interface HeroBackgroundProps {
  prefersReducedMotion: boolean;
  animationConfig?: {
    shouldAnimate: boolean;
    isReady: boolean;
    opacity: number;
    transition: any;
  };
  // Optional delay (in seconds) before the background fades in
  delaySec?: number;
}

const baseFadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, delay: 0.1 }
};

export function WebinarsHeroBackground({
  prefersReducedMotion,
  animationConfig = { shouldAnimate: true, isReady: true, opacity: 1, transition: { duration: 0.3 } },
  delaySec = 0
}: HeroBackgroundProps) {
  const videoIcons = ["🎥", "📹", "💻", "🎬", "📺", "🖥️", "📱", "⏯️"];
  const shouldAnimateBackground = animationConfig.shouldAnimate;
  const backgroundOpacity = typeof animationConfig.opacity === "number" ? animationConfig.opacity : 1;
  const initialBackgroundState = shouldAnimateBackground
    ? { opacity: 0 }
    : { opacity: backgroundOpacity };
  const transitionFromConfig = animationConfig.transition ?? {};
  const backgroundTransition = shouldAnimateBackground
    ? {
        ...transitionFromConfig,
        duration: Math.max(transitionFromConfig.duration ?? 0.9, 0.9),
        ease: transitionFromConfig.ease ?? "easeOut",
        delay: prefersReducedMotion ? 0 : (delaySec ?? 0)
      }
    : { duration: 0 };

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 z-0 pointer-events-none opacity-0"
      initial={initialBackgroundState}
      animate={{ opacity: backgroundOpacity }}
      transition={backgroundTransition}
      inherit={false}
    >
      {/* Much more visible floating video icons - positioned away from center title area */}
      {videoIcons.map((icon, index) => (
        <motion.div
          key={index}
          className="absolute text-5xl select-none pointer-events-none"
          style={{
            left: index < 4 ? `${5 + index * 8}%` : `${75 + (index - 4) * 8}%`,
            top: `${15 + (index % 4) * 20}%`,
          }}
          initial={{ opacity: 0.9, scale: 1, x: 0, y: 0, rotate: 0 }}
          animate={
            prefersReducedMotion || !shouldAnimateBackground
              ? { opacity: 0.9, scale: 1, x: 0, y: 0, rotate: 0 }
              : {
                  opacity: 0.9,
                  scale: [1, 1.1, 1],
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0],
                  x: [0, Math.sin(index) * 15, 0]
                }
          }
          transition={{
            duration: shouldAnimateBackground ? 6 + index * 1.5 : 0,
            ease: "easeInOut",
            repeat: (prefersReducedMotion || !shouldAnimateBackground) ? 0 : Infinity,
            delay: 0
          }}
          inherit={false}
        >
          <span 
            className="text-primary/90 dark:text-primary/80 filter drop-shadow-lg"
            style={{
              textShadow: "0 0 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.1)"
            }}
          >
            {icon}
          </span>
        </motion.div>
      ))}

      {/* Floating geometric shapes for more visibility - positioned away from center */}
      {[...Array(8)].map((_, index) => (
        <motion.div
          key={`shape-${index}`}
          className="absolute w-6 h-6 rounded-full bg-primary/70 dark:bg-primary/60 shadow-lg shadow-primary/40"
          style={{
            left: index < 4 ? `${8 + index * 7}%` : `${70 + (index - 4) * 7}%`,
            top: `${25 + (index % 3) * 25}%`,
            boxShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 4px 10px hsl(var(--primary) / 0.2)"
          }}
          initial={{ opacity: 0.75, scale: 1, x: 0, y: 0 }}
          animate={
            prefersReducedMotion || !shouldAnimateBackground
              ? { opacity: 0.75, scale: 1, x: 0, y: 0 }
              : {
                  opacity: 0.75,
                  scale: [1, 1.1, 1],
                  y: [0, -20, 0],
                  x: [0, Math.cos(index) * 12, 0]
                }
          }
          transition={{
            duration: shouldAnimateBackground ? 5 + index * 0.8 : 0,
            ease: "easeInOut",
            repeat: (prefersReducedMotion || !shouldAnimateBackground) ? 0 : Infinity,
            delay: 0
          }}
          inherit={false}
        />
      ))}
      
      {/* Enhanced wave overlay with more visibility */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.5, backgroundPositionX: "0%" }}
        animate={
          prefersReducedMotion || !shouldAnimateBackground
            ? { opacity: 0.5, backgroundPositionX: "0%" }
            : { 
                backgroundPositionX: ["0%", "120%"],
                opacity: 0.5
              }
        }
        transition={{
          duration: shouldAnimateBackground ? 12 : 0,
          ease: "linear",
          repeat: (prefersReducedMotion || !shouldAnimateBackground) ? 0 : Infinity
        }}
        style={{ 
          backgroundSize: "200% 200%",
          backgroundImage: "linear-gradient(45deg, transparent 30%, hsl(var(--primary)/0.2) 50%, transparent 70%)"
        }}
        inherit={false}
      />
      
      {/* Enhanced blur gradient with glow effect */}
      <motion.div
        className="absolute -inset-x-40 top-1/2 h-[180%] w-[160%] -translate-y-1/2 blur-3xl"
        style={{
          background: "radial-gradient(ellipse, hsl(var(--primary)/0.3) 0%, hsl(var(--accent)/0.2) 30%, transparent 70%)"
        }}
        initial={{ x: "0%", opacity: 0.5 }}
        animate={
          prefersReducedMotion || !shouldAnimateBackground
            ? { x: "0%", opacity: 0.5 } 
            : { 
                x: ["-8%", "8%", "-8%"],
                opacity: 0.5,
                scale: [1, 1.1, 1]
              }
        }
        transition={{
          duration: shouldAnimateBackground ? 10 : 0,
          ease: "easeInOut",
          repeat: (prefersReducedMotion || !shouldAnimateBackground) ? 0 : Infinity
        }}
        inherit={false}
      />
      
      {/* Minimal overlay to preserve contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/15 dark:from-background/5 dark:via-transparent dark:to-background/10" />
    </motion.div>
  );
}

export function ResourcesHeroBackground({
  prefersReducedMotion,
  animationConfig = { shouldAnimate: true, isReady: true, opacity: 1, transition: { duration: 0.3 } },
  delaySec = 0
}: HeroBackgroundProps) {
  const layers = [
    { rotate: -6, offset: -70, opacity: 0.25, scale: 1.05, delay: 0 },
    { rotate: 0, offset: -50, opacity: 0.35, scale: 1, delay: 0.1 },
    { rotate: 7, offset: -30, opacity: 0.28, scale: 0.95, delay: 0.2 }
  ];

  const floatingElements = ["📚", "📖", "📝", "💡", "🎯", "📊"];
  const shouldAnimateBackground = animationConfig.shouldAnimate;
  const backgroundOpacity = typeof animationConfig.opacity === "number" ? animationConfig.opacity : 1;
  const initialBackgroundState = shouldAnimateBackground
    ? { opacity: 0 }
    : { opacity: backgroundOpacity };
  const transitionFromConfig = animationConfig.transition ?? {};
  const backgroundTransition = shouldAnimateBackground
    ? {
        ...transitionFromConfig,
        duration: Math.max(transitionFromConfig.duration ?? 0.9, 0.9),
        ease: transitionFromConfig.ease ?? "easeOut",
        delay: prefersReducedMotion ? 0 : (delaySec ?? 0)
      }
    : { duration: 0 };

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 z-0 pointer-events-none opacity-0"
      initial={initialBackgroundState}
      animate={{ opacity: backgroundOpacity }}
      transition={backgroundTransition}
      inherit={false}
    >
      {/* Floating educational icons */}
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl select-none pointer-events-none"
          style={{
            left: `${15 + index * 12}%`,
            top: `${20 + (index % 3) * 25}%`,
          }}
          initial={{ opacity: 0.7, y: 0, rotate: 0, scale: 1 }}
          animate={
            prefersReducedMotion || !shouldAnimateBackground
              ? { opacity: 0.7, y: 0, rotate: 0, scale: 1 }
              : {
                  opacity: 0.7,
                  y: [0, -25, 0],
                  rotate: [0, 12, -12, 0],
                  scale: [1, 1.05, 1]
                }
          }
          transition={{
            duration: shouldAnimateBackground ? 7 + index * 1.5 : 0,
            ease: "easeInOut",
            repeat: (prefersReducedMotion || !shouldAnimateBackground) ? 0 : Infinity,
            delay: 0
          }}
          inherit={false}
        >
          <span 
            className="text-primary/80 dark:text-primary/70 filter drop-shadow-lg"
            style={{
              textShadow: "0 0 15px hsl(var(--primary) / 0.3), 0 0 30px hsl(var(--primary) / 0.1)"
            }}
          >
            {element}
          </span>
        </motion.div>
      ))}

      {/* Enhanced floating sheets */}
      {layers.map((layer, index) => (
        <motion.div
          key={index}
          className="absolute left-1/2 top-1/2 h-[22rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-primary/30 dark:border-primary/20"
          style={{
            opacity: layer.opacity + 0.2,
            marginTop: layer.offset,
            background: "linear-gradient(135deg, hsl(var(--primary)/0.25), hsl(var(--accent)/0.3), hsl(var(--primary)/0.2))",
            boxShadow: "0 20px 40px -10px hsl(var(--primary) / 0.2), 0 0 30px hsl(var(--primary) / 0.1)"
          }}
          initial={{ rotate: layer.rotate, scale: layer.scale, y: 0, opacity: layer.opacity + 0.2 }}
          animate={
            prefersReducedMotion || !shouldAnimateBackground
              ? { rotate: layer.rotate, scale: layer.scale, opacity: layer.opacity + 0.2 }
              : {
                  rotate: [layer.rotate, layer.rotate + 1.5, layer.rotate],
                  scale: [layer.scale, layer.scale + 0.03, layer.scale],
                  y: [0, -10, 0],
                  opacity: layer.opacity + 0.2
                }
          }
          transition={{
            duration: shouldAnimateBackground ? 12 + index * 2 : 0,
            ease: "easeInOut",
            repeat: (prefersReducedMotion || !shouldAnimateBackground) ? 0 : Infinity,
            delay: 0
          }}
          inherit={false}
        />
      ))}

      {/* Subtle background gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsl(var(--primary)/0.08), hsl(var(--accent)/0.12), hsl(var(--primary)/0.08))"
        }}
        initial={{ opacity: 0.6 }}
        animate={
          prefersReducedMotion || !shouldAnimateBackground
            ? { opacity: 0.6 }
            : { opacity: 0.6 }
        }
        transition={{
          duration: shouldAnimateBackground ? 8 : 0,
          ease: "easeInOut",
          repeat: (prefersReducedMotion || !shouldAnimateBackground) ? 0 : Infinity
        }}
        inherit={false}
      />
      
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/80 via-background/40 to-transparent dark:from-background/90 dark:via-background/50" />
    </motion.div>
  );
}

export function MarketReportsHeroBackground({ prefersReducedMotion }: HeroBackgroundProps) {
  const chartLines = [
    {
      d: "M24 268 C 140 210 210 228 324 176 C 420 132 538 206 636 168 C 716 136 784 194 820 176",
      stroke: "hsl(var(--primary)/0.55)",
      points: [
        { cx: 120, cy: 216, label: "+3.2%" },
        { cx: 324, cy: 176, label: "+5.4%" },
        { cx: 540, cy: 204, label: "+4.1%" },
        { cx: 720, cy: 188, label: "+6.0%" }
      ],
      delay: 0
    },
    {
      d: "M24 302 C 150 276 246 296 366 248 C 470 206 558 268 660 226 C 730 196 790 230 820 220",
      stroke: "hsl(var(--accent)/0.45)",
      points: [
        { cx: 168, cy: 284, label: "+1.8%" },
        { cx: 366, cy: 248, label: "+2.6%" },
        { cx: 558, cy: 270, label: "+3.1%" },
        { cx: 760, cy: 236, label: "+2.9%" }
      ],
      delay: 0.8
    },
    {
      d: "M24 236 C 126 178 210 152 312 130 C 438 104 552 134 656 112 C 744 94 802 118 820 124",
      stroke: "hsl(var(--muted-foreground)/0.35)",
      points: [
        { cx: 96, cy: 188, label: "Q1" },
        { cx: 260, cy: 146, label: "Q2" },
        { cx: 480, cy: 144, label: "Q3" },
        { cx: 704, cy: 122, label: "Q4" }
      ],
      delay: 1.6
    }
  ];

  const gridHorizontals = [60, 120, 180, 240, 300];
  const gridVerticals = [160, 320, 480, 640];

  const getLineMotion = (delay: number) =>
    prefersReducedMotion
      ? { animate: { opacity: 0.5, y: 0 } }
      : {
          animate: { opacity: [0.4, 0.65, 0.5], y: [0, -8, 0] },
          transition: {
            duration: 14,
            ease: "easeInOut",
            repeat: Infinity,
            delay
          }
        };

  const getPointMotion = (index: number) =>
    prefersReducedMotion
      ? { animate: { scale: 1, y: 0 } }
      : {
          animate: { scale: [1, 1.15, 1], y: [0, -6, 0] },
          transition: {
            duration: 6 + index,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1.5,
            delay: index * 0.2
          }
        };

  const getLabelMotion = (delay: number) =>
    prefersReducedMotion
      ? { animate: { opacity: 0.45 } }
      : {
          animate: { opacity: [0.35, 0.6, 0.45] },
          transition: {
            duration: 10,
            ease: "easeInOut",
            repeat: Infinity,
            delay
          }
        };

  const sentimentLabelMotion = getLabelMotion(0.5);

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 z-0 pointer-events-none"
      {...baseFadeIn}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/30 to-background/10 dark:from-background/70 dark:via-background/40 dark:to-background/20" />

      <motion.svg
        viewBox="0 0 840 360"
        className="absolute inset-x-0 bottom-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="market-line-glow" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary)/0.15)" />
            <stop offset="100%" stopColor="hsl(var(--accent)/0.05)" />
          </linearGradient>
        </defs>

        <path
          d="M24 60 H 820"
          stroke="url(#market-line-glow)"
          strokeWidth="1"
          fill="none"
        />

        {gridHorizontals.map((y, idx) => (
          <path
            key={`grid-h-${y}`}
            d={`M24 ${y} H 820`}
            stroke="hsl(var(--muted-foreground)/0.18)"
            strokeWidth={idx === gridHorizontals.length - 1 ? 1.2 : 0.8}
            strokeDasharray="4 8"
            fill="none"
          />
        ))}

        {gridVerticals.map(x => (
          <path
            key={`grid-v-${x}`}
            d={`M${x} 48 V 320`}
            stroke="hsl(var(--muted-foreground)/0.14)"
            strokeWidth="0.8"
            strokeDasharray="2 12"
            fill="none"
          />
        ))}

        {chartLines.map((line, lineIndex) => {
          const lineMotion = getLineMotion(line.delay);

          return (
            <motion.g
              key={line.d}
              initial={{ opacity: 0.35 }}
              animate={lineMotion.animate}
              transition={lineMotion.transition}
            >
              <motion.path
                d={line.d}
                fill="none"
                stroke={line.stroke}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 2.8,
                  ease: "easeOut",
                  delay: prefersReducedMotion ? 0 : 0.6 + lineIndex * 0.25
                }}
              />

              {line.points.map((point, pointIndex) => {
                const pointMotion = getPointMotion(pointIndex);
                const labelMotion = getLabelMotion(line.delay + pointIndex * 0.2);

                return (
                  <g key={`${lineIndex}-${point.cx}-${point.cy}`}>
                    <motion.circle
                      cx={point.cx}
                      cy={point.cy}
                      r={6}
                      fill="hsl(var(--background))"
                      stroke={line.stroke}
                      strokeWidth={2}
                      initial={{ scale: 0.9, opacity: 0.9 }}
                      animate={pointMotion.animate}
                      transition={pointMotion.transition}
                    />
                    <motion.text
                      x={point.cx}
                      y={point.cy - 16}
                      textAnchor="middle"
                      className="font-medium text-xs tracking-widest"
                      fill="hsl(var(--foreground)/0.55)"
                      initial={{ opacity: 0 }}
                      animate={labelMotion.animate}
                      transition={labelMotion.transition}
                    >
                      {point.label}
                    </motion.text>
                  </g>
                );
              })}
            </motion.g>
          );
        })}

        <motion.text
          x={760}
          y={70}
          textAnchor="end"
          className="font-mono text-[11px] uppercase tracking-[0.4em]"
          fill="hsl(var(--muted-foreground)/0.4)"
          initial={{ opacity: 0 }}
          animate={sentimentLabelMotion.animate}
          transition={sentimentLabelMotion.transition}
        >
          MARKET SENTIMENT INDEX
        </motion.text>
      </motion.svg>

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent dark:from-background/90" />
    </motion.div>
  );
}

export function BlogsHeroBackground({ prefersReducedMotion }: HeroBackgroundProps) {
  const motif = "INSIGHTS • STRATEGY • STORIES";

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 z-0 pointer-events-none"
      {...baseFadeIn}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/50 to-background/70 dark:from-background/30 dark:via-background/50 dark:to-background/70" />
      <div className="absolute inset-0 overflow-hidden">
        {[0, 1].map(row => (
          <motion.div
            key={row}
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-12 font-poppins text-sm uppercase tracking-[0.65em] text-primary/55 dark:text-primary/40 pointer-events-none select-none drop-shadow-[0_12px_24px_rgba(79,70,229,0.18)]"
            style={{ top: `${30 + row * 22}%` }}
            animate={
              prefersReducedMotion
                ? { opacity: 0.35 }
                : { x: row % 2 === 0 ? ["-5%", "5%", "-5%"] : ["5%", "-5%", "5%"] }
            }
            transition={{
              duration: 18 + row * 4,
              ease: "easeInOut",
              repeat: prefersReducedMotion ? 0 : Infinity
            }}
          >
            <span className="bg-gradient-to-r from-primary/60 via-accent/60 to-primary/60 bg-clip-text text-transparent">
              {motif}
            </span>
            <span className="bg-gradient-to-r from-primary/60 via-accent/60 to-primary/60 bg-clip-text text-transparent">
              {motif}
            </span>
            <span className="bg-gradient-to-r from-primary/60 via-accent/60 to-primary/60 bg-clip-text text-transparent">
              {motif}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/85 to-transparent dark:from-background/95" />
    </motion.div>
  );
}
