import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

interface MobileComparisonCardProps {
  instrument: InstrumentData;
  onRemove: (symbol: string) => void;
  spreadType: "zero" | "raw";
  comparisonRows: Array<{
    key: string;
    label: string;
    getValue: (inst: InstrumentData) => string;
  }>;
}

export const MobileComparisonCard = memo(({
  instrument,
  onRemove,
  spreadType,
  comparisonRows
}: MobileComparisonCardProps) => {
  const { t } = useTranslation(['common', 'translation']);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getAssetClassColor = (assetClass: string) => {
    const colors = {
      forex: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      indices: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      commodities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      crypto: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };
    return colors[assetClass as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  // Essential data (always visible)
  const essentialData = comparisonRows.filter(row => 
    ['spread', 'leverage', 'tradingHours'].includes(row.key)
  );

  // Detailed data (collapsible)
  const detailedData = comparisonRows.filter(row => 
    !['symbol', 'name', 'assetClass', 'spread', 'leverage', 'tradingHours'].includes(row.key)
  );

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className={`flex items-start justify-between ${SPACING.gap.button}`}>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {instrument.symbol}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {instrument.name}
            </p>
            <Badge className={`${getAssetClassColor(instrument.assetClass)} mt-2`}>
              {t(`instruments.assetClasses.${instrument.assetClass}`)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(instrument.symbol)}
            className="touch-target no-tap-highlight touch-feedback text-muted-foreground hover:text-destructive"
          >
            <X className={SPACING.icon.sm} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className={SPACING.stack.normal}>
        {/* Essential Data - Always Visible */}
        <div className={SPACING.stack.compact}>
          {essentialData.map((row) => (
            <div key={row.key} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">
                {row.label}:
              </span>
              <span className="text-sm font-semibold text-right">
                {row.getValue(instrument)}
              </span>
            </div>
          ))}
        </div>

        {/* Collapsible Detailed Data */}
        {detailedData.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between touch-target no-tap-highlight touch-feedback p-2 h-auto"
              >
                <span className="text-sm text-muted-foreground">
                  {isExpanded ? t('instruments.compare.showLess') : t('instruments.compare.showMore')}
                </span>
                {isExpanded ? (
                  <ChevronUp className={SPACING.icon.sm} />
                ) : (
                  <ChevronDown className={SPACING.icon.sm} />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className={`${SPACING.stack.compact} mt-2`}>
              {detailedData.map((row) => (
                <div key={row.key} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-medium">
                    {row.label}:
                  </span>
                  <span className="text-sm font-semibold text-right">
                    {row.getValue(instrument)}
                  </span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
});

MobileComparisonCard.displayName = "MobileComparisonCard";