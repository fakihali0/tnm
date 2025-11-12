import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { SPACING } from "@/styles/spacing";

interface CompareTrayProps {
  compareList: string[];
  onRemove: (symbol: string) => void;
  onCompare: () => void;
  onClear: () => void;
}

const CompareTrayComponent = memo(({ compareList, onRemove, onCompare, onClear }: CompareTrayProps) => {
  const { t } = useTranslation(['common','translation']);
  const isMobile = useIsMobile();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pb-safe-bottom">
      <Card className="bg-background/95 backdrop-blur border shadow-lg">
        <CardContent className={isMobile ? SPACING.padding.cardCompact : SPACING.padding.cardSmall}>
          <div className={`flex items-center ${isMobile ? `${SPACING.gap.small} flex-col ${SPACING.stack.normal}` : `${SPACING.gap.medium} justify-between`}`}>
            <div className={`flex items-center ${SPACING.gap.button} flex-1 min-w-0`}>
              <BarChart3 className={`${SPACING.icon.md} text-primary flex-shrink-0`} />
              <div className={`flex items-center ${SPACING.gap.small} flex-1 min-w-0`}>
                <span className="text-sm font-medium flex-shrink-0">
                  {isMobile ? t('instruments.compareTray.labelShort') : t('instruments.compareTray.label')}
                </span>
                <div className={`flex ${SPACING.gap.iconButton} overflow-x-auto scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {compareList.map((symbol) => (
                    <Badge 
                      key={symbol} 
                      variant="secondary" 
                      className={`flex items-center ${SPACING.gap.iconButton} flex-shrink-0 touch-target`}
                    >
                      <span className="max-w-[60px] truncate">{symbol}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(symbol)}
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground touch-target no-tap-highlight touch-feedback"
                      >
                        <X className={SPACING.icon.xs} />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={`flex ${SPACING.gap.small} flex-shrink-0 ${isMobile ? 'w-full justify-between' : ''}`}>
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "sm"} 
                onClick={onClear}
                className={`touch-target no-tap-highlight touch-feedback ${isMobile ? 'flex-1' : ''}`}
              >
                {t('instruments.compareTray.clear')}
              </Button>
              <Button 
                size={isMobile ? "default" : "sm"}
                onClick={onCompare}
                className={`gradient-bg text-white touch-target no-tap-highlight touch-feedback ${isMobile ? 'flex-1' : ''}`}
                disabled={compareList.length < 2}
              >
                {isMobile 
                  ? t('instruments.compareTray.buttonShort', { count: compareList.length })
                  : t('instruments.compareTray.button', { count: compareList.length })
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

CompareTrayComponent.displayName = "CompareTray";

export const CompareTray = CompareTrayComponent;