import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";

interface ImmersiveHeroCardProps {
  balance: number;
  change: number;
  changePercent: number;
  accountName?: string;
}

export function ImmersiveHeroCard({ 
  balance, 
  change, 
  changePercent,
  accountName
}: ImmersiveHeroCardProps) {
  const { t } = useTranslation("tnm-ai");
  const [showBalance, setShowBalance] = useState(true);
  const { triggerHapticFeedback } = useMobileOptimizations();
  const isPositive = change >= 0;

  const handleToggleBalance = () => {
    triggerHapticFeedback("light");
    setShowBalance(!showBalance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6 mb-4"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <div className="relative z-10">
        {/* Account name and visibility toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{accountName || t("common.tradingAccount")}</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleBalance}
            className="p-2 rounded-full hover:bg-background/50 transition-colors"
          >
            {showBalance ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </motion.button>
        </div>

        {/* Balance */}
        <motion.div
          key={showBalance ? "visible" : "hidden"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3"
        >
          {showBalance ? (
            <h1 className="text-5xl font-bold tracking-tight">
              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          ) : (
            <h1 className="text-5xl font-bold tracking-tight">••••••</h1>
          )}
        </motion.div>

        {/* Change indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
            isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
          }`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">
              {isPositive ? "+" : ""}{showBalance ? change.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "••••"}
            </span>
          </div>
          <span className={`text-sm font-medium ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}>
            {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
          </span>
          <span className="text-xs text-muted-foreground">{t("common.today")}</span>
        </div>
      </div>
    </motion.div>
  );
}
