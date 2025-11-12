import { Fragment, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import { cn } from "@/lib/utils";

interface AnimatedPaymentIllustrationProps {
  labels: string[];
  className?: string;
}

type Point = { x: number; y: number };

type SourceIconComponent = (props: { color: string }) => JSX.Element;

interface SourceNode {
  id: string;
  title: string;
  label: string;
  color: string;
  accent: string;
  position: Point;
  control: Point;
  icon: SourceIconComponent;
}

const CENTER_POINT: Point = { x: 260, y: 200 };

const floatingLabelPositions: string[] = [
  "left-[10%] top-[12%]",
  "right-[12%] top-[16%]",
  "right-[10%] bottom-[18%]",
  "left-[12%] bottom-[16%]",
  "left-1/2 -translate-x-1/2 top-[4%]",
  "left-1/2 -translate-x-1/2 bottom-[6%]"
];

const sourceNodes: SourceNode[] = [
  {
    id: "wallet",
    title: "E-wallets",
    label: "E-wallets",
    color: "hsl(199, 95%, 62%)",
    accent: "hsl(199, 100%, 75%)",
    position: { x: 92, y: 126 },
    control: { x: 168, y: 78 },
    icon: WalletIcon
  },
  {
    id: "mobile",
    title: "Mobile payments",
    label: "Mobile apps",
    color: "hsl(267, 84%, 72%)",
    accent: "hsl(267, 100%, 82%)",
    position: { x: 428, y: 116 },
    control: { x: 344, y: 72 },
    icon: MobileIcon
  },
  {
    id: "card",
    title: "Credit & debit cards",
    label: "Cards",
    color: "hsl(214, 92%, 66%)",
    accent: "hsl(214, 100%, 78%)",
    position: { x: 108, y: 302 },
    control: { x: 176, y: 328 },
    icon: CardIcon
  },
  {
    id: "bank",
    title: "Bank transfers",
    label: "Bank transfer",
    color: "hsl(151, 73%, 58%)",
    accent: "hsl(151, 84%, 70%)",
    position: { x: 420, y: 308 },
    control: { x: 340, y: 332 },
    icon: BankIcon
  }
];

const centralPanel = {
  x: CENTER_POINT.x - 100,
  y: CENTER_POINT.y - 110,
  width: 200,
  height: 220
};

interface FlowGeometry {
  path: string;
  points: Point[];
}

export function AnimatedPaymentIllustration({ labels, className }: AnimatedPaymentIllustrationProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const interval = setInterval(() => {
      setActiveIndex(previous => (previous + 1) % sourceNodes.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const activeNode = sourceNodes[activeIndex] ?? sourceNodes[0];

  const flowGeometry = useMemo(() => {
    return sourceNodes.reduce<Record<string, FlowGeometry>>((accumulator, node) => {
      const points = sampleQuadraticPoints(node.position, node.control, CENTER_POINT, 10);
      const path = `M ${node.position.x} ${node.position.y} Q ${node.control.x} ${node.control.y} ${CENTER_POINT.x} ${CENTER_POINT.y}`;

      accumulator[node.id] = { path, points };
      return accumulator;
    }, {});
  }, []);

  const candleHeights = [72, 48, 88, 60, 102, 76];
  const linePath = "M 26 142 C 52 128 76 156 96 138 C 124 114 148 146 168 124";

  return (
    <div className={cn("relative", className)}>
      <div className="sr-only" role="list">
        {labels.map(label => (
          <span key={label} role="listitem">
            {label}
          </span>
        ))}
      </div>

      <div className="relative mx-auto aspect-[13/10] w-full max-w-2xl" aria-hidden="true">
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[52px] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  opacity: [0.7, 0.95, 0.7],
                  scale: [0.98, 1.02, 0.98]
                }
          }
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="pointer-events-none absolute inset-[10%] rounded-[42px] border border-primary/30"
          animate={
            prefersReducedMotion
              ? { opacity: 0.65 }
              : {
                  opacity: [0.4, 0.8, 0.4],
                  rotate: [-1.5, 1.5, -1.5]
                }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <svg viewBox="0 0 520 400" className="h-full w-full text-primary/80">
          <defs>
            <pattern id="background-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="hsla(210, 90%, 62%, 0.18)" strokeWidth="0.6" />
              <circle cx="0" cy="0" r="1.2" fill="hsla(210, 90%, 62%, 0.12)" />
            </pattern>

            <radialGradient id="scene-glow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="hsla(215, 100%, 75%, 0.25)" />
              <stop offset="85%" stopColor="hsla(223, 82%, 18%, 0)" />
            </radialGradient>

            <linearGradient id="dashboard-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsla(224, 60%, 16%, 0.9)" />
              <stop offset="50%" stopColor="hsla(222, 53%, 18%, 0.85)" />
              <stop offset="100%" stopColor="hsla(223, 46%, 22%, 0.92)" />
            </linearGradient>

            <linearGradient id="dashboard-header" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsla(210, 90%, 80%, 0.22)" />
              <stop offset="50%" stopColor="hsla(210, 98%, 62%, 0.28)" />
              <stop offset="100%" stopColor="hsla(210, 88%, 78%, 0.18)" />
            </linearGradient>

            <linearGradient id="mini-card" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsla(210, 100%, 92%, 0.18)" />
              <stop offset="100%" stopColor="hsla(210, 78%, 70%, 0.06)" />
            </linearGradient>

            {sourceNodes.map(node => (
              <Fragment key={node.id}>
                <linearGradient id={`flow-${node.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={node.color} stopOpacity="0.05" />
                  <stop offset="45%" stopColor={node.color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={node.accent} stopOpacity="0.85" />
                </linearGradient>

                <radialGradient id={`pulse-${node.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={node.accent} stopOpacity="0.9" />
                  <stop offset="60%" stopColor={node.accent} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={node.accent} stopOpacity="0" />
                </radialGradient>

                <radialGradient id={`node-${node.id}`} cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor={node.accent} stopOpacity="0.45" />
                  <stop offset="70%" stopColor={node.color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsla(210, 30%, 18%, 0.85)" />
                </radialGradient>

                <marker
                  id={`arrow-${node.id}`}
                  markerWidth="9"
                  markerHeight="9"
                  refX="6"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 0 0 L 6 3 L 0 6 z" fill={node.accent} />
                </marker>
              </Fragment>
            ))}
          </defs>

          <rect x="30" y="24" width="460" height="352" rx="44" fill="url(#background-grid)" opacity="0.45" />
          <rect x="30" y="24" width="460" height="352" rx="44" fill="url(#scene-glow)" opacity="0.55" />

          <motion.circle
            cx={CENTER_POINT.x}
            cy={CENTER_POINT.y}
            r={prefersReducedMotion ? 102 : 108}
            fill={activeNode.accent}
            opacity={prefersReducedMotion ? 0.08 : 0.12}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    scale: [0.94, 1.05, 0.94],
                    opacity: [0.08, 0.16, 0.08]
                  }
            }
            transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Central trading dashboard */}
          <g transform={`translate(${centralPanel.x} ${centralPanel.y})`}>
            <motion.rect
              x={0}
              y={0}
              width={centralPanel.width}
              height={centralPanel.height}
              rx={28}
              fill="url(#dashboard-grad)"
              stroke={activeNode.accent}
              strokeWidth={1.2}
              animate={
                prefersReducedMotion
                  ? { strokeOpacity: 0.6 }
                  : {
                      strokeOpacity: [0.35, 0.85, 0.35]
                    }
              }
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            />

            <rect x={20} y={24} width={centralPanel.width - 40} height={34} rx={14} fill="url(#dashboard-header)" />
            <circle cx={36} cy={41} r={4} fill="hsla(210, 90%, 70%, 0.7)" />
            <circle cx={52} cy={41} r={4} fill="hsla(189, 98%, 64%, 0.7)" />
            <circle cx={68} cy={41} r={4} fill="hsla(267, 88%, 72%, 0.7)" />

            <text
              x={centralPanel.width - 34}
              y={43}
              textAnchor="end"
              fill="hsl(var(--muted-foreground))"
              fontSize="11"
              fontWeight={500}
            >
              Trade Account
            </text>

            {/* Candlestick grid */}
            <g transform="translate(26 78)">
              <rect x={0} y={0} width={centralPanel.width - 52} height={112} rx={18} fill="hsla(216, 63%, 16%, 0.65)" />
              <line x1={18} y1={18} x2={centralPanel.width - 70} y2={18} stroke="hsla(210, 80%, 72%, 0.1)" strokeWidth={1} />
              <line x1={18} y1={54} x2={centralPanel.width - 70} y2={54} stroke="hsla(210, 80%, 72%, 0.08)" strokeWidth={1} />
              <line x1={18} y1={88} x2={centralPanel.width - 70} y2={88} stroke="hsla(210, 80%, 72%, 0.06)" strokeWidth={1} />

              {candleHeights.map((height, index) => {
                const x = 24 + index * 22;
                const wickHeight = height + 18;

                return (
                  <g key={`candle-${index}`} transform={`translate(${x} 18)`}>
                    <rect x={7} y={Math.max(0, 72 - wickHeight)} width={2} height={wickHeight} fill="hsla(210, 100%, 80%, 0.4)" />
                    <motion.rect
                      x={0}
                      y={Math.max(0, 72 - height)}
                      width={16}
                      height={height}
                      rx={6}
                      fill={index % 2 === 0 ? activeNode.color : "hsla(210, 100%, 80%, 0.25)"}
                      animate={
                        prefersReducedMotion
                          ? undefined
                          : {
                              opacity: [0.55, 0.9, 0.55]
                            }
                      }
                      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 }}
                    />
                  </g>
                );
              })}

              <motion.path
                d={linePath}
                fill="none"
                stroke={activeNode.accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        pathLength: [0.2, 1, 0.2],
                        opacity: [0.3, 0.85, 0.3]
                      }
                }
                transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </g>

            {/* Summary cards */}
            <g transform={`translate(${centralPanel.width - 84} ${centralPanel.height - 110})`}>
              <rect x={0} y={0} width={64} height={84} rx={18} fill="url(#mini-card)" stroke="hsla(210, 100%, 72%, 0.18)" />
              <motion.rect
                x={14}
                y={16}
                width={36}
                height={10}
                rx={4}
                fill={activeNode.color}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        width: [20, 36, 26],
                        opacity: [0.6, 1, 0.6]
                      }
                }
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.rect
                x={14}
                y={34}
                width={26}
                height={8}
                rx={4}
                fill="hsla(210, 100%, 92%, 0.35)"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        width: [26, 34, 22]
                      }
                }
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <circle cx={32} cy={60} r={12} fill="hsla(210, 100%, 90%, 0.1)" stroke="hsla(210, 100%, 90%, 0.35)" />
              <motion.path
                d="M 24 60 L 30 66 L 40 54"
                fill="none"
                stroke={activeNode.accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        strokeDashoffset: [14, 0, 14]
                      }
                }
                strokeDasharray="14"
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </g>
          </g>

          {/* Flow connectors and sources */}
          {sourceNodes.map((node, index) => {
            const geometry = flowGeometry[node.id];
            const isActive = node.id === activeNode.id;
            const travelPoints = geometry.points;
            const travelX = travelPoints.map(point => point.x);
            const travelY = travelPoints.map(point => point.y);

            const Icon = node.icon;

            return (
              <g key={node.id}>
                <motion.path
                  d={geometry.path}
                  fill="none"
                  stroke={`url(#flow-${node.id})`}
                  strokeWidth={isActive ? 4 : 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="12 18"
                  markerEnd={`url(#arrow-${node.id})`}
                  initial={{ strokeDashoffset: 0, opacity: 0.45 }}
                  animate={
                    prefersReducedMotion
                      ? { opacity: isActive ? 0.85 : 0.45 }
                      : {
                          strokeDashoffset: [0, -120],
                          opacity: isActive ? [0.5, 1, 0.5] : [0.3, 0.6, 0.3]
                        }
                  }
                  transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
                  style={{ mixBlendMode: "screen" }}
                />

                {prefersReducedMotion ? (
                  <circle cx={travelX[travelX.length - 2]} cy={travelY[travelY.length - 2]} r={isActive ? 4.5 : 3.5} fill={node.accent} opacity={0.6} />
                ) : (
                  <motion.circle
                    r={isActive ? 5 : 4}
                    fill={`url(#pulse-${node.id})`}
                    initial={{ cx: travelX[0], cy: travelY[0], opacity: 0.2 }}
                    animate={{
                      cx: travelX,
                      cy: travelY,
                      opacity: [0.2, 1, 0.2],
                      scale: isActive ? [0.8, 1.25, 0.8] : [0.7, 1.1, 0.7]
                    }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.25 }}
                  />
                )}

                <motion.g
                  transform={`translate(${node.position.x} ${node.position.y})`}
                  initial={{ opacity: 0, scale: 0.85, y: 12 }}
                  animate={{
                    opacity: 1,
                    scale: prefersReducedMotion ? 1 : isActive ? 1.05 : 1,
                    y: 0
                  }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                >
                  <title>{node.title}</title>
                  <motion.circle
                    cx={0}
                    cy={0}
                    r={36}
                    fill={`url(#node-${node.id})`}
                    stroke={node.accent}
                    strokeWidth={1.2}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : {
                            strokeOpacity: isActive ? [0.5, 0.95, 0.5] : [0.3, 0.6, 0.3]
                          }
                    }
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <circle cx={0} cy={0} r={26} fill="hsl(var(--background))" opacity={0.92} />
                  <Icon color={node.color} />
                  <text
                    x={0}
                    y={40}
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize="11"
                    fontWeight={500}
                  >
                    {node.label}
                  </text>
                </motion.g>
              </g>
            );
          })}
        </svg>

        {/* Floating payment method labels */}
        {labels.map((label, index) => {
          const positionClass = floatingLabelPositions[index % floatingLabelPositions.length];
          const delay = index * 0.35;

          return (
            <motion.div
              key={`${label}-${index}`}
              className={cn(
                "absolute w-max rounded-full border border-primary/30 bg-background/95 px-3 py-1.5 text-xs font-medium text-primary shadow-lg backdrop-blur",
                positionClass
              )}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.95 }
                  : {
                      y: [-8, 8, -8],
                      opacity: [0.75, 1, 0.75],
                      rotate: [-2, 2, -2]
                    }
              }
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
            >
              {label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function sampleQuadraticPoints(start: Point, control: Point, end: Point, samples: number): Point[] {
  const points: Point[] = [];

  for (let index = 0; index <= samples; index++) {
    const t = index / samples;
    const oneMinusT = 1 - t;

    const x = oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x;
    const y = oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y;

    points.push({ x, y });
  }

  return points;
}

function WalletIcon({ color }: { color: string }) {
  return (
    <g>
      <rect x={-22} y={-16} width={44} height={28} rx={10} fill={color} opacity={0.12} />
      <rect x={-20} y={-14} width={40} height={24} rx={9} fill="hsl(var(--background))" opacity={0.95} stroke={color} strokeWidth={1} />
      <rect x={-18} y={-4} width={28} height={10} rx={4} fill={color} opacity={0.3} />
      <rect x={-8} y={-8} width={24} height={6} rx={3} fill={color} opacity={0.45} />
      <circle cx={10} cy={-2} r={3} fill={color} opacity={0.65} />
    </g>
  );
}

function MobileIcon({ color }: { color: string }) {
  return (
    <g>
      <rect x={-14} y={-20} width={28} height={40} rx={9} fill={color} opacity={0.12} />
      <rect x={-12} y={-18} width={24} height={36} rx={8} fill="hsl(var(--background))" opacity={0.95} stroke={color} strokeWidth={1} />
      <rect x={-8} y={-12} width={16} height={10} rx={3} fill={color} opacity={0.4} />
      <rect x={-6} y={4} width={12} height={6} rx={2} fill={color} opacity={0.28} />
      <circle cx={0} cy={14} r={2} fill={color} opacity={0.65} />
    </g>
  );
}

function CardIcon({ color }: { color: string }) {
  return (
    <g>
      <rect x={-24} y={-16} width={48} height={32} rx={10} fill={color} opacity={0.12} />
      <rect x={-22} y={-14} width={44} height={28} rx={9} fill="hsl(var(--background))" opacity={0.95} stroke={color} strokeWidth={1} />
      <rect x={-18} y={-8} width={36} height={6} rx={3} fill={color} opacity={0.4} />
      <rect x={-18} y={2} width={20} height={6} rx={3} fill={color} opacity={0.28} />
      <circle cx={12} cy={5} r={4} fill={color} opacity={0.6} />
    </g>
  );
}

function BankIcon({ color }: { color: string }) {
  return (
    <g>
      <polygon points="0,-22 24,-6 -24,-6" fill={color} opacity={0.12} />
      <polygon points="0,-20 20,-6 -20,-6" fill="hsl(var(--background))" opacity={0.95} stroke={color} strokeWidth={1} />
      <rect x={-18} y={-6} width={36} height={4} fill={color} opacity={0.28} />
      <rect x={-16} y={-2} width={32} height={18} rx={4} fill="hsl(var(--background))" opacity={0.95} stroke={color} strokeWidth={1} />
      <rect x={-12} y={2} width={6} height={10} fill={color} opacity={0.35} />
      <rect x={-2} y={2} width={6} height={10} fill={color} opacity={0.35} />
      <rect x={8} y={2} width={6} height={10} fill={color} opacity={0.35} />
    </g>
  );
}
