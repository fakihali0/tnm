import { useState, useEffect } from 'react';
import { useTranslationValidation } from '@/hooks/useTranslationValidation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

// Sample keys to check - in a real app, you might want to extract this from your translation files
const COMMON_TRANSLATION_KEYS = [
  'common:loading.page',
  'common:loading.content',
  'common:loading.economicCalendar',
  'common:loading.forexRates',
  'common:loading.stockHeatmap',
  'common:loading.marketData',
  'common:accessibility.skipToContent',
  'common:accessibility.closeMenu',
  'common:accessibility.openMenu',
  'common:accessibility.loading',
  'common:accessibility.error',
  'common:errors.translationMissing',
  'common:errors.loadingFailed',
  'common:errors.networkError',
  'common:common.language',
  'common:common.loading',
  'common:common.error',
  'common:common.success'
];

export function TranslationDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const { getTranslationStatus, validateTranslation, currentLanguage, isReady } = useTranslationValidation();

  const [translationStatus, setTranslationStatus] = useState<{
    valid: string[];
    missing: string[];
    total: number;
  }>({ valid: [], missing: [], total: 0 });

  useEffect(() => {
    if (isReady && checkedKeys.length > 0) {
      const status = getTranslationStatus(checkedKeys);
      setTranslationStatus(status);
    }
  }, [getTranslationStatus, isReady, checkedKeys, currentLanguage]);

  useEffect(() => {
    // Initialize with common keys
    setCheckedKeys(COMMON_TRANSLATION_KEYS);
  }, []);

  const runFullCheck = () => {
    setCheckedKeys(COMMON_TRANSLATION_KEYS);
  };

  const addCustomKey = () => {
    const key = prompt('Enter translation key to check:');
    if (key && !checkedKeys.includes(key)) {
      setCheckedKeys(prev => [...prev, key]);
    }
  };

  const removeKey = (keyToRemove: string) => {
    setCheckedKeys(prev => prev.filter(key => key !== keyToRemove));
  };

  const getValidationDetails = (key: string) => {
    return validateTranslation(key);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/95 backdrop-blur shadow-lg"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Translation Debug
        </Button>
      ) : (
        <Card className="w-96 max-h-[600px] bg-background/95 backdrop-blur shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Translation Status</CardTitle>
                <CardDescription className="text-xs">
                  Language: {currentLanguage} • Ready: {isReady ? 'Yes' : 'No'}
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex gap-2 text-xs">
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid: {translationStatus.valid.length}
              </Badge>
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Missing: {translationStatus.missing.length}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={runFullCheck} size="sm" variant="outline" className="text-xs">
                Run Check
              </Button>
              <Button onClick={addCustomKey} size="sm" variant="outline" className="text-xs">
                Add Key
              </Button>
            </div>

            <ScrollArea className="h-[300px] w-full rounded border p-2">
              <div className="space-y-2">
                {checkedKeys.map((key) => {
                  const validation = getValidationDetails(key);
                  return (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-2 p-2 rounded bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {validation.isValid ? (
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                          )}
                          <code className="text-xs font-mono break-all">{key}</code>
                        </div>
                        {validation.fallbackUsed && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Fallback used
                          </Badge>
                        )}
                        <div className="text-xs text-muted-foreground mt-1 break-words">
                          "{validation.text}"
                        </div>
                      </div>
                      <Button
                        onClick={() => removeKey(key)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {translationStatus.missing.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Check console for detailed missing translation warnings.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}