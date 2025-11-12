import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

interface MiniChartCardProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  sparklineData: number[];
  onClick?: () => void;
}

export function MiniChartCard({ 
  symbol, 
  price, 
  change, 
  changePercent, 
  sparklineData,
  onClick 
}: MiniChartCardProps) {
  const { triggerHapticFeedback } = useMobileOptimizations();
  const isPositive = change >= 0;

  const handleClick = () => {
    triggerHapticFeedback("light");
    onClick?.();
  };

  // Simple sparkline SVG
  const generateSparkline = () => {
    const width = 80;
    const height = 40;
    const padding = 2;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    
    const points = sparklineData.map((value, index) => {
      const x = padding + (index / (sparklineData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(" ");
    
    return (
      <svg width={width} height={height} className="opacity-70">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl p-4 border transition-colors ${
        isPositive 
          ? "bg-green-500/10 border-green-500/30 text-green-500" 
          : "bg-red-500/10 border-red-500/30 text-red-500"
      }`}
    >
      <div className="flex flex-col gap-2">
        {/* Symbol and trend icon */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{symbol}</span>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </div>

        {/* Price */}
        <div className="text-left">
          <div className="text-lg font-bold text-foreground">
            ${price.toFixed(2)}
          </div>
          <div className="text-xs font-medium">
            {isPositive ? "+" : ""}{change.toFixed(2)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
          </div>
        </div>

        {/* Mini sparkline */}
        <div className="absolute bottom-0 right-0 opacity-30">
          {generateSparkline()}
        </div>
      </div>
    </motion.button>
  );
}
