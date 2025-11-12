import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import { cn } from "@/lib/utils";

interface PillAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "success" | "danger";
}

interface PillActionButtonsProps {
  actions: PillAction[];
  className?: string;
}

export function PillActionButtons({ actions, className }: PillActionButtonsProps) {
  const { triggerHapticFeedback } = useMobileOptimizations();

  const getVariantClasses = (variant: PillAction["variant"] = "default") => {
    const variants = {
      default: "bg-muted/50 hover:bg-muted text-foreground",
      primary: "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30",
      success: "bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30",
      danger: "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30",
    };
    return variants[variant];
  };

  const handleClick = (action: PillAction) => {
    triggerHapticFeedback("medium");
    action.onClick();
  };

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(action)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors",
              getVariantClasses(action.variant)
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
