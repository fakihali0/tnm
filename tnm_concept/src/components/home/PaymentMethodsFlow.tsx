import { useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

interface PaymentMethodsFlowProps {
  className?: string;
}

const paymentSources = [
  {
    id: 'ewallet',
    name: 'E-Wallets',
    icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="wallet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary-foreground))" />
          </linearGradient>
        </defs>
        <rect x="8" y="12" width="24" height="16" rx="3" fill="url(#wallet-grad)" opacity="0.9" />
        <rect x="8" y="12" width="24" height="4" rx="3" fill="hsl(var(--background))" opacity="0.3" />
        <circle cx="26" cy="20" r="2" fill="hsl(var(--background))" opacity="0.8" />
      </svg>
    ),
    position: { x: 60, y: 80 }
  },
  {
    id: 'mobile',
    name: 'Mobile Banking',
    icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="mobile-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
        <rect x="14" y="6" width="12" height="28" rx="2" fill="url(#mobile-grad)" />
        <rect x="16" y="10" width="8" height="16" rx="1" fill="hsl(var(--background))" opacity="0.9" />
        <circle cx="20" cy="30" r="1.5" fill="hsl(var(--background))" opacity="0.7" />
        <rect x="18" y="7.5" width="4" height="1" rx="0.5" fill="hsl(var(--background))" opacity="0.5" />
      </svg>
    ),
    position: { x: 70, y: 215 }
  },
  {
    id: 'cards',
    name: 'Credit/Debit Cards',
    icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <rect x="6" y="14" width="28" height="12" rx="2" fill="url(#card-grad)" />
        <rect x="6" y="17" width="28" height="3" fill="hsl(var(--background))" opacity="0.3" />
        <rect x="28" y="21" width="4" height="2" rx="0.5" fill="hsl(var(--background))" opacity="0.8" />
        <rect x="8" y="21" width="6" height="1.5" rx="0.3" fill="hsl(var(--background))" opacity="0.6" />
      </svg>
    ),
    position: { x: 75, y: 305 }
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="bank-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground))" />
          </linearGradient>
        </defs>
        <polygon points="20,8 8,16 32,16" fill="url(#bank-grad)" />
        <rect x="10" y="16" width="4" height="12" fill="hsl(var(--primary))" opacity="0.8" />
        <rect x="18" y="16" width="4" height="12" fill="hsl(var(--primary))" opacity="0.8" />
        <rect x="26" y="16" width="4" height="12" fill="hsl(var(--primary))" opacity="0.8" />
        <rect x="8" y="28" width="24" height="2" fill="hsl(var(--primary))" />
      </svg>
    ),
    position: { x: 85, y: 430 }
  }
];

const connectorLayouts: Record<string, { junctionY: number; finalX: number }> = {
  ewallet: { junctionY: 150, finalX: 440 },
  mobile: { junctionY: 210, finalX: 460 },
  cards: { junctionY: 290, finalX: 480 },
  bank: { junctionY: 350, finalX: 500 },
};

const VIEWBOX = { width: 800, height: 500 };
const LANE_X = 200;
const FINAL_POINT = { x: 580, y: 250 };

function mirrorXCoordinate(x: number) {
  return VIEWBOX.width - x;
}

function mirrorPoints(points: Array<[number, number]>) {
  return points.map(([x, y]) => [mirrorXCoordinate(x), y] as [number, number]);
}

interface ConnectorPathOffsets {
  junctionYOffset?: number;
  finalXOffset?: number;
  finalYOffset?: number;
}

function buildConnectorPoints(
  startX: number,
  startY: number,
  layout: { junctionY: number; finalX: number },
  offsets: ConnectorPathOffsets = {}
) {
  const junctionY = layout.junctionY + (offsets.junctionYOffset ?? 0);
  const finalX = layout.finalX + (offsets.finalXOffset ?? 0);
  const finalY = FINAL_POINT.y + (offsets.finalYOffset ?? 0);

  const points: Array<[number, number]> = [
    [startX, startY],
    [LANE_X, startY],
    [LANE_X, junctionY],
    [finalX, junctionY],
    [finalX, finalY],
    [FINAL_POINT.x, finalY],
  ];

  return points;
}

function formatPoints(points: Array<[number, number]>) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

