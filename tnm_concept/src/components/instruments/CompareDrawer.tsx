import React, { memo, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { X, Download, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileComparisonCarousel } from "./MobileComparisonCarousel";
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

interface CompareDrawerProps {
  instruments: InstrumentData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (symbol: string) => void;
  spreadType: "zero" | "raw";
}

const CompareDrawerComponent = memo(({
  instruments,
  open,
  onOpenChange,
  onRemove,
  spreadType
}: CompareDrawerProps) => {
  const { t } = useTranslation(['common','translation']);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const comparisonRows = useMemo(() => [
    { key: "symbol", label: t('instruments.table.symbol'), getValue: (inst: InstrumentData) => inst.symbol },
    { key: "name", label: t('instruments.table.name'), getValue: (inst: InstrumentData) => inst.name },
    { key: "assetClass", label: t('products.instruments.table.assetClass'), getValue: (inst: InstrumentData) => inst.assetClass },
    { key: "spread", label: t('instruments.card.typicalSpread'), getValue: (inst: InstrumentData) => `${inst.spread[spreadType]} ${t('products.instruments.table.pips')}` },
    { key: "leverage", label: t('instruments.details.maxLeverage'), getValue: (inst: InstrumentData) => `1:${inst.leverage}` },
    { key: "contractSize", label: t('instruments.details.contractSize'), getValue: (inst: InstrumentData) => inst.contractSize },
    { key: "minTrade", label: t('instruments.details.minTradeSize'), getValue: (inst: InstrumentData) => inst.minTrade },
    { key: "tradingHours", label: t('instruments.table.tradingHours'), getValue: (inst: InstrumentData) => inst.tradingHours },
    { key: "swaps", label: t('instruments.compare.swapsLS'), getValue: (inst: InstrumentData) => `${inst.swapLong} / ${inst.swapShort}` },
    { key: "marginCurrency", label: t('instruments.details.marginCurrency'), getValue: (inst: InstrumentData) => inst.marginCurrency || "USD" }
  ], [t, spreadType]);

  const copyToClipboard = useMemo(() => () => {
    const headers = ["Specification", ...instruments.map(inst => inst.symbol)];
    const rows = comparisonRows.map(row => [
      row.label,
      ...instruments.map(inst => row.getValue(inst))
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join("\t"))
      .join("\n");
    
    navigator.clipboard.writeText(csvContent).then(() => {
      toast({
        title: t('instruments.compare.copySuccessTitle'),
        description: t('instruments.compare.copySuccessDesc')
      });
    }).catch(() => {
      toast({
        title: t('instruments.compare.copyError'),
        description: t('instruments.compare.copyErrorDesc'),
        variant: "destructive"
      });
    });
  }, [instruments, comparisonRows, toast, t]);

  const downloadCSV = useMemo(() => () => {
    const headers = ["Specification", ...instruments.map(inst => inst.symbol)];
    const rows = comparisonRows.map(row => [
      row.label,
      ...instruments.map(inst => row.getValue(inst))
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instrument-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: t('instruments.compare.downloadStartedTitle'),
      description: t('instruments.compare.downloadStartedDesc')
    });
  }, [instruments, comparisonRows, toast, t]);

  const getAssetClassColor = useMemo(() => (assetClass: string) => {
    const colors = {
      forex: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      indices: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      commodities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      crypto: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };
    return colors[assetClass as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className={`${isMobile ? 'h-[85vh]' : 'h-[80vh]'} flex flex-col`}
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
          <SheetTitle className="font-poppins text-xl">
            {isMobile 
              ? t('instruments.compare.mobileTitle', { count: instruments.length })
              : t('instruments.compare.title', { count: instruments.length })
            }
          </SheetTitle>
          <div className={`flex ${SPACING.gap.small}`}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              className="touch-target no-tap-highlight"
            >
              <Copy className={`${SPACING.icon.sm} mr-2`} />
              {isMobile ? t('instruments.compare.copyShort') : t('instruments.compare.copy')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadCSV}
              className="touch-target no-tap-highlight"
            >
              <Download className={`${SPACING.icon.sm} mr-2`} />
              {isMobile ? t('instruments.compare.exportShort') : t('instruments.compare.exportCsv')}
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            <div className="h-full overflow-y-auto">
              <MobileComparisonCarousel
                instruments={instruments}
                onRemove={onRemove}
                spreadType={spreadType}
                comparisonRows={comparisonRows}
              />
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">{t('instruments.compare.specification')}</TableHead>
                    {instruments.map((instrument) => (
                      <TableHead key={instrument.symbol} className="min-w-[120px]">
                      <div className="flex items-center justify-between">
                          <div className={SPACING.stack.tight}>
                            <div className="font-semibold">{instrument.symbol}</div>
                            <div className="text-xs text-muted-foreground">{instrument.name}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(instrument.symbol)}
                            className="h-6 w-6 p-0"
                          >
                            <X className={SPACING.icon.xs} />
                          </Button>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      {instruments.map((instrument) => (
                        <TableCell key={instrument.symbol}>
                          {row.key === "assetClass" ? (
                            <Badge className={getAssetClassColor(row.getValue(instrument))}>
                              {t(`instruments.assetClasses.${row.getValue(instrument)}`)}
                            </Badge>
                          ) : (
                            <span className="text-sm">{row.getValue(instrument)}</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});

CompareDrawerComponent.displayName = "CompareDrawer";

export const CompareDrawer = CompareDrawerComponent;