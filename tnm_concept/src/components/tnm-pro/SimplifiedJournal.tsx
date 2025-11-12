import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Download, 
  TrendingUp,
  TrendingDown,
  Clock,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { EnhancedEquityCurve } from './EnhancedEquityCurve';

export const SimplifiedJournal: React.FC = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const { selectedAccount, trades, closedTrades, formatCurrency } = useTradingDashboard();
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);

  if (!selectedAccount) {
    return (
      <Card className="text-center">
        <CardHeader>
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>{t('dashboard.noAccountTitle')}</CardTitle>
          <CardDescription>{t('dashboard.noAccountDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleExportCSV = () => {
    const csvHeaders = ['Date', 'Symbol', 'Direction', 'Entry', 'Exit', 'Volume', 'P&L'];
    const csvData = closedTrades.map(trade => [
      format(new Date(trade.opened_at), 'yyyy-MM-dd'),
      trade.symbol,
      trade.direction,
      trade.entry_price,
      trade.exit_price || '',
      trade.volume,
      trade.pnl || ''
    ]);
    
    const csvContent = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group trades by date
  const tradesByDate = closedTrades.reduce((acc, trade) => {
    const date = format(new Date(trade.opened_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(trade);
    return acc;
  }, {} as Record<string, typeof closedTrades>);

  const sortedDates = Object.keys(tradesByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6" dir={rtl.dir}>
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-start">{t('journal.title')}</h2>
          <p className="text-muted-foreground text-start">{t('journal.completedTrades', { count: closedTrades.length })}</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 me-2" />
          {t('journal.exportReport')}
        </Button>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">{t('journal.tabs.timeline')}</TabsTrigger>
          <TabsTrigger value="performance">{t('journal.tabs.performance')}</TabsTrigger>
          <TabsTrigger value="insights">{t('journal.tabs.insights')}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Timeline View */}
          {sortedDates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('journal.empty.noCompletedTrades')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedDates.map(date => {
                const dayTrades = tradesByDate[date];
                const dayPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                
                return (
                  <Card key={date}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-start">
                            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                          </CardTitle>
                          <CardDescription className="text-sm text-start">
                            {dayTrades.length} trade{dayTrades.length > 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <Badge variant={dayPnl >= 0 ? 'default' : 'destructive'}>
                          {dayPnl >= 0 ? '+' : ''}{formatCurrency(dayPnl)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {dayTrades.map(trade => (
                        <div 
                          key={trade.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => setSelectedTrade(trade.id === selectedTrade ? null : trade.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${(trade.pnl || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="font-medium">{trade.symbol}</div>
                              <div className="text-xs text-muted-foreground">
                                {trade.direction} • {trade.volume} lots
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(trade.pnl || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(trade.opened_at), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <EnhancedEquityCurve 
            trades={closedTrades}
            initialBalance={selectedAccount.balance || 10000}
            currency={selectedAccount.currency}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 me-2" />
                  <span className="text-start">{t('journal.insights.topPerformer')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {closedTrades.length > 0 ? (
                  <div>
                    <p className="text-2xl font-bold text-start">
                      {closedTrades.reduce((max, t) => (t.pnl || 0) > (max.pnl || 0) ? t : max, closedTrades[0])?.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground text-start">
                      {t('journal.insights.mostProfitablePair')}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-start">{t('analytics.noData')}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 me-2" />
                  <span className="text-start">{t('journal.insights.improvementArea')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-start">
                  {t('journal.insights.focusPositionSizing')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
