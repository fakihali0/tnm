import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, TrendingUp, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { createRevealVariants } from "@/components/animation/variants";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { SPACING } from "@/styles/spacing";

interface InstrumentData {
  symbol: string;
  name: string;
  assetClass: string;
  spread: {
    zero: number;
    raw: number;
  };
  leverage: number;
  tradingHours: string;
  swapLong: number;
  swapShort: number;
  contractSize: string;
  minTrade: string;
  isFavorite?: boolean;
  isMarketOpen?: boolean;
  volatility?: "low" | "medium" | "high";
}

interface InstrumentCardProps {
  instrument: InstrumentData;
  spreadType: "zero" | "raw";
  onDetails: (instrument: InstrumentData) => void;
  onCompare: (instrument: InstrumentData) => void;
  onToggleFavorite: (symbol: string) => void;
  isInCompare: boolean;
}

export function InstrumentCard({
  instrument,
  spreadType,
  onDetails,
  onCompare,
  onToggleFavorite,
  isInCompare
}: InstrumentCardProps) {
  const { t } = useTranslation('common');
  const { motionProps, transition } = useSectionAnimation({
    amount: 0.2,
    duration: 0.4
  });

  const getAssetClassColor = (assetClass: string) => {
    const colors = {
      forex: "bg-blue-100 text-blue-800",
      indices: "bg-green-100 text-green-800",
      commodities: "bg-yellow-100 text-yellow-800",
      crypto: "bg-purple-100 text-purple-800"
    };
    return colors[assetClass as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getVolatilityColor = (volatility?: string) => {
    const colors = {
      low: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700"
    };
    return volatility ? colors[volatility as keyof typeof colors] : "";
  };

  // Stable sparkline data to prevent flickering
  const sparklineData = useMemo(() => {
    const seed = instrument.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (index: number) => (Math.sin(seed + index) + 1) / 2;
    return Array.from({ length: 12 }, (_, i) => 20 + random(i) * 60);
  }, [instrument.symbol]);

  const currentSpread = instrument.spread[spreadType];

  return (
    <motion.div
      animate={motionProps.animate ? {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
      } : { opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      className="safari-animation-fix"
    >
      <Card className="trading-card group h-full cursor-pointer min-h-[280px] sm:min-h-[320px]">
        <CardHeader className={`pb-3 ${SPACING.padding.card}`}>
        <div className="flex items-start justify-between">
          <div className={SPACING.stack.compact}>
            <div className={`flex items-center ${SPACING.gap.small}`}>
              <CardTitle className="font-poppins text-lg">{instrument.symbol}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(instrument.symbol)}
                  className="h-10 w-10 sm:h-8 sm:w-8 p-0 touch-manipulation"
                  aria-label={instrument.isFavorite ? t('instruments.card.removeFromFavorites') : t('instruments.card.addToFavorites')}
                >
                <Star 
                  className={`${SPACING.icon.sm} transition-colors ${
                    instrument.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  }`} 
                />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{instrument.name}</p>
            <div className={`flex flex-wrap ${SPACING.gap.small}`}>
                      <Badge className={getAssetClassColor(instrument.assetClass)}>
                        {t(`instruments.assetClasses.${instrument.assetClass}`)}
                      </Badge>
              {instrument.volatility && (
                <Badge variant="outline" className={getVolatilityColor(instrument.volatility)}>
                  {t(`instruments.filters.${instrument.volatility}`)}
                </Badge>
              )}
               <Badge variant={instrument.isMarketOpen ? "default" : "secondary"}>
                <Clock className={`${SPACING.icon.xs} mr-1`} />
                {instrument.isMarketOpen ? t('instruments.card.marketOpen') : t('instruments.card.marketClosed')}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${SPACING.stack.comfortable} ${SPACING.padding.card} pt-0`}>
        {/* Key Metrics */}
        <div className={`grid grid-cols-2 ${SPACING.gap.medium} text-sm`}>
          <div>
            <div className="text-muted-foreground">{t('instruments.card.typicalSpread')}</div>
            <div className="font-semibold">{currentSpread} {t('products.instruments.table.pips')}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t('instruments.card.leverage')}</div>
            <div className="font-semibold">1:{instrument.leverage}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t('instruments.card.tradingHours')}</div>
            <div className="font-semibold text-xs">{instrument.tradingHours}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t('products.instruments.table.swaps')} ({t('products.instruments.table.long')}/{t('products.instruments.table.short')})</div>
            <div className="font-semibold text-xs">
              {instrument.swapLong > 0 ? '+' : ''}{instrument.swapLong} / 
              {instrument.swapShort > 0 ? '+' : ''}{instrument.swapShort}
            </div>
          </div>
        </div>

        {/* Mini Sparkline Placeholder */}
        <div className={SPACING.stack.compact}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('instruments.card.performance24h')}</span>
            <TrendingUp className={`${SPACING.icon.sm} text-green-600`} />
          </div>
          <div className="h-8 bg-gradient-to-r from-muted to-muted/50 rounded flex items-end justify-between px-1">
            {sparklineData.map((height, i) => (
              <div
                key={i}
                className="w-0.5 bg-primary/60 rounded-full"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex ${SPACING.gap.small} pt-2`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDetails(instrument)}
            className={`flex-1 ${SPACING.touch.min} touch-manipulation`}
          >
            <Info className={`${SPACING.icon.sm} mr-1`} />
            <span className="hidden sm:inline">{t('instruments.card.details')}</span>
            <span className="sm:hidden">{t('instruments.card.details')}</span>
          </Button>
          <Button
            variant={isInCompare ? "default" : "outline"}
            size="sm"
            onClick={() => onCompare(instrument)}
            className={`flex-1 ${SPACING.touch.min} touch-manipulation`}
          >
            <span className="hidden sm:inline">
              {isInCompare ? t('instruments.card.removeFromCompare') : t('instruments.card.addToCompare')}
            </span>
            <span className="sm:hidden">
              {isInCompare ? t('common.remove') : t('common.compare')}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}