export function PaymentMethodsFlow({ className }: PaymentMethodsFlowProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const mirrorTransform = isRtl ? `scale(-1,1) translate(-${VIEWBOX.width},0)` : undefined;
  const finalPoint = isRtl
    ? { x: mirrorXCoordinate(FINAL_POINT.x), y: FINAL_POINT.y }
    : FINAL_POINT;
  const applyDirectionalPoints = (points: Array<[number, number]>) =>
    isRtl ? mirrorPoints(points) : points;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative aspect-[3/2] w-full lg:scale-125 xl:scale-150 2xl:scale-175" aria-hidden="true">
        <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} className="w-full h-full">
          <defs>
            {/* Gradient definitions */}
            <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
              <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>
            
            <linearGradient id="flow-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            </linearGradient>
            
            <linearGradient id="account-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--background))" />
              <stop offset="50%" stopColor="hsl(var(--card))" />
              <stop offset="100%" stopColor="hsl(var(--muted))" />
            </linearGradient>

            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>

            {/* Glass effect filter */}
            <filter id="glass-effect">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.1 0" />
            </filter>
          </defs>

          {/* Background tech grid */}
          <pattern id="tech-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <circle cx="0" cy="0" r="1" fill="hsl(var(--primary))" opacity="0.1" />
          </pattern>
          <rect width="800" height="500" fill="url(#tech-grid)" />

          {/* Payment source icons */}
          {paymentSources.map((source, index) => {
            const layout = connectorLayouts[source.id];

            if (!layout) {
              return null;
            }

            const sourcePosition = isRtl
              ? { x: mirrorXCoordinate(source.position.x), y: source.position.y }
              : source.position;

            const primaryPoints = buildConnectorPoints(
              source.position.x + 30,
              source.position.y,
              layout
            );

            const secondaryPoints = buildConnectorPoints(
              source.position.x + 25,
              source.position.y + 8,
              layout,
              {
                junctionYOffset: 12,
                finalXOffset: 12,
              }
            );

            const orientedPrimaryPoints = applyDirectionalPoints(primaryPoints);
            const orientedSecondaryPoints = applyDirectionalPoints(secondaryPoints);
            const formattedPrimaryPoints = formatPoints(orientedPrimaryPoints);
            const formattedSecondaryPoints = formatPoints(orientedSecondaryPoints);
            const finalConnectorPoint = orientedPrimaryPoints[orientedPrimaryPoints.length - 1];
            const connectorEndY = finalConnectorPoint?.[1] ?? finalPoint.y;
            const isActive = activeSource === source.id;
            const isDimmed = !!activeSource && !isActive;

            return (
              <motion.g
                key={source.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8, ease: "easeOut" }}
                tabIndex={0}
                role="group"
                aria-labelledby={`flow-${source.id}`}
                onFocus={() => setActiveSource(source.id)}
                onBlur={() => setActiveSource(null)}
                onPointerEnter={() => setActiveSource(source.id)}
                onPointerLeave={() => setActiveSource(null)}
              >
                {/* Source container with glass morphism */}
                <motion.g
                  animate={prefersReducedMotion ? undefined : {
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 3 + index * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.3,
                  }}
                >
                  {/* Glow effect */}
                  <circle
                    cx={sourcePosition.x}
                    cy={sourcePosition.y}
                    r="35"
                    fill="url(#glow)"
                  />

                  {/* Glass container */}
                  <circle
                    cx={sourcePosition.x}
                    cy={sourcePosition.y}
                    r="25"
                    fill="hsl(var(--card))"
                    fillOpacity="0.8"
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    filter="url(#glass-effect)"
                  />

                  {/* Icon container */}
                  <foreignObject
                    x={sourcePosition.x - 12}
                    y={sourcePosition.y - 12}
                    width="24"
                    height="24"
                  >
                    {source.icon}
                  </foreignObject>
                </motion.g>

                {/* Flow connectors */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + index * 0.2, duration: 0.8, ease: "easeOut" }}
                >
                  <motion.polyline
                    points={formattedPrimaryPoints}
                    stroke="url(#flow-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDimmed ? 0.35 : 0.95 }}
                    transition={{ duration: 0.4 }}
                  />

                  <motion.polyline
                    points={formattedSecondaryPoints}
                    stroke="url(#flow-gradient-2)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDimmed ? 0.2 : 0.6 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  />

                  {/* Endpoint emphasis */}
                  <motion.circle
                    cx={finalPoint.x}
                    cy={connectorEndY}
                    r="14"
                    fill="url(#glow)"
                    style={{ opacity: isDimmed ? 0.15 : 0.3 }}
                    transition={{ duration: 0.3 }}
                  />

                  <motion.circle
                    cx={finalPoint.x}
                    cy={connectorEndY}
                    r="5"
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth="1.5"
                    animate={{ opacity: isDimmed ? 0.4 : 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.g>

                {/* Tooltip hook indicator */}
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    scale: prefersReducedMotion ? 1 : isActive ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <line
                    x1={sourcePosition.x}
                    y1={sourcePosition.y - 22}
                    x2={sourcePosition.x}
                    y2={sourcePosition.y - 32}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={sourcePosition.x}
                    cy={sourcePosition.y - 36}
                    r="3"
                    fill="hsl(var(--primary))"
                  />
                </motion.g>

                {/* Source label */}
                <motion.text
                  x={sourcePosition.x}
                  y={sourcePosition.y + 42}
                  textAnchor="middle"
                  className="fill-foreground text-xs font-medium"
                  id={`flow-${source.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 1.5 + index * 0.1 }}
                >
                  {source.name}
                </motion.text>
            </motion.g>
            );
          })}

          {/* Central Trading Account Dashboard */}
          <g transform={mirrorTransform}>
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 1, ease: "easeOut" }}
            >
              {/* Enhanced dashboard glow */}
              <circle cx="680" cy="250" r="90" fill="url(#glow)" />
              <circle cx="680" cy="250" r="60" fill="hsl(var(--primary))" fillOpacity="0.1" />

              {/* Main dashboard container - larger and more prominent */}
              <rect
                x="600"
                y="170"
                width="160"
                height="160"
                rx="20"
                fill="url(#account-gradient)"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                filter="url(#glass-effect)"
              />

              {/* Dashboard screen - larger */}
              <rect
                x="615"
                y="190"
                width="130"
                height="90"
                rx="10"
                fill="hsl(var(--background))"
                fillOpacity="0.95"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />

              {/* Account balance display */}
              <motion.rect
                x="625"
                y="205"
                width="110"
                height="14"
                rx="3"
                fill="hsl(var(--primary))"
                fillOpacity="0.8"
                animate={prefersReducedMotion ? undefined : {
                  fillOpacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Balance amount bars */}
              <rect x="625" y="225" width="90" height="5" rx="2" fill="hsl(var(--muted-foreground))" fillOpacity="0.4" />
              <rect x="625" y="235" width="70" height="5" rx="2" fill="hsl(var(--muted-foreground))" fillOpacity="0.4" />
              <rect x="625" y="245" width="100" height="5" rx="2" fill="hsl(var(--muted-foreground))" fillOpacity="0.4" />

              {/* Trading chart visualization */}
              <motion.path
                d="M 625 260 Q 645 255 665 263 Q 685 270 705 257 Q 715 253 725 260"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                animate={prefersReducedMotion ? undefined : {
                  strokeDashoffset: [0, -12],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                strokeDasharray="3 3"
              />

              {/* Control buttons */}
              <circle cx="640" cy="305" r="10" fill="hsl(var(--primary))" fillOpacity="0.8" />
              <circle cx="670" cy="305" r="10" fill="hsl(var(--secondary))" fillOpacity="0.8" />
              <circle cx="700" cy="305" r="10" fill="hsl(var(--accent))" fillOpacity="0.8" />

              {/* Success indicator */}
              <motion.circle
                cx="730"
                cy="185"
                r="8"
                fill="hsl(142, 76%, 36%)"
                animate={prefersReducedMotion ? undefined : {
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Success checkmark */}
              <motion.path
                d="M 726 185 L 729 188 L 734 181"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.g>
          </g>

          {/* Central convergence effect */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
          >
            {/* Enhanced convergence glow rings */}
            {Array.from({ length: 4 }).map((_, ringIndex) => (
              <motion.circle
                key={`ring-${ringIndex}`}
                cx="580"
                cy="250"
                r="0"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeOpacity="0.4"
                animate={prefersReducedMotion ? undefined : {
                  r: [0, 50 + ringIndex * 20, 0],
                  strokeOpacity: [0.6, 0.1, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: ringIndex * 0.4,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.g>

          {/* Floating ambient particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.circle
              key={`ambient-${i}`}
              cx={150 + (i * 50) % 500}
              cy={80 + (i * 40) % 340}
              r={1 + (i % 3) * 0.5}
              fill="hsl(var(--primary))"
              fillOpacity="0.2"
              animate={prefersReducedMotion ? undefined : {
                y: [-10, 10, -10],
                opacity: [0.1, 0.4, 0.1],
              }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </div>

      {/* Accessible description */}
      <div className="sr-only">
        Payment methods flow illustration showing deposits from e-wallets, mobile banking, 
        credit/debit cards, and bank transfers flowing into a central trading account dashboard.
      </div>
    </div>
  );
}