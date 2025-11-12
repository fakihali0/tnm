import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { SPACING } from "@/styles/spacing";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, TrendingUp, Shield, ArrowDown, ArrowUp, Target, Percent, ToggleLeft, ToggleRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useRealInstruments } from "@/hooks/useRealInstruments";
import { RiskPresets } from "@/components/risk-calculator/RiskPresets";
import { RiskGauge } from "@/components/risk-calculator/RiskGauge";
import { RiskComparisonTable } from "@/components/risk-calculator/RiskComparisonTable";

interface CalculatorResults {
  stopLossPrice: number;
  takeProfitPrice: number;
  riskAmount: number;
  potentialProfit: number;
  riskPercentage: number;
  positionValue: number;
  requiredMargin: number;
  riskRewardRatio: number;
  recommendedLotSize?: number;
  pipValue: number;
}

export function TradingCalculator() {
  const { t } = useTranslation('common');
  const { instruments } = useRealInstruments();
  const [calculatorMode, setCalculatorMode] = useState<"risk-assessment" | "position-sizing">("risk-assessment");
  
  // String inputs to allow proper editing and deletion
  const [positionSizeInput, setPositionSizeInput] = useState("1");
  const [entryPriceInput, setEntryPriceInput] = useState("1.1000");
  const [stopLossDistanceInput, setStopLossDistanceInput] = useState("20");
  const [takeProfitDistanceInput, setTakeProfitDistanceInput] = useState("40");
  const [accountBalanceInput, setAccountBalanceInput] = useState("10000");
  const [riskPercentageInput, setRiskPercentageInput] = useState("2");
  const [targetRRRInput, setTargetRRRInput] = useState("2");
  
  const [selectedInstrument, setSelectedInstrument] = useState("EURUSD");
  const [positionType, setPositionType] = useState<"buy" | "sell">("buy");
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>("all");
  
  // New RRR functionality state
  const [rrrInputMode, setRrrInputMode] = useState<"manual-tp" | "auto-tp">("manual-tp");

  // Helper function to safely convert string to number
  const safeToNumber = (value: string, fallback: number = 0): number => {
    const num = parseFloat(value);
    return isNaN(num) || value === "" ? fallback : num;
  };

  // Convert string inputs to numbers for calculations
  const positionSize = safeToNumber(positionSizeInput, 1);
  const entryPrice = safeToNumber(entryPriceInput, 1.1000);
  const stopLossDistance = safeToNumber(stopLossDistanceInput, 20);
  const takeProfitDistance = safeToNumber(takeProfitDistanceInput, 40);
  const accountBalance = safeToNumber(accountBalanceInput, 10000);
  const riskPercentage = safeToNumber(riskPercentageInput, 2);
  const targetRRR = safeToNumber(targetRRRInput, 2);

  const instrument = useMemo(() => {
    if (!instruments || instruments.length === 0) {
      return null;
    }
    return instruments.find(inst => inst.symbol === selectedInstrument) || instruments[0];
  }, [selectedInstrument, instruments]);

  // Get available instruments based on selected asset class (always call hooks in the same order)
  const availableInstruments = useMemo(() => {
    const arr = instruments ?? [];
    if (selectedAssetClass === "all") {
      return arr;
    }
    return arr.filter(inst => inst.assetClass === selectedAssetClass);
  }, [instruments, selectedAssetClass]);

  const calculations = useMemo((): CalculatorResults => {
    // Return default values if no instrument is available
    if (!instrument) {
      return {
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmount: 0,
        potentialProfit: 0,
        riskPercentage: 0,
        positionValue: 0,
        requiredMargin: 0,
        riskRewardRatio: 0,
        recommendedLotSize: undefined,
        pipValue: 0
      };
    }

    // Enhanced pip/point value calculation per asset class
    let pipValue: number;
    let contractSize: number;
    let pipSizeAdjustment: number;
    let fixedMarginPerLot: number; // Fixed margin requirement per lot
    let priceDecimalPlaces: number; // Decimal places for price formatting
    
    switch (instrument.assetClass) {
      case "forex":
        pipValue = 10; // $10 per pip for standard lot
        contractSize = parseInt(instrument.contractSize) || 100000;
        pipSizeAdjustment = 0.0001; // 1 pip = 0.0001 for most forex pairs
        fixedMarginPerLot = 500; // $500 per lot for forex
        priceDecimalPlaces = 5; // Most forex pairs use 5 decimal places
        break;
      case "indices":
        contractSize = parseInt(instrument.contractSize) || 1;
        pipValue = contractSize; // $ per point equals contract size
        pipSizeAdjustment = 1; // 1 point = 1 for indices
        fixedMarginPerLot = 1000; // $1000 per lot for indices
        priceDecimalPlaces = 2; // Indices typically use 2 decimal places
        break;
      case "commodities":
        pipValue = instrument.symbol === "XAUUSD" ? 10 : 1; // Gold vs other commodities
        contractSize = parseInt(instrument.contractSize) || 100;
        pipSizeAdjustment = instrument.symbol === "XAUUSD" ? 0.1 : 0.01;
        fixedMarginPerLot = 1000; // $1000 per lot for commodities
        priceDecimalPlaces = instrument.symbol === "XAUUSD" ? 2 : 3; // Gold uses 2, others use 3
        break;
      case "crypto":
        pipValue = 1;
        contractSize = parseInt(instrument.contractSize) || 1;
        pipSizeAdjustment = 1;
        fixedMarginPerLot = 1000; // $1000 per lot for crypto
        priceDecimalPlaces = 2; // Crypto typically uses 2 decimal places
        break;
      default:
        pipValue = 1;
        contractSize = 1;
        pipSizeAdjustment = 0.0001;
        fixedMarginPerLot = 1000;
        priceDecimalPlaces = 5;
    }
    
    let currentPositionSize = positionSize;
    let recommendedLotSize: number | undefined;
    
    // For position sizing mode, calculate recommended lot size
    if (calculatorMode === "position-sizing") {
      const riskAmountFromPercentage = accountBalance * (riskPercentage / 100);
      recommendedLotSize = riskAmountFromPercentage / (stopLossDistance * pipValue);
      currentPositionSize = recommendedLotSize;
    }
    
    // Handle RRR bidirectional calculation
    let finalTakeProfitDistance = takeProfitDistance;
    if (rrrInputMode === "auto-tp" && stopLossDistance > 0) {
      finalTakeProfitDistance = stopLossDistance * targetRRR;
    }
    
    // Calculate actual price distances
    const stopLossDistancePrice = stopLossDistance * pipSizeAdjustment;
    const takeProfitDistancePrice = finalTakeProfitDistance * pipSizeAdjustment;
    
    // Calculate exit prices based on position type
    const stopLossPrice = positionType === "buy" 
      ? entryPrice - stopLossDistancePrice 
      : entryPrice + stopLossDistancePrice;
      
    const takeProfitPrice = positionType === "buy" 
      ? entryPrice + takeProfitDistancePrice 
      : entryPrice - takeProfitDistancePrice;
    
    // Calculate risk and profit amounts using current position size
    const riskAmount = stopLossDistance * pipValue * currentPositionSize;
    const potentialProfit = finalTakeProfitDistance * pipValue * currentPositionSize;
    const riskPercentageCalculated = (riskAmount / accountBalance) * 100;
    const positionValue = currentPositionSize * contractSize * entryPrice;
    const requiredMargin = currentPositionSize * fixedMarginPerLot; // Use fixed margin per lot
    const riskRewardRatio = stopLossDistance > 0 ? finalTakeProfitDistance / stopLossDistance : 0;
    
    // Dynamic price formatting based on instrument
    const formatPrice = (price: number) => {
      const multiplier = Math.pow(10, priceDecimalPlaces);
      return Math.round(price * multiplier) / multiplier;
    };

    return {
      stopLossPrice: formatPrice(stopLossPrice),
      takeProfitPrice: formatPrice(takeProfitPrice),
      riskAmount: Math.round(riskAmount * 100) / 100,
      potentialProfit: Math.round(potentialProfit * 100) / 100,
      riskPercentage: Math.round(riskPercentageCalculated * 100) / 100,
      positionValue: Math.round(positionValue * 100) / 100,
      requiredMargin: Math.round(requiredMargin * 100) / 100,
      riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
      recommendedLotSize: recommendedLotSize !== undefined ? Math.round(recommendedLotSize * 100) / 100 : undefined,
      pipValue
    };
  }, [positionSize, entryPrice, stopLossDistance, takeProfitDistance, accountBalance, riskPercentage, instrument, positionType, calculatorMode, rrrInputMode, targetRRR]);

  // Show loading state if instruments haven't loaded yet
  if (!instruments || instruments.length === 0) {
    return (
      <Card className="w-full bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className={SPACING.padding.card}>
          <div className={`flex items-center ${SPACING.gap.button} ${SPACING.margin.headingLarge}`}>
            <div className={`${SPACING.icon.xxl} rounded-full gradient-bg flex items-center justify-center`}>
              <Calculator className={`${SPACING.icon.md} text-white`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Trading Calculator</h3>
              <p className="text-sm text-muted-foreground">Loading instruments...</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-32">
            <div className={`animate-spin rounded-full ${SPACING.icon.xl} border-b-2 border-primary`} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const assetClasses = [
    { value: "all", label: t("tradingCalculator.assetClasses.all") },
    { value: "forex", label: t("tradingCalculator.assetClasses.forex") },
    { value: "indices", label: t("tradingCalculator.assetClasses.indices") },
    { value: "commodities", label: t("tradingCalculator.assetClasses.commodities") },
    { value: "crypto", label: t("tradingCalculator.assetClasses.crypto") }
  ];
  
  return (
    <Card className="w-full bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className={SPACING.padding.card}>
        {/* Header */}
        <div className={`flex items-center ${SPACING.gap.button} ${SPACING.margin.headingLarge} rtl:flex-row-reverse`}>
          <div className={`${SPACING.icon.xxl} rounded-full gradient-bg flex items-center justify-center`}>
            <Calculator className={`${SPACING.icon.md} text-white`} />
          </div>
          <div className="rtl:text-right">
            <h3 className="font-semibold text-lg">{t("tradingCalculator.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("tradingCalculator.subtitle")}</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <Tabs value={calculatorMode} onValueChange={(value) => setCalculatorMode(value as typeof calculatorMode)} className="w-full">
          <TabsList className={`grid w-full grid-cols-2 ${SPACING.margin.headingLarge}`}>
            <TabsTrigger value="risk-assessment" className="text-sm rtl:flex-row-reverse">
              <Shield className={`${SPACING.icon.sm} rtl:ml-2 rtl:mr-0 ltr:mr-2`} />
              {t("tradingCalculator.modes.riskAssessment")}
            </TabsTrigger>
            <TabsTrigger value="position-sizing" className="text-sm rtl:flex-row-reverse">
              <Percent className={`${SPACING.icon.sm} rtl:ml-2 rtl:mr-0 ltr:mr-2`} />
              {t("tradingCalculator.modes.positionSizing")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="risk-assessment" className="mt-0">
            <div className={`grid grid-cols-1 lg:grid-cols-2 ${SPACING.gap.xlarge}`}>
              {/* Inputs Section */}
              <div className={SPACING.stack.relaxed}>
                <div>
                  <h4 className={`text-lg font-semibold ${SPACING.margin.heading} flex items-center ${SPACING.gap.small} rtl:flex-row-reverse rtl:text-right`}>
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    {t("tradingCalculator.sections.tradingParameters")}
                  </h4>
                  
                  <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground mb-4">
                    {t("tradingCalculator.descriptions.riskAssessment")}
                  </div>

                  {/* Position Type */}
                  <div className={`${SPACING.stack.compact} ${SPACING.margin.heading}`}>
                    <Label className="text-sm font-medium">{t("tradingCalculator.labels.positionType")}</Label>
                    <div className={`flex ${SPACING.gap.small}`}>
                      <Button
                        variant={positionType === "buy" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPositionType("buy")}
                        className="flex-1 rtl:flex-row-reverse"
                      >
                        <ArrowUp className={`${SPACING.icon.sm} rtl:ml-2 rtl:mr-0 ltr:mr-2`} />
                        {t("tradingCalculator.labels.buy")}
                      </Button>
                      <Button
                        variant={positionType === "sell" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPositionType("sell")}
                        className="flex-1 rtl:flex-row-reverse"
                      >
                        <ArrowDown className={`${SPACING.icon.sm} rtl:ml-2 rtl:mr-0 ltr:mr-2`} />
                        {t("tradingCalculator.labels.sell")}
                      </Button>
                    </div>
                  </div>

                  {/* Instrument Selection */}
                  <div className={`grid grid-cols-2 ${SPACING.gap.medium} ${SPACING.margin.heading}`}>
                    <div className={SPACING.stack.compact}>
                      <Label className="text-sm font-medium">{t("tradingCalculator.labels.assetClass")}</Label>
                      <Select value={selectedAssetClass} onValueChange={setSelectedAssetClass}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assetClasses.map((assetClass) => (
                            <SelectItem key={assetClass.value} value={assetClass.value}>
                              {assetClass.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={SPACING.stack.compact}>
                      <Label className="text-sm font-medium">{t("tradingCalculator.labels.instrument")}</Label>
                      <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableInstruments.map((inst) => (
                            <SelectItem key={inst.symbol} value={inst.symbol}>
                              {inst.symbol} - {inst.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Position Size */}
                  <div className={`${SPACING.stack.compact} ${SPACING.margin.heading}`}>
                    <Label htmlFor="position-size" className="text-sm font-medium">{t("tradingCalculator.labels.positionSize")}</Label>
                    <Input
                      id="position-size"
                      type="number"
                      value={positionSizeInput}
                      onChange={(e) => setPositionSizeInput(e.target.value)}
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  {/* Trading Levels */}
                  <div className={`grid grid-cols-1 ${SPACING.gap.medium}`}>
                    <div className={SPACING.stack.compact}>
                      <Label htmlFor="entry-price">{t("tradingCalculator.labels.entryPrice")}</Label>
                      <Input
                        id="entry-price"
                        type="number"
                        value={entryPriceInput}
                        onChange={(e) => setEntryPriceInput(e.target.value)}
                        step="0.00001"
                      />
                    </div>
                     <div className={SPACING.stack.comfortable}>
                       <div className={SPACING.stack.compact}>
                         <Label htmlFor="sl-distance">{t("tradingCalculator.labels.slDistance")}</Label>
                         <Input
                           id="sl-distance"
                           type="number"
                            value={stopLossDistanceInput}
                            onChange={(e) => setStopLossDistanceInput(e.target.value)}
                         />
                       </div>
                       
                       {/* RRR Mode Toggle */}
                       <div className={SPACING.stack.normal}>
                         <div className="flex items-center justify-between rtl:flex-row-reverse">
                           <Label className="text-sm font-medium rtl:text-right">{t("tradingCalculator.labels.takeProfitSetup")}</Label>
                           <div className={`flex items-center ${SPACING.gap.small}`}>
                             <span className="text-xs text-muted-foreground">{t("tradingCalculator.labels.manualTp")}</span>
                             <Switch
                               checked={rrrInputMode === "auto-tp"}
                               onCheckedChange={(checked) => setRrrInputMode(checked ? "auto-tp" : "manual-tp")}
                             />
                             <span className="text-xs text-muted-foreground">{t("tradingCalculator.labels.autoTp")}</span>
                           </div>
                         </div>
                         
                         {rrrInputMode === "manual-tp" ? (
                           <div className="space-y-2">
                             <Label htmlFor="tp-distance">{t("tradingCalculator.labels.tpDistance")}</Label>
                             <Input
                               id="tp-distance"
                               type="number"
                                value={takeProfitDistanceInput}
                                onChange={(e) => setTakeProfitDistanceInput(e.target.value)}
                             />
                              <div className="text-xs text-muted-foreground">
                                {t("tradingCalculator.descriptions.riskRewardRatio")}{stopLossDistance > 0 ? (takeProfitDistance / stopLossDistance).toFixed(2) : "0.00"}
                              </div>
                           </div>
                         ) : (
                           <div className="space-y-2">
                             <Label htmlFor="target-rrr">{t("tradingCalculator.labels.targetRiskReward")}</Label>
                             <Input
                               id="target-rrr"
                               type="number"
                                value={targetRRRInput}
                                onChange={(e) => setTargetRRRInput(e.target.value)}
                               min="0.1"
                               step="0.1"
                               placeholder="2.0"
                             />
                             <div className="text-xs text-muted-foreground">
                               {t("tradingCalculator.descriptions.tpDistanceCalculated", { distance: stopLossDistance * targetRRR })}
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                  </div>

                   {/* Account Balance */}
                   <div className="space-y-2">
                     <Label htmlFor="account-balance-risk" className="text-sm font-medium">{t("tradingCalculator.labels.accountBalanceOptional")}</Label>
                     <Input
                       id="account-balance-risk"
                       type="number"
                       value={accountBalanceInput}
                       onChange={(e) => setAccountBalanceInput(e.target.value)}
                     />
                   </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4 rtl:flex-row-reverse">
                    <h4 className="text-lg font-semibold flex items-center gap-2 rtl:flex-row-reverse rtl:text-right">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {t("tradingCalculator.sections.calculationResults")}
                    </h4>
                    <RiskGauge riskPercentage={calculations.riskPercentage} size="sm" />
                  </div>
                  
                  <div className="space-y-4">
                     {/* Exit Prices Card */}
                     <Card className="border-l-4 border-l-primary rtl:border-l-0 rtl:border-r-4 rtl:border-r-primary">
                       <CardContent className="pt-4">
                         <h5 className="font-medium text-sm text-foreground mb-3">{t("tradingCalculator.sections.exitPrices")}</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center rtl:flex-row-reverse">
                            <span className="text-sm flex items-center gap-2 rtl:flex-row-reverse rtl:text-right">
                              <Shield className="h-4 w-4 text-destructive" />
                              {t("tradingCalculator.labels.stopLossPrice")}
                            </span>
                            <span className="font-mono text-destructive font-medium">
                              {calculations.stopLossPrice}
                            </span>
                          </div>
                          <div className="flex justify-between items-center rtl:flex-row-reverse">
                            <span className="text-sm flex items-center gap-2 rtl:flex-row-reverse rtl:text-right">
                              <Target className="h-4 w-4 text-primary" />
                              {t("tradingCalculator.labels.takeProfitPrice")}
                            </span>
                            <span className="font-mono text-primary font-medium">
                              {calculations.takeProfitPrice}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                     {/* Risk & Profit Card */}
                     <Card className="border-l-4 border-l-orange-500 rtl:border-l-0 rtl:border-r-4 rtl:border-r-orange-500">
                       <CardContent className="pt-4">
                         <h5 className="font-medium text-sm text-foreground mb-3">{t("tradingCalculator.sections.riskAndProfit")}</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center rtl:flex-row-reverse">
                            <span className="text-sm flex items-center gap-2 rtl:flex-row-reverse rtl:text-right">
                              <DollarSign className="h-4 w-4 text-destructive" />
                              {t("tradingCalculator.labels.riskAmount")}
                            </span>
                            <span className="font-mono text-destructive font-medium">
                              ${calculations.riskAmount}
                            </span>
                          </div>
                          <div className="flex justify-between items-center rtl:flex-row-reverse">
                            <span className="text-sm flex items-center gap-2 rtl:flex-row-reverse rtl:text-right">
                              <DollarSign className="h-4 w-4 text-primary" />
                              {t("tradingCalculator.labels.potentialProfit")}
                            </span>
                            <span className="font-mono text-primary font-medium">
                              ${calculations.potentialProfit}
                            </span>
                          </div>
                          <div className="flex justify-between items-center rtl:flex-row-reverse">
                            <span className="text-sm flex items-center gap-2 rtl:flex-row-reverse rtl:text-right">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              {t("tradingCalculator.labels.riskPercentageLabel")}
                            </span>
                            <span className="font-mono font-medium">
                              {calculations.riskPercentage}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                     {/* Position Details Card */}
                     <Card className="border-l-4 border-l-blue-500 rtl:border-l-0 rtl:border-r-4 rtl:border-r-blue-500">
                       <CardContent className="pt-4">
                         <h5 className="font-medium text-sm text-foreground mb-3">{t("tradingCalculator.sections.positionDetails")}</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center rtl:flex-row-reverse">
                            <span className="text-sm rtl:text-right">{t("tradingCalculator.labels.positionValue")}</span>
                            <span className="font-mono font-medium">
                              ${calculations.positionValue}
                            </span>
                          </div>
                          <div className="flex justify-between items-center rtl:flex-row-reverse">
                            <span className="text-sm rtl:text-right">{t("tradingCalculator.labels.requiredMargin")}</span>
                            <span className="font-mono font-medium">
                              ${calculations.requiredMargin}
                            </span>
                          </div>
                          <div className="flex justify-between items-center rtl:flex-row-reverse">
                            <span className="text-sm rtl:text-right">{t("tradingCalculator.labels.riskRewardRatio")}</span>
                            <span className="font-mono font-medium">
                              1:{calculations.riskRewardRatio}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="position-sizing" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Inputs Section */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 rtl:flex-row-reverse rtl:text-right">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    {t("tradingCalculator.sections.riskParameters")}
                  </h4>
                  
                  <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground mb-4 rtl:text-right">
                    {t("tradingCalculator.descriptions.positionSizing")}
                  </div>

                  {/* Position Type */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm font-medium rtl:text-right">{t("tradingCalculator.labels.positionType")}</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={positionType === "buy" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPositionType("buy")}
                        className="flex-1 rtl:flex-row-reverse"
                      >
                        <ArrowUp className="h-4 w-4 rtl:ml-2 rtl:mr-0 ltr:mr-2" />
                        {t("tradingCalculator.labels.buy")}
                      </Button>
                      <Button
                        variant={positionType === "sell" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPositionType("sell")}
                        className="flex-1 rtl:flex-row-reverse"
                      >
                        <ArrowDown className="h-4 w-4 rtl:ml-2 rtl:mr-0 ltr:mr-2" />
                        {t("tradingCalculator.labels.sell")}
                      </Button>
                    </div>
                  </div>

                  {/* Instrument Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium rtl:text-right">{t("tradingCalculator.labels.assetClass")}</Label>
                      <Select value={selectedAssetClass} onValueChange={setSelectedAssetClass}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assetClasses.map((assetClass) => (
                            <SelectItem key={assetClass.value} value={assetClass.value}>
                              {assetClass.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium rtl:text-right">{t("tradingCalculator.labels.instrument")}</Label>
                      <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableInstruments.map((inst) => (
                            <SelectItem key={inst.symbol} value={inst.symbol}>
                              {inst.symbol} - {inst.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                   {/* Account & Risk Settings */}
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="account-balance-position">Account Balance ($)</Label>
                        <Input
                          id="account-balance-position"
                          type="number"
                           value={accountBalanceInput}
                           onChange={(e) => setAccountBalanceInput(e.target.value)}
                          step="100"
                          min="0"
                        />
                      </div>
                     <div className="space-y-2">
                       <Label htmlFor="risk-percentage">Risk Percentage (%)</Label>
                       <Input
                         id="risk-percentage"
                         type="number"
                          value={riskPercentageInput}
                          onChange={(e) => setRiskPercentageInput(e.target.value)}
                         min="0.1"
                         max="10"
                         step="0.1"
                       />
                     </div>
                   </div>

                   {/* Risk Presets */}
                   <RiskPresets
                     currentRisk={Number(riskPercentageInput || 0)}
                     onPresetSelect={(value) => setRiskPercentageInput(String(value))}
                   />

                  {/* Trading Levels */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entry-price-ps">Entry Price</Label>
                      <Input
                        id="entry-price-ps"
                        type="number"
                         value={entryPriceInput}
                         onChange={(e) => setEntryPriceInput(e.target.value)}
                        step="0.00001"
                      />
                    </div>
                     <div className="space-y-4">
                       <div className="space-y-2">
                         <Label htmlFor="sl-distance-ps">SL Distance (Pips)</Label>
                         <Input
                           id="sl-distance-ps"
                           type="number"
                            value={stopLossDistanceInput}
                            onChange={(e) => setStopLossDistanceInput(e.target.value)}
                         />
                       </div>
                       
                       {/* RRR Mode Toggle */}
                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <Label className="text-sm font-medium">Take Profit Setup</Label>
                           <div className="flex items-center gap-2">
                             <span className="text-xs text-muted-foreground">Manual TP</span>
                             <Switch
                               checked={rrrInputMode === "auto-tp"}
                               onCheckedChange={(checked) => setRrrInputMode(checked ? "auto-tp" : "manual-tp")}
                             />
                             <span className="text-xs text-muted-foreground">Auto TP</span>
                           </div>
                         </div>
                         
                         {rrrInputMode === "manual-tp" ? (
                           <div className="space-y-2">
                             <Label htmlFor="tp-distance-ps">TP Distance (Pips)</Label>
                             <Input
                               id="tp-distance-ps"
                               type="number"
                                value={takeProfitDistanceInput}
                                onChange={(e) => setTakeProfitDistanceInput(e.target.value)}
                             />
                              <div className="text-xs text-muted-foreground">
                                Risk:Reward Ratio: 1:{stopLossDistance > 0 ? (takeProfitDistance / stopLossDistance).toFixed(2) : "0.00"}
                              </div>
                           </div>
                         ) : (
                           <div className="space-y-2">
                             <Label htmlFor="target-rrr-ps">Target Risk:Reward Ratio (1:X)</Label>
                             <Input
                               id="target-rrr-ps"
                               type="number"
                                value={targetRRRInput}
                                onChange={(e) => setTargetRRRInput(e.target.value)}
                               min="0.1"
                               step="0.1"
                               placeholder="2.0"
                             />
                             <div className="text-xs text-muted-foreground">
                               TP Distance: {stopLossDistance * targetRRR} pips (calculated)
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                  </div>
                </div>
              </div>

               {/* Results Section */}
               <div className="space-y-6">
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-lg font-semibold flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       Calculation Results
                     </h4>
                     <RiskGauge riskPercentage={calculations.riskPercentage || Number(riskPercentageInput || 0)} size="sm" />
                   </div>
                  
                  <div className="space-y-4">
                     {/* Recommended Lot Size - Prominent */}
                     {calculations.recommendedLotSize !== undefined && (
                       <Card className="border-2 border-primary bg-primary/5">
                         <CardContent className="pt-4">
                           <div className="text-center">
                             <div className="flex items-center justify-center gap-2 mb-2">
                               <Target className="h-5 w-5 text-primary" />
                               <h5 className="font-medium text-sm text-foreground">Recommended Lot Size</h5>
                             </div>
                             <div className="text-2xl font-bold text-primary">
                               {calculations.recommendedLotSize || 0} lots
                             </div>
                             <p className="text-xs text-muted-foreground mt-1">
                               Based on {riskPercentage}% risk of ${accountBalance.toLocaleString()}
                             </p>
                           </div>
                         </CardContent>
                       </Card>
                     )}

                     {/* Exit Prices Card */}
                     <Card className="border-l-4 border-l-primary">
                       <CardContent className="pt-4">
                         <h5 className="font-medium text-sm text-foreground mb-3">Exit Prices</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center gap-2">
                              <Shield className="h-4 w-4 text-destructive" />
                              Stop Loss Price:
                            </span>
                            <span className="font-mono text-destructive font-medium">
                              {calculations.stopLossPrice}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              Take Profit Price:
                            </span>
                            <span className="font-mono text-primary font-medium">
                              {calculations.takeProfitPrice}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                     {/* Risk & Profit Card */}
                     <Card className="border-l-4 border-l-orange-500">
                       <CardContent className="pt-4">
                         <h5 className="font-medium text-sm text-foreground mb-3">Risk & Profit</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-destructive" />
                              Risk Amount:
                            </span>
                            <span className="font-mono text-destructive font-medium">
                              ${calculations.riskAmount}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-primary" />
                              Potential Profit:
                            </span>
                            <span className="font-mono text-primary font-medium">
                              ${calculations.potentialProfit}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              Risk:Reward Ratio:
                            </span>
                            <span className="font-mono font-medium">
                              1:{calculations.riskRewardRatio}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                   </div>
                 </div>
                 
                 {/* Risk Comparison Table */}
                 <RiskComparisonTable
                   accountBalance={Number(accountBalanceInput || 0)}
                   stopLossDistance={Number(stopLossDistanceInput || 0)}
                   takeProfitDistance={rrrInputMode === "auto-tp" 
                     ? Number(stopLossDistanceInput || 0) * Number(targetRRRInput || 0)
                     : Number(takeProfitDistanceInput || 0)}
                   pipValue={calculations.pipValue}
                 />
               </div>
             </div>
           </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}