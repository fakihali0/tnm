import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Clock, Info, ExternalLink, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AUTH_URLS } from "@/utils/auth-redirects";
import { Link } from "react-router-dom";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
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
  tickSize?: string;
  tickValue?: string;
  marginCurrency?: string;
  holidaySchedule?: string;
}

interface InstrumentDetailsProps {
  instrument: InstrumentData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spreadType: "zero" | "raw";
  onToggleFavorite: (symbol: string) => void;
}

export function InstrumentDetails({
  instrument,
  open,
  onOpenChange,
  spreadType,
  onToggleFavorite
}: InstrumentDetailsProps) {
  const { t } = useTranslation('common');
  const { localizePath } = useLocalizedPath();

  if (!instrument) return null;

  const getAssetClassColor = (assetClass: string) => {
    const colors = {
      forex: "bg-blue-100 text-blue-800",
      indices: "bg-green-100 text-green-800",
      commodities: "bg-yellow-100 text-yellow-800",
      crypto: "bg-purple-100 text-purple-800"
    };
    return colors[assetClass as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const currentSpread = instrument.spread[spreadType];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[640px] overflow-y-auto">
        <SheetHeader className={SPACING.stack.comfortable}>
          <div className="flex items-start justify-between">
            <div className={SPACING.stack.compact}>
              <div className={`flex items-center ${SPACING.gap.small}`}>
                <SheetTitle className="font-poppins text-2xl">{instrument.symbol}</SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(instrument.symbol)}
                  className="h-8 w-8 p-0"
                >
                  <Star 
                    className={`${SPACING.icon.sm} ${
                      instrument.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                    }`} 
                  />
                </Button>
              </div>
              <SheetDescription className="text-base">{instrument.name}</SheetDescription>
              <div className={`flex ${SPACING.gap.small}`}>
                <Badge className={getAssetClassColor(instrument.assetClass)}>
                  {t(`instruments.assetClasses.${instrument.assetClass}`)}
                </Badge>
                <Badge variant={instrument.isMarketOpen ? "default" : "secondary"}>
                  <Clock className={`${SPACING.icon.xs} mr-1`} />
                  {instrument.isMarketOpen ? t('instruments.card.marketOpen') : t('instruments.card.marketClosed')}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <Tabs defaultValue="specs" className={SPACING.gap.card}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="specs">{t('instruments.details.tabs.specs')}</TabsTrigger>
            <TabsTrigger value="hours">{t('instruments.details.tabs.hours')}</TabsTrigger>
            <TabsTrigger value="costs">{t('instruments.details.tabs.costs')}</TabsTrigger>
            <TabsTrigger value="chart">{t('instruments.details.tabs.chart')}</TabsTrigger>
          </TabsList>

          <TabsContent value="specs" className={SPACING.stack.comfortable}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('instruments.details.tradingSpecifications')}</CardTitle>
              </CardHeader>
              <CardContent className={SPACING.stack.comfortable}>
                <div className={`grid grid-cols-2 ${SPACING.gap.medium}`}>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('instruments.details.maxLeverage')}</div>
                    <div className="font-semibold">1:{instrument.leverage}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('instruments.details.contractSize')}</div>
                    <div className="font-semibold">{instrument.contractSize}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('instruments.details.minTradeSize')}</div>
                    <div className="font-semibold">{instrument.minTrade}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('instruments.details.marginCurrency')}</div>
                    <div className="font-semibold">{instrument.marginCurrency || "USD"}</div>
                  </div>
                  {instrument.tickSize && (
                    <div>
                      <div className="text-sm text-muted-foreground">{t('instruments.details.tickSize')}</div>
                      <div className="font-semibold">{instrument.tickSize}</div>
                    </div>
                  )}
                  {instrument.tickValue && (
                    <div>
                      <div className="text-sm text-muted-foreground">{t('instruments.details.tickValue')}</div>
                      <div className="font-semibold">{instrument.tickValue}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className={SPACING.stack.comfortable}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('instruments.details.tradingHours')}</CardTitle>
              </CardHeader>
              <CardContent className={SPACING.stack.comfortable}>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">{t('instruments.details.weeklySchedule')}</div>
                  <div className="font-semibold">{instrument.tradingHours}</div>
                </div>
                {instrument.holidaySchedule && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">{t('instruments.details.holidaySchedule')}</div>
                    <div className="text-sm">{instrument.holidaySchedule}</div>
                  </div>
                )}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm">
                    <Info className={`${SPACING.icon.sm} inline mr-2`} />
                    {t('instruments.details.hoursNote')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className={SPACING.stack.comfortable}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('instruments.details.tradingCosts')}</CardTitle>
              </CardHeader>
              <CardContent className={SPACING.stack.comfortable}>
                <div className={SPACING.stack.normal}>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      {t('instruments.details.typicalSpreadWithType', { type: spreadType === 'zero' ? t('instruments.filters.zeroCommission') : t('instruments.filters.raw') })}
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <Info className={SPACING.icon.xs} />
                      </Button>
                    </div>
                    <div className="font-semibold text-lg">{currentSpread} {t('products.instruments.table.pips')}</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      {t('instruments.details.swapRates')}
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <Info className={SPACING.icon.xs} />
                      </Button>
                    </div>
                    <div className="flex gap-4">
                       <div>
                         <div className="text-xs text-muted-foreground">{t('products.instruments.table.long')}</div>
                         <div className={`font-semibold ${instrument.swapLong >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {instrument.swapLong > 0 ? '+' : ''}{instrument.swapLong}
                         </div>
                       </div>
                       <div>
                         <div className="text-xs text-muted-foreground">{t('products.instruments.table.short')}</div>
                        <div className={`font-semibold ${instrument.swapShort >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {instrument.swapShort > 0 ? '+' : ''}{instrument.swapShort}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`bg-muted/50 p-3 rounded-lg ${SPACING.stack.compact}`}>
                  <div className="text-sm font-medium">{t('instruments.details.costsInfoTitle')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('instruments.details.costsInfoText')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart" className={SPACING.stack.comfortable}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('instruments.details.priceChart')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Placeholder for TradingView chart */}
                <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-center justify-center">
                  <div className={`text-center ${SPACING.stack.compact}`}>
                    <TrendingUp className={`${SPACING.icon.xl} mx-auto text-muted-foreground`} />
                      <div className="text-sm text-muted-foreground">
                        {t('instruments.details.chartComingSoon')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('instruments.details.realTimeDataFor', { symbol: instrument.symbol })}
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className={`pt-6 ${SPACING.stack.comfortable}`}>
          <div className={`flex ${SPACING.gap.small}`}>
            <Button asChild className="flex-1 gradient-bg text-white">
              <a 
                href={AUTH_URLS.REGISTRATION} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {t('instruments.details.openAccount')}
                <ExternalLink className={`${SPACING.icon.sm} ml-2`} />
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to={localizePath("/products/account-types")}>
                {t('instruments.details.compareAccounts')}
              </Link>
            </Button>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to={localizePath("/products/platforms")}>
              {t('instruments.details.platformMT5')}
              <ExternalLink className={`${SPACING.icon.sm} ml-2`} />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}