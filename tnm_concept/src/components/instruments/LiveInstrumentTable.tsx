import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, StarIcon } from "lucide-react";
import type { RealInstrumentData } from "@/hooks/useRealInstruments";
import { createRevealVariants } from "@/components/animation/variants";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { SPACING } from "@/styles/spacing";

interface LiveInstrumentTableProps {
  instruments: RealInstrumentData[];
  spreadType: "zero" | "raw";
  onDetails: (instrument: RealInstrumentData) => void;
  onCompare: (instrument: RealInstrumentData) => void;
  onToggleFavorite: (symbol: string) => void;
  compareList: string[];
}

const LiveInstrumentTable: React.FC<LiveInstrumentTableProps> = React.memo(({
  instruments,
  spreadType,
  onDetails,
  onCompare,
  onToggleFavorite,
  compareList,
}) => {
  const { t, i18n } = useTranslation(['common','translation']);
  const location = useLocation();
  const { motionProps, transition } = useSectionAnimation({
    amount: 0.1,
    duration: 0.5
  });
  const isRTL = i18n.language === 'ar';

  React.useEffect(() => {
    // Language sync handled by parent component
  }, [i18n.language, location.pathname]);

  const getAssetClassColor = (assetClass: string) => {
    const colors = {
      forex: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      indices: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      commodities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      crypto: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return colors[assetClass as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatSpread = (instrument: RealInstrumentData) => {
    const v = instrument?.spread?.[spreadType];
    if (v == null || !Number.isFinite(v) || v <= 0) return '—';
    return v.toFixed(1);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatPrice = React.useMemo(() => {
    return (price: number | string | null | undefined, assetClass: string): string => {
      const n = typeof price === 'string' ? parseFloat(price) : price;
      if (n === null || n === undefined || Number.isNaN(n)) return '—';
      
      switch (assetClass.toLowerCase()) {
        case 'indices':
          return n.toFixed(1);
        case 'commodities':
        case 'crypto':
          return n.toFixed(2);
        case 'forex':
          // JPY pairs typically have lower values
          if (n < 10 || n > 100) {
            return n.toFixed(3);
          }
          return n.toFixed(5);
        default:
          return n.toFixed(2);
      }
    };
  }, []);

  const getMarketStatus = (instrument: RealInstrumentData) => {
    const isOpen = instrument.isMarketOpen ?? false;
    
    return {
      isOpen,
      label: isOpen ? t("common.open") : t("common.closed"),
      className: isOpen 
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
  };

  // Calculate if we have any live data
  const hasLiveData = instruments.some(inst => inst.isLive);
  const latestUpdate = instruments.reduce((latest, inst) => {
    return inst.lastUpdate > latest ? inst.lastUpdate : latest;
  }, new Date(0));

  return (
    <motion.div
      variants={createRevealVariants({ direction: "up", distance: 30 })}
      transition={transition}
      {...motionProps}
      className="safari-animation-fix"
    >
      <div className="overflow-x-auto">
        <table className="w-full table-fixed" dir={isRTL ? 'rtl' : 'ltr'}>
          <colgroup>
            <col className="w-[16rem]" />
            <col className="w-[24rem]" />
            <col className="w-[14rem]" />
            <col className="w-[20rem]" />
            <col className="w-[12rem]" />
            <col className="w-[16rem]" />
            <col className="w-[16rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              <th className="text-start py-3 px-4 font-medium">{t("products.instruments.table.symbol")}</th>
              <th className="text-start py-3 px-4 font-medium">{t("products.instruments.table.name")}</th>
              <th className="text-start py-3 px-4 font-medium">{t("products.instruments.table.assetClass")}</th>
              <th className="text-end py-3 px-4 font-medium whitespace-nowrap">
                <div className="flex items-center gap-2 justify-end">
                  {t("products.instruments.table.livePrice")}
                  <span className="text-xs flex items-center gap-1 min-w-[120px] justify-end">
                    <div className={`w-2 h-2 rounded-full ${hasLiveData ? "bg-green-500 animate-pulse" : "bg-orange-500"}`} />
                    <span className={`${hasLiveData ? "text-green-500" : "text-orange-500"}`}>
                      {hasLiveData ? t("products.instruments.table.live") : "CACHED"} • {formatTimestamp(latestUpdate)}
                    </span>
                  </span>
                </div>
              </th>
              <th className="text-end py-3 px-4 font-medium">
                {t("products.instruments.table.typicalSpread")} ({t(`products.instruments.table.spreadType.${spreadType}`)})
              </th>
              <th className="text-start py-3 px-4 font-medium">{t("products.instruments.table.tradingHours")}</th>
              <th className="text-end py-3 px-4 font-medium">{t("products.instruments.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((instrument) => {
              const marketStatus = getMarketStatus(instrument);
              const isInCompare = compareList.includes(instrument.symbol);

              return (
                <tr key={instrument.symbol} className="border-b border-border hover:bg-muted/50 transition-colors duration-150 h-16">
                  <td className="py-3 px-4 text-start">
                    <div className={`flex items-center ${SPACING.gap.small} justify-start`}>
                      <button
                        onClick={() => onToggleFavorite(instrument.symbol)}
                        className="text-muted-foreground hover:text-yellow-500 transition-colors"
                      >
                        {instrument.isFavorite ? (
                          <StarIcon className={`${SPACING.icon.sm} fill-current text-yellow-500`} />
                        ) : (
                          <Star className={SPACING.icon.sm} />
                        )}
                      </button>
                        <div>
                          <div className="font-medium">{instrument.symbol}</div>
                          <div className={`flex items-center ${SPACING.gap.iconButton} text-sm text-muted-foreground justify-start`}>
                            <Clock className={SPACING.icon.xs} />
                          <Badge variant="secondary" className={marketStatus.className}>
                            {marketStatus.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-start text-sm whitespace-nowrap">{instrument.name}</td>
                  <td className="py-3 px-4 text-start">
                    <Badge variant="secondary" className={getAssetClassColor(instrument.assetClass)}>
                      {t(`tradingCalculator.assetClasses.${instrument.assetClass}`)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-end">
                    {(() => {
                      const rawBid: any = instrument.currentPrice?.bid;
                      const rawAsk: any = instrument.currentPrice?.ask;
                      if (import.meta.env.DEV && instruments.indexOf(instrument) < 5) {
                        console.log('[LiveInstrumentTable] row', { sym: instrument.symbol, bid: rawBid, ask: rawAsk, isLive: instrument.isLive });
                      }
                      const parseNum = (v: any) => (typeof v === 'string' ? parseFloat(v) : v);
                      const nBid = parseNum(rawBid);
                      const nAsk = parseNum(rawAsk);
                      const isFiniteBid = Number.isFinite(nBid);
                      const isFiniteAsk = Number.isFinite(nAsk);
                      const bidStr = isFiniteBid ? formatPrice(rawBid, instrument.assetClass) : '—';
                      const askStr = isFiniteAsk ? formatPrice(rawAsk, instrument.assetClass) : '—';
                      // Defensive fallback: if formatPrice returned "—" but we have finite numbers, show raw value
                      const bidOut = bidStr === '—' && isFiniteBid ? String(nBid) : bidStr;
                      const askOut = askStr === '—' && isFiniteAsk ? String(nAsk) : askStr;
                      const showNoQuote = bidOut === '—' && askOut === '—';
                      
                      return (
                        <div className={`${SPACING.stack.tight} min-w-[120px] text-end`} title={`bid=${rawBid}, ask=${rawAsk}`}>
                          <div className="text-sm text-foreground transition-colors duration-200">
                            <span className="text-muted-foreground">{t("products.instruments.table.bid")}:</span> {bidOut}
                          </div>
                          <div className="text-sm text-foreground transition-colors duration-200">
                            <span className="text-muted-foreground">{t("products.instruments.table.ask")}:</span> {askOut}
                          </div>
                          <div className={`text-xs flex items-center ${SPACING.gap.iconButton} justify-end`}>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1 py-0 ${instrument.isLive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}
                            >
                              {instrument.isLive ? 'LIVE' : 'CACHED'}
                            </Badge>
                            {showNoQuote && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 bg-orange-500/10 text-orange-500 border-orange-500/20"
                              >
                                No quote
                              </Badge>
                            )}
                            <span className="text-muted-foreground">
                              {formatTimestamp(instrument.lastUpdate)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-end">
                    <div className="min-w-[60px] text-end">
                      <span className="transition-colors duration-200">
                        {formatSpread(instrument)} {formatSpread(instrument) !== '—' && t("products.instruments.table.pips")}
                      </span>
                      {(() => {
                        const actual = instrument?.currentPrice?.spread;
                        const showActual = instrument.isLive && Number.isFinite(actual) && actual! > 0;
                        return showActual ? (
                          <div className="text-xs text-muted-foreground">
                            ({actual!.toFixed(1)} actual)
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-start text-sm">{instrument.tradingHours}</td>
                  <td className="py-3 px-4 text-end">
                    <div className={`flex flex-col ${SPACING.gap.iconButton} min-w-[120px] items-end`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDetails(instrument)}
                        className="h-8 px-3 text-xs whitespace-nowrap"
                      >
                        {t("products.instruments.table.details")}
                      </Button>
                      <Button
                        variant={isInCompare ? "default" : "outline"}
                        size="sm"
                        onClick={() => onCompare(instrument)}
                        className="h-8 px-3 text-xs whitespace-nowrap"
                      >
                        {isInCompare ? t("products.instruments.table.remove") : t("products.instruments.table.compare")}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
});

LiveInstrumentTable.displayName = 'LiveInstrumentTable';

export default LiveInstrumentTable;
