import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Info } from "lucide-react";
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

interface InstrumentTableProps {
  instruments: InstrumentData[];
  spreadType: "zero" | "raw";
  onDetails: (instrument: InstrumentData) => void;
  onCompare: (instrument: InstrumentData) => void;
  onToggleFavorite: (symbol: string) => void;
  compareList: string[];
}

export function InstrumentTable({
  instruments,
  spreadType,
  onDetails,
  onCompare,
  onToggleFavorite,
  compareList
}: InstrumentTableProps) {
  const { t } = useTranslation('common');
  const { motionProps, transition } = useSectionAnimation({
    amount: 0.1,
    duration: 0.5
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

  return (
    <motion.div
      variants={createRevealVariants({ direction: "up", distance: 30 })}
      transition={transition}
      {...motionProps}
      className="safari-animation-fix"
    >
      <div className="rounded-md border bg-card">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('instruments.table.symbol')} / {t('instruments.table.name')}</TableHead>
            <TableHead>{t('instruments.card.typicalSpread')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('instruments.card.tradingHours')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('products.instruments.table.swaps')} ({t('products.instruments.table.long')}/{t('products.instruments.table.short')})</TableHead>
            <TableHead>{t('instruments.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instruments.map((instrument) => {
            const isInCompare = compareList.includes(instrument.symbol);
            const currentSpread = instrument.spread[spreadType];

            return (
              <TableRow key={instrument.symbol} className="hover:bg-muted/50">
                <TableCell>
                  <div className={SPACING.stack.tight}>
                    <div className={`flex items-center ${SPACING.gap.small}`}>
                      <span className="font-medium">{instrument.symbol}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleFavorite(instrument.symbol)}
                        className="h-6 w-6 p-0"
                      >
                        <Star 
                          className={`${SPACING.icon.xs} ${
                            instrument.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                          }`} 
                        />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">{instrument.name}</div>
                    <div className={`flex ${SPACING.gap.iconButton}`}>
                      <Badge className={getAssetClassColor(instrument.assetClass)}>
                        {t(`instruments.assetClasses.${instrument.assetClass}`)}
                      </Badge>
                      <Badge variant={instrument.isMarketOpen ? "default" : "secondary"}>
                        <Clock className={`${SPACING.icon.xs} mr-1`} />
                        {instrument.isMarketOpen ? t('instruments.card.marketOpen') : t('instruments.card.marketClosed')}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                
                 <TableCell>
                   <span className="font-medium">{currentSpread} {t('products.instruments.table.pips')}</span>
                 </TableCell>
                
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm">{instrument.tradingHours}</span>
                </TableCell>
                
                <TableCell className="hidden lg:table-cell">
                  <div className="text-sm">
                    <span className={instrument.swapLong >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {instrument.swapLong > 0 ? '+' : ''}{instrument.swapLong}
                    </span>
                    {' / '}
                    <span className={instrument.swapShort >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {instrument.swapShort > 0 ? '+' : ''}{instrument.swapShort}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className={`flex ${SPACING.gap.iconButton}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDetails(instrument)}
                      className="h-8 px-2"
                    >
                      <Info className={SPACING.icon.xs} />
                    </Button>
                    <Button
                      variant={isInCompare ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onCompare(instrument)}
                      className="h-8 px-2 text-xs"
                    >
                      {isInCompare ? "✓" : "+"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </motion.div>
  );
}