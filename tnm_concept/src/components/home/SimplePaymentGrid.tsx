import { CreditCard, Smartphone, Wallet, Building, Coins, Bitcoin } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";

interface SimplePaymentGridProps {
  className?: string;
}

const paymentMethods = [
  {
    id: 'cards',
    name: 'Cards',
    icon: CreditCard,
  },
  {
    id: 'ewallet',
    name: 'E-Wallets',
    icon: Wallet,
  },
  {
    id: 'mobile',
    name: 'Mobile',
    icon: Smartphone,
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: Building,
  },
  {
    id: 'whish',
    name: 'Whish Money',
    icon: Coins,
  },
  {
    id: 'crypto',
    name: 'Crypto',
    icon: Bitcoin,
  }
];

export function SimplePaymentGrid({ className }: SimplePaymentGridProps) {
  const { i18n } = useTranslation();
  const {
    motionProps,
    transition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.25, delay: 0.1 });

  const isRTL = i18n.language === 'ar';

  const containerVariants = resolveMotionVariants(
    createStaggerContainer({ stagger: 0.08, delayChildren: 0.1 }),
    prefersReducedMotion
  );

  const cardVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 24, transition }),
    prefersReducedMotion
  );

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    hover: { 
      scale: 1.1, 
      rotate: [0, -2, 2, 0],
      transition: { duration: 0.4, ease: "easeInOut" }
    }
  };

  return (
    <motion.div 
      className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6", className)}
      {...motionProps}
      variants={containerVariants}
    >
      {paymentMethods.map((method, index) => (
        <motion.div
          key={method.id}
          className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card/50 p-4 text-center transition-all duration-300 hover:bg-card/80 hover:border-border/60 hover:shadow-md hover:-translate-y-1 cursor-pointer group"
          variants={cardVariants}
          whileHover="hover"
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-200"
            variants={iconVariants}
          >
            <method.icon className="h-5 w-5 text-primary transition-colors duration-200" />
          </motion.div>
          <motion.span 
            className={cn(
              "text-xs font-medium text-foreground break-words leading-tight",
              isRTL ? "text-right" : "text-center"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
          >
            {method.name}
          </motion.span>
        </motion.div>
      ))}
    </motion.div>
  );
}