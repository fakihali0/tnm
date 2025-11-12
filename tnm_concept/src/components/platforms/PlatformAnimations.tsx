import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Server, 
  Zap, 
  Database,
  Wifi,
  Monitor,
  Smartphone,
  Globe
} from "lucide-react";

// Technology and platform-focused elements
const serverNodes = [
  { x: "15%", y: "20%", delay: 0 },
  { x: "85%", y: "30%", delay: 0.4 },
  { x: "70%", y: "70%", delay: 0.8 },
  { x: "25%", y: "80%", delay: 1.2 },
  { x: "50%", y: "15%", delay: 0.6 }
];

const chartPatterns = [
  { icon: TrendingUp, x: "20%", y: "25%", delay: 0.2 },
  { icon: TrendingDown, x: "75%", y: "40%", delay: 0.6 },
  { icon: Activity, x: "40%", y: "60%", delay: 1.0 },
  { icon: TrendingUp, x: "80%", y: "75%", delay: 1.4 },
  { icon: Activity, x: "10%", y: "70%", delay: 1.8 }
];

const dataStreams = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 2
}));

const platformDevices = [
  { icon: Monitor, x: "30%", y: "35%", delay: 0.3 },
  { icon: Smartphone, x: "65%", y: "25%", delay: 0.6 },
  { icon: Globe, x: "45%", y: "55%", delay: 0.9 }
];

export default function PlatformAnimations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Server Network Nodes */}
      {serverNodes.map((node, index) => (
        <motion.div
          key={`server-${index}`}
          className="absolute text-primary/25"
          style={{ left: node.x, top: node.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.3, 0.8],
            rotate: [0, 360]
          }}
          transition={{
            duration: 8,
            delay: node.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Server size={24} />
        </motion.div>
      ))}

      {/* Chart Patterns */}
      {chartPatterns.map((chart, index) => (
        <motion.div
          key={`chart-${index}`}
          className="absolute text-accent/30"
          style={{ left: chart.x, top: chart.y }}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [10, -15, 10],
            scale: [0.9, 1.2, 0.9]
          }}
          transition={{
            duration: 6,
            delay: chart.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <chart.icon size={20} />
        </motion.div>
      ))}

      {/* Data Stream Particles */}
      {dataStreams.map((particle) => (
        <motion.div
          key={`data-${particle.id}`}
          className="absolute w-1.5 h-1.5 bg-accent/35 rounded-full"
          style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 0.8, 0],
            y: [-20, 20, -20]
          }}
          transition={{
            duration: 4,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Platform Device Sync */}
      {platformDevices.map((device, index) => (
        <motion.div
          key={`device-${index}`}
          className="absolute text-primary/20"
          style={{ left: device.x, top: device.y }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 5,
            delay: device.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <device.icon size={18} />
        </motion.div>
      ))}

      {/* Speed/Performance Indicators */}
      {[1, 2, 3, 4].map((pulse) => (
        <motion.div
          key={`speed-${pulse}`}
          className="absolute text-primary/15"
          style={{
            left: `${15 + pulse * 20}%`,
            top: `${40 + pulse * 10}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3,
            delay: pulse * 0.6,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <Zap size={16} />
        </motion.div>
      ))}

      {/* Network Connection Lines */}
      <svg className="absolute inset-0 w-full h-full">
        {[1, 2, 3].map((line) => (
          <motion.path
            key={`connection-${line}`}
            d={`M ${20 + line * 15} ${30 + line * 20} Q ${50 + line * 10} ${20 + line * 15} ${80 - line * 10} ${60 + line * 15}`}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            fill="none"
            opacity="0.15"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 6,
              delay: line * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Database/Processing Pulses */}
      {[1, 2].map((db) => (
        <motion.div
          key={`database-${db}`}
          className="absolute text-accent/20"
          style={{
            left: `${25 + db * 50}%`,
            top: `${20 + db * 30}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 7,
            delay: db * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Database size={22} />
        </motion.div>
      ))}
    </div>
  );
}