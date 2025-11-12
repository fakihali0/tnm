import { motion } from "framer-motion";
import { 
  Calculator, 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity,
  Target,
  Zap,
  Settings,
  LineChart,
  AreaChart,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  AlertCircle,
  CheckCircle
} from "lucide-react";

// Trading tools configuration
const tradingTools = [
  { icon: Calculator, x: "15%", y: "20%", delay: 0, rotate: 15 },
  { icon: BarChart3, x: "75%", y: "15%", delay: 0.5, rotate: -10 },
  { icon: TrendingUp, x: "25%", y: "70%", delay: 1, rotate: 8 },
  { icon: PieChart, x: "85%", y: "65%", delay: 1.5, rotate: -15 },
  { icon: Activity, x: "45%", y: "25%", delay: 2, rotate: 12 },
  { icon: Target, x: "65%", y: "80%", delay: 2.5, rotate: -8 },
  { icon: LineChart, x: "10%", y: "55%", delay: 3, rotate: 10 },
  { icon: AreaChart, x: "90%", y: "40%", delay: 3.5, rotate: -12 }
];

// Feature indicators
const featureIndicators = [
  { icon: Zap, x: "35%", y: "10%", delay: 0.8, size: 20 },
  { icon: Settings, x: "55%", y: "90%", delay: 1.3, size: 18 },
  { icon: Calendar, x: "8%", y: "35%", delay: 1.8, size: 22 },
  { icon: Clock, x: "92%", y: "25%", delay: 2.3, size: 19 },
  { icon: DollarSign, x: "20%", y: "45%", delay: 2.8, size: 21 },
  { icon: Percent, x: "80%", y: "55%", delay: 3.3, size: 20 }
];

// Analysis particles
const analysisParticles = Array.from({ length: 12 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 4,
  size: Math.random() * 6 + 4
}));

const TradingToolsAnimations = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Trading Tools Icons */}
      {tradingTools.map((tool, index) => {
        const IconComponent = tool.icon;
        return (
          <motion.div
            key={index}
            className="absolute"
            style={{ left: tool.x, top: tool.y }}
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              rotate: tool.rotate
            }}
            animate={{ 
              opacity: [0, 0.6, 0.4],
              scale: [0.8, 1.1, 1],
              rotate: [tool.rotate, tool.rotate + 360],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 6,
              delay: tool.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <IconComponent 
              className="w-8 h-8 text-primary/40" 
              strokeWidth={1.5}
            />
          </motion.div>
        );
      })}

      {/* Feature Indicators */}
      {featureIndicators.map((feature, index) => {
        const IconComponent = feature.icon;
        return (
          <motion.div
            key={`feature-${index}`}
            className="absolute"
            style={{ left: feature.x, top: feature.y }}
            initial={{ 
              opacity: 0, 
              scale: 0.5
            }}
            animate={{ 
              opacity: [0, 0.8, 0.3, 0.8],
              scale: [0.5, 1.2, 0.8, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8,
              delay: feature.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <IconComponent 
              className="text-accent/50" 
              size={feature.size}
              strokeWidth={1.5}
            />
          </motion.div>
        );
      })}

      {/* Analysis Particles */}
      {analysisParticles.map((particle, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute rounded-full bg-gradient-to-r from-primary/20 to-accent/20"
          style={{ 
            left: `${particle.x}%`, 
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
            y: [0, -30, -60]
          }}
          transition={{
            duration: 4,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Success Indicators */}
      <motion.div
        className="absolute"
        style={{ left: "40%", top: "35%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 1, 0],
          scale: [0, 1.3, 0],
          rotate: [0, 360]
        }}
        transition={{
          duration: 5,
          delay: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <CheckCircle className="w-6 h-6 text-green-500/40" strokeWidth={2} />
      </motion.div>

      <motion.div
        className="absolute"
        style={{ left: "60%", top: "45%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.8, 0],
          scale: [0, 1.1, 0],
          rotate: [0, -360]
        }}
        transition={{
          duration: 6,
          delay: 2.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <AlertCircle className="w-5 h-5 text-amber-500/40" strokeWidth={2} />
      </motion.div>

      {/* Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.path
          d="M 15% 20% Q 50% 35% 75% 15%"
          stroke="hsl(var(--primary) / 0.1)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="5,5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 8,
            delay: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.path
          d="M 25% 70% Q 45% 50% 85% 65%"
          stroke="hsl(var(--accent) / 0.1)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="3,7"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 10,
            delay: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.path
          d="M 45% 25% Q 65% 45% 65% 80%"
          stroke="hsl(var(--primary) / 0.08)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="4,6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 12,
            delay: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>

      {/* Pulse Circles */}
      <motion.div
        className="absolute rounded-full border border-primary/10"
        style={{ 
          left: "30%", 
          top: "40%",
          width: "40px",
          height: "40px"
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: [0, 2, 3],
          opacity: [1, 0.3, 0]
        }}
        transition={{
          duration: 4,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />

      <motion.div
        className="absolute rounded-full border border-accent/10"
        style={{ 
          left: "70%", 
          top: "50%",
          width: "30px",
          height: "30px"
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: [0, 2.5, 4],
          opacity: [1, 0.4, 0]
        }}
        transition={{
          duration: 5,
          delay: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    </div>
  );
};

export default TradingToolsAnimations;