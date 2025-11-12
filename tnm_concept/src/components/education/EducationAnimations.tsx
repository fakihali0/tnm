import { motion } from "framer-motion";
import { 
  BookOpen, 
  GraduationCap, 
  Lightbulb, 
  Brain, 
  Target, 
  Award, 
  Star,
  PenTool,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Zap,
  Heart,
  Users,
  Trophy
} from "lucide-react";

// Educational icons with bounce animations
const educationalIcons = [
  { icon: BookOpen, x: "15%", y: "20%", delay: 0, rotate: 10, bounce: true },
  { icon: GraduationCap, x: "80%", y: "15%", delay: 0.8, rotate: -8, bounce: true },
  { icon: Lightbulb, x: "20%", y: "70%", delay: 1.6, rotate: 15, bounce: true },
  { icon: Brain, x: "75%", y: "65%", delay: 2.4, rotate: -12, bounce: true },
  { icon: Target, x: "45%", y: "25%", delay: 3.2, rotate: 8, bounce: true },
  { icon: Award, x: "85%", y: "80%", delay: 4, rotate: -10, bounce: true },
  { icon: PenTool, x: "10%", y: "45%", delay: 4.8, rotate: 12, bounce: true },
  { icon: Star, x: "90%", y: "35%", delay: 5.6, rotate: -15, bounce: true }
];

// Learning tools with sequential appearance
const learningTools = [
  { icon: Calendar, x: "35%", y: "10%", delay: 1, size: 22 },
  { icon: Clock, x: "65%", y: "90%", delay: 1.5, size: 20 },
  { icon: CheckCircle, x: "8%", y: "30%", delay: 2, size: 24 },
  { icon: TrendingUp, x: "92%", y: "55%", delay: 2.5, size: 21 },
  { icon: Zap, x: "25%", y: "85%", delay: 3, size: 19 },
  { icon: Heart, x: "75%", y: "40%", delay: 3.5, size: 18 }
];

// Knowledge particles flowing upward
const knowledgeParticles = Array.from({ length: 15 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 6,
  size: Math.random() * 8 + 6,
  duration: Math.random() * 3 + 4
}));

// Achievement bubbles
const achievementBubbles = [
  { x: "40%", y: "35%", delay: 2, icon: Trophy },
  { x: "60%", y: "45%", delay: 4, icon: Users },
  { x: "50%", y: "60%", delay: 6, icon: Award }
];

const EducationAnimations = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Educational Icons with Bounce Effects */}
      {educationalIcons.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <motion.div
            key={index}
            className="absolute"
            style={{ left: item.x, top: item.y }}
            initial={{ 
              opacity: 0, 
              scale: 0.6,
              rotate: item.rotate,
              y: 30
            }}
            animate={{ 
              opacity: [0, 0.7, 0.5],
              scale: [0.6, 1.3, 1],
              rotate: [item.rotate, item.rotate + 360],
              y: [30, -15, 0, -8, 0]
            }}
            transition={{
              duration: 5,
              delay: item.delay,
              repeat: Infinity,
              ease: [0.68, -0.55, 0.265, 1.55], // Bounce easing
              times: [0, 0.4, 0.6, 0.8, 1]
            }}
          >
            <IconComponent 
              className="w-7 h-7 text-primary/50" 
              strokeWidth={1.8}
            />
          </motion.div>
        );
      })}

      {/* Learning Tools with Pop Effects */}
      {learningTools.map((tool, index) => {
        const IconComponent = tool.icon;
        return (
          <motion.div
            key={`tool-${index}`}
            className="absolute"
            style={{ left: tool.x, top: tool.y }}
            initial={{ 
              opacity: 0, 
              scale: 0.3
            }}
            animate={{ 
              opacity: [0, 1, 0.6, 1],
              scale: [0.3, 1.4, 0.9, 1.1],
              rotate: [0, 15, -10, 0]
            }}
            transition={{
              duration: 6,
              delay: tool.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <IconComponent 
              className="text-accent/60" 
              size={tool.size}
              strokeWidth={1.6}
            />
          </motion.div>
        );
      })}

      {/* Knowledge Particles Flowing Upward */}
      {knowledgeParticles.map((particle, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute rounded-full bg-gradient-to-r from-primary/30 to-accent/40"
          style={{ 
            left: `${particle.x}%`, 
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ 
            opacity: [0, 0.8, 0.4, 0],
            scale: [0, 1.2, 0.8, 0],
            y: [0, -50, -100, -150]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Achievement Bubbles */}
      {achievementBubbles.map((bubble, index) => {
        const IconComponent = bubble.icon;
        return (
          <motion.div
            key={`achievement-${index}`}
            className="absolute"
            style={{ left: bubble.x, top: bubble.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              scale: [0, 1.5, 1.2, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 4,
              delay: bubble.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="relative">
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary-rgb), 0.3)",
                    "0 0 0 20px rgba(var(--primary-rgb), 0)",
                    "0 0 0 0 rgba(var(--primary-rgb), 0)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              >
                <IconComponent className="w-6 h-6 text-primary/70" strokeWidth={2} />
              </motion.div>
            </div>
          </motion.div>
        );
      })}

      {/* Learning Progress Rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={`progress-ring-${ring}`}
          className="absolute border-2 border-primary/15 rounded-full"
          style={{
            left: `${25 + ring * 20}%`,
            top: `${35 + ring * 10}%`,
            width: `${30 + ring * 15}px`,
            height: `${30 + ring * 15}px`
          }}
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            scale: [0, 1.5, 1],
            opacity: [0, 0.6, 0.2],
            rotate: [0, 360]
          }}
          transition={{
            duration: 8,
            delay: ring * 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Learning Path Connections */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.path
          d="M 15% 20% Q 45% 35% 75% 25% Q 85% 45% 80% 65%"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="8,12"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0.3],
            opacity: [0, 0.7, 0.3]
          }}
          transition={{
            duration: 10,
            delay: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.path
          d="M 20% 70% Q 50% 50% 75% 40% Q 90% 35% 85% 15%"
          stroke="hsl(var(--accent) / 0.15)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6,8"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0.4],
            opacity: [0, 0.6, 0.2]
          }}
          transition={{
            duration: 12,
            delay: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>

      {/* Lightbulb Moments - Periodic Bright Flashes */}
      <motion.div
        className="absolute"
        style={{ left: "50%", top: "30%" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0.8, 0],
          scale: [0, 2, 1.5, 0],
        }}
        transition={{
          duration: 1.5,
          delay: 6,
          repeat: Infinity,
          repeatDelay: 8,
          ease: "easeOut"
        }}
      >
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400/40 to-amber-300/40 rounded-full flex items-center justify-center">
          <Lightbulb className="w-8 h-8 text-yellow-500/80" strokeWidth={2} />
        </div>
      </motion.div>
    </div>
  );
};

export default EducationAnimations;