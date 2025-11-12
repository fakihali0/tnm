import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Filter, RotateCcw, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SPACING } from "@/styles/spacing";

interface FilterSortBarProps {
  filters: {
    assetClasses: string[];
    marketStatus: string;
    spreadType: "zero" | "raw";
    volatility: string[];
  };
  onFiltersChange: (filters: any) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onResetFilters: () => void;
  onSaveFilters: () => void;
  className?: string;
}

export function FilterSortBar({
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  onResetFilters,
  onSaveFilters,
  className
}: FilterSortBarProps) {
  const { t } = useTranslation(['common','translation']);
  const [isExpanded, setIsExpanded] = useState(false);

  const assetClassOptions = [
    { value: "forex", label: t('instruments.categories.forex') },
    { value: "indices", label: t('instruments.categories.indices') },
    { value: "commodities", label: t('instruments.categories.commodities') },
    { value: "crypto", label: t('instruments.categories.crypto') }
  ];

  const volatilityOptions = [
    { value: "low", label: t('instruments.filters.low') },
    { value: "medium", label: t('instruments.filters.medium') },
    { value: "high", label: t('instruments.filters.high') }
  ];

  const sortOptions = [
    { value: "name-asc", label: t('instruments.sort.nameAsc') },
    { value: "name-desc", label: t('instruments.sort.nameDesc') },
    { value: "spread-asc", label: t('instruments.sort.spreadAsc') },
    { value: "spread-desc", label: t('instruments.sort.spreadDesc') },
    { value: "leverage-desc", label: t('instruments.sort.leverageDesc') },
    { value: "leverage-asc", label: t('instruments.sort.leverageAsc') }
  ];

  const toggleAssetClass = (assetClass: string) => {
    const newAssetClasses = filters.assetClasses.includes(assetClass)
      ? filters.assetClasses.filter(ac => ac !== assetClass)
      : [...filters.assetClasses, assetClass];
    
    onFiltersChange({ ...filters, assetClasses: newAssetClasses });
  };

  const toggleVolatility = (volatility: string) => {
    const newVolatility = filters.volatility.includes(volatility)
      ? filters.volatility.filter(v => v !== volatility)
      : [...filters.volatility, volatility];
    
    onFiltersChange({ ...filters, volatility: newVolatility });
  };

  const activeFiltersCount = 
    filters.assetClasses.length + 
    (filters.marketStatus !== "all" ? 1 : 0) + 
    filters.volatility.length;

  return (
    <Card className={`${SPACING.padding.cardSmall} sticky top-28 z-40 bg-background/95 backdrop-blur ${className}`}>
      <div className={SPACING.stack.comfortable}>
        {/* Main Controls Row */}
        <div className={`flex flex-wrap items-center ${SPACING.gap.medium}`}>
          {/* Expand/Collapse Button (Mobile) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden"
          >
            <Filter className={`${SPACING.icon.sm} me-2`} />
            {t('instruments.filters.filters')} {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {/* Spread Type Toggle */}
          <div className="flex items-center gap-x-2">
            <Label htmlFor="spread-type" className="text-sm font-medium whitespace-nowrap">
              {t('instruments.filters.accountType')}:
            </Label>
            <Switch
              id="spread-type"
              checked={filters.spreadType === "raw"}
              onCheckedChange={(checked) => {
                onFiltersChange({
                  ...filters, 
                  spreadType: checked ? "raw" : "zero" 
                });
              }}
            />
            <span className="text-sm">
              {filters.spreadType === "zero" ? t('instruments.filters.zeroCommission') : t('instruments.filters.raw')}
            </span>
          </div>

          {/* Sort */}
          <div className={`flex items-center ${SPACING.gap.small} flex-wrap sm:flex-nowrap`}>
            <Label className="text-sm font-medium whitespace-nowrap">{t('instruments.filters.sortBy')}:</Label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[180px] text-start">
                <SelectValue placeholder={t('instruments.filters.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className={`flex ${SPACING.gap.small} ms-auto`}>
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              <RotateCcw className={`${SPACING.icon.sm} me-2`} />
              {t('instruments.filters.reset')}
            </Button>
            <Button variant="outline" size="sm" onClick={onSaveFilters}>
              <Save className={`${SPACING.icon.sm} me-2`} />
              {t('instruments.filters.save')}
            </Button>
          </div>
        </div>

        {/* Expanded Filters (Desktop always visible, Mobile collapsible) */}
        <div className={`${SPACING.stack.comfortable} ${isExpanded ? 'block' : 'hidden md:block'}`}>
          {/* Asset Classes */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t('instruments.filters.assetClasses')}:</Label>
            <div className={`flex flex-wrap ${SPACING.gap.small}`}>
              {assetClassOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={filters.assetClasses.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleAssetClass(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Market Status */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t('instruments.filters.marketStatus')}:</Label>
            <div className={`flex ${SPACING.gap.small}`}>
              {["all", "open", "closed"].map((status) => (
                <Badge
                  key={status}
                  variant={filters.marketStatus === status ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105 capitalize"
                  onClick={() => onFiltersChange({ ...filters, marketStatus: status })}
                >
                  {t(`instruments.filters.${status}`)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Volatility */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t('instruments.filters.volatility')}:</Label>
            <div className={`flex flex-wrap ${SPACING.gap.small}`}>
              {volatilityOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={filters.volatility.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleVolatility(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}