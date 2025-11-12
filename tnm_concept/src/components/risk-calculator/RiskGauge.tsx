import React from "react";
import { motion } from "framer-motion";
import { TrendingDown, AlertTriangle, TrendingUp } from "lucide-react";

interface RiskGaugeProps {
  riskPercentage: number;
  size?: "sm" | "md" | "lg";
}

export function RiskGauge({ riskPercentage, size = "md" }: RiskGaugeProps) {
  const sizeConfig = {
    sm: { container: "w-32 h-32", stroke: 8, fontSize: "text-2xl", iconSize: "h-5 w-5" },
    md: { container: "w-40 h-40 md:w-44 md:h-44", stroke: 10, fontSize: "text-3xl md:text-4xl", iconSize: "h-6 w-6" },
    lg: { container: "w-44 h-44 md:w-52 md:h-52", stroke: 12, fontSize: "text-4xl md:text-5xl", iconSize: "h-7 w-7" }
  };

  const config = sizeConfig[size];

  const getRiskLevel = () => {
    if (riskPercentage < 2) {
      return {
        label: "Conservative",
        color: "text-green-500",
        gradientFrom: "from-green-500",
        gradientTo: "to-emerald-400",
        stroke: "#22c55e",
        glow: "shadow-green-500/20",
        icon: TrendingDown
      };
    }
    if (riskPercentage < 3) {
      return {
        label: "Moderate",
        color: "text-amber-500",
        gradientFrom: "from-amber-500",
        gradientTo: "to-orange-400",
        stroke: "#f59e0b",
        glow: "shadow-amber-500/20",
        icon: AlertTriangle
      };
    }
    return {
      label: "Aggressive",
      color: "text-red-500",
      gradientFrom: "from-red-500",
      gradientTo: "to-rose-400",
      stroke: "#ef4444",
      glow: "shadow-red-500/20",
      icon: TrendingUp
    };
  };

  const riskLevel = getRiskLevel();
  const Icon = riskLevel.icon;

  // Calculate progress (0-100% mapped from 0-5% risk)
  const maxRisk = 5;
  const progress = Math.min((riskPercentage / maxRisk) * 100, 100);

  // SVG circle calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative ${config.container}`}
      >
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-muted/10"
          />

          {/* Progress circle with gradient */}
          <defs>
            <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={riskLevel.stroke} stopOpacity="1" />
              <stop offset="100%" stopColor={riskLevel.stroke} stopOpacity="0.7" />
            </linearGradient>
          </defs>

          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={`url(#gradient-${size})`}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`drop-shadow-lg ${riskLevel.glow}`}
            style={{ filter: `drop-shadow(0 0 8px ${riskLevel.stroke}40)` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={riskPercentage}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className={`${config.fontSize} font-bold ${riskLevel.color} leading-none`}
          >
            {riskPercentage.toFixed(2)}%
          </motion.div>
          <Icon className={`${config.iconSize} ${riskLevel.color} mt-2 opacity-60`} />
        </div>
      </motion.div>

      {/* Risk level label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-center"
      >
        <div className={`text-base font-semibold ${riskLevel.color}`}>
          {riskLevel.label}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Risk Level
        </div>
      </motion.div>
    </div>
  );
}
