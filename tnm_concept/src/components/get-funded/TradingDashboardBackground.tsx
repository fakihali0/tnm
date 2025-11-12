import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface TradingDashboardBackgroundProps {
  prefersReducedMotion?: boolean;
  className?: string;
}

export function TradingDashboardBackground({ 
  prefersReducedMotion: propPrefersReducedMotion,
  className = "" 
}: TradingDashboardBackgroundProps) {
  const hookPrefersReducedMotion = usePrefersReducedMotion();
  const shouldReduceMotion = propPrefersReducedMotion ?? hookPrefersReducedMotion;
  const isMobile = useIsMobile();

  // Currency symbols floating on edges
  const currencySymbols = [
    { symbol: "$", x: "5%", y: "15%", delay: 0 },
    { symbol: "€", x: "95%", y: "25%", delay: 0.5 },
    { symbol: "£", x: "8%", y: "70%", delay: 1 },
    { symbol: "¥", x: "92%", y: "80%", delay: 1.5 },
    { symbol: "₿", x: "3%", y: "45%", delay: 2 },
    { symbol: "₹", x: "97%", y: "55%", delay: 2.5 }
  ];

  // Trading indicators positioned on edges
  const tradingIndicators = [
    { Icon: TrendingUp, x: "10%", y: "20%", delay: 0.3, color: "text-emerald-500" },
    { Icon: BarChart3, x: "90%", y: "30%", delay: 0.8, color: "text-blue-500" },
    { Icon: PieChart, x: "5%", y: "60%", delay: 1.3, color: "text-purple-500" },
    { Icon: Target, x: "95%", y: "70%", delay: 1.8, color: "text-amber-500" },
    { Icon: TrendingDown, x: "12%", y: "85%", delay: 2.3, color: "text-red-500" },
    { Icon: DollarSign, x: "88%", y: "15%", delay: 2.8, color: "text-green-500" }
  ];

  // Profit indicators for corners
  const profitIndicators = [
    { icon: ArrowUpRight, value: "+12.5%", x: "15%", y: "10%", delay: 0.5 },
    { icon: ArrowUpRight, value: "+8.3%", x: "85%", y: "20%", delay: 1 },
    { icon: ArrowDownRight, value: "-2.1%", x: "10%", y: "90%", delay: 1.5 },
    { icon: ArrowUpRight, value: "+15.7%", x: "90%", y: "85%", delay: 2 }
  ];

  // Reduce elements count on mobile
  const displayCurrencies = isMobile ? currencySymbols.slice(0, 4) : currencySymbols;
  const displayIndicators = isMobile ? tradingIndicators.slice(0, 4) : tradingIndicators;
  const displayProfits = isMobile ? profitIndicators.slice(0, 2) : profitIndicators;

  if (shouldReduceMotion) {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        {/* Subtle static background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10" />
        
        {/* Static currency symbols */}
        {displayCurrencies.map((currency, index) => (
          <div
            key={`currency-${index}`}
            className="absolute text-muted-foreground/50 font-bold text-3xl"
            style={{ left: currency.x, top: currency.y }}
          >
            {currency.symbol}
          </div>
        ))}
        
        {/* Static trading indicators */}
        {displayIndicators.map((indicator, index) => (
          <div
            key={`indicator-${index}`}
            className="absolute opacity-30"
            style={{ left: indicator.x, top: indicator.y }}
          >
            <indicator.Icon className="w-8 h-8 text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Floating currency symbols */}
      {displayCurrencies.map((currency, index) => (
        <motion.div
          key={`currency-${index}`}
          className="absolute text-muted-foreground/60 font-bold text-3xl"
          style={{ left: currency.x, top: currency.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0.4, 0.7, 0.4], 
            scale: [0.9, 1.1, 0.9],
            y: [-10, 10, -10]
          }}
          transition={{
            duration: 4,
            delay: currency.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {currency.symbol}
        </motion.div>
      ))}

      {/* Trading indicators */}
      {displayIndicators.map((indicator, index) => (
        <motion.div
          key={`indicator-${index}`}
          className={`absolute ${indicator.color}/40`}
          style={{ left: indicator.x, top: indicator.y }}
          initial={{ opacity: 0, rotate: -45 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            rotate: [-45, 0, -45],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 3,
            delay: indicator.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <indicator.Icon className="w-8 h-8" />
        </motion.div>
      ))}

      {/* Profit indicators */}
      {displayProfits.map((profit, index) => (
        <motion.div
          key={`profit-${index}`}
          className="absolute flex items-center gap-1 text-sm font-medium text-muted-foreground/50"
          style={{ left: profit.x, top: profit.y }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: [0.4, 0.7, 0.4],
            x: [-5, 5, -5]
          }}
          transition={{
            duration: 2.5,
            delay: profit.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <profit.icon className="w-4 h-4" />
          <span>{profit.value}</span>
        </motion.div>
      ))}

      {/* Subtle connecting lines */}
      <svg className="absolute inset-0 w-full h-full opacity-15">
        <motion.path
          d={`M 10,20 Q 50,50 90,30`}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-primary"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.path
          d={`M 15,80 Q 50,60 85,85`}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-primary"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{
            duration: 8,
            delay: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
    </div>
  );
}