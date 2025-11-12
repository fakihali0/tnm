import React, { memo, useRef, useEffect } from "react";
import { MobileComparisonCard } from "./MobileComparisonCard";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { getScrollBehavior } from "@/utils/scroll";
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
  marginCurrency?: string;
}

interface MobileComparisonCarouselProps {
  instruments: InstrumentData[];
  onRemove: (symbol: string) => void;
  spreadType: "zero" | "raw";
  comparisonRows: Array<{
    key: string;
    label: string;
    getValue: (inst: InstrumentData) => string;
  }>;
}

export const MobileComparisonCarousel = memo(({
  instruments,
  onRemove,
  spreadType,
  comparisonRows
}: MobileComparisonCarouselProps) => {
  const { t } = useTranslation(['common', 'translation']);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest instrument when added
  useEffect(() => {
    if (scrollRef.current && instruments.length > 0) {
      const scrollContainer = scrollRef.current;
      const isAtEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 50;
      
      // Only auto-scroll if user is near the end or this is the first item
      if (isAtEnd || instruments.length === 1) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            left: scrollContainer.scrollWidth,
            behavior: getScrollBehavior()
          });
        }, 100);
      }
    }
  }, [instruments.length]);

  if (instruments.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-muted-foreground">
            {t('instruments.compare.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={SPACING.stack.comfortable}>
      {/* Comparison Summary */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">
          {t('instruments.compare.mobileTitle', { count: instruments.length })}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('instruments.compare.swipeHint')}
        </p>
      </div>

      {/* Horizontal Scrolling Cards */}
      <div 
        ref={scrollRef}
        className={`flex ${SPACING.gap.medium} overflow-x-auto pb-4 snap-x snap-mandatory`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {instruments.map((instrument, index) => (
          <div key={instrument.symbol} className="flex-none w-80 snap-start">
            <MobileComparisonCard
              instrument={instrument}
              onRemove={onRemove}
              spreadType={spreadType}
              comparisonRows={comparisonRows}
            />
          </div>
        ))}
      </div>

      {/* Scroll Indicators */}
      {instruments.length > 1 && (
        <div className={`flex justify-center ${SPACING.gap.small} pt-2`}>
          {instruments.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-muted transition-colors"
              style={{
                backgroundColor: index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
              }}
            />
          ))}
        </div>
      )}

      {/* Quick Stats Comparison */}
      <div className={`bg-muted/50 rounded-lg ${SPACING.padding.cardSmall} ${SPACING.stack.normal}`}>
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          {t('instruments.compare.quickStats')}
        </h4>
        <div className={`grid grid-cols-3 ${SPACING.gap.medium} text-center`}>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t('instruments.compare.avgSpread')}
            </div>
            <div className="font-semibold text-sm">
              {(instruments.reduce((sum, inst) => sum + inst.spread[spreadType], 0) / instruments.length).toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t('instruments.compare.maxLeverage')}
            </div>
            <div className="font-semibold text-sm">
              1:{Math.max(...instruments.map(inst => inst.leverage))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t('instruments.compare.assetTypes')}
            </div>
            <div className="font-semibold text-sm">
              {new Set(instruments.map(inst => inst.assetClass)).size}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MobileComparisonCarousel.displayName = "MobileComparisonCarousel";