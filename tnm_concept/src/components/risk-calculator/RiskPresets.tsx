import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RiskPresetsProps {
  onPresetSelect: (riskPercentage: number) => void;
  currentRisk: number;
}

export function RiskPresets({ onPresetSelect, currentRisk }: RiskPresetsProps) {
  const { t } = useTranslation('risk-calculator');

  const presets = [
    { label: t('presets.conservative', 'Conservative'), value: 1, icon: Shield, color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400" },
    { label: t('presets.moderate', 'Moderate'), value: 2, icon: TrendingUp, color: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400" },
    { label: t('presets.aggressive', 'Aggressive'), value: 3, icon: Zap, color: "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {t('presets.quickPresets', 'Quick Risk Presets')}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isSelected = currentRisk === preset.value;
          
          return (
            <Button
              key={preset.value}
              variant="outline"
              size="sm"
              onClick={() => onPresetSelect(preset.value)}
              className={`flex flex-col items-center gap-1 h-auto py-3 transition-all ${
                isSelected 
                  ? `${preset.color} ring-2 ring-offset-2 ring-current` 
                  : preset.color
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-semibold">{preset.value}%</span>
              <span className="text-[10px]">{preset.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
