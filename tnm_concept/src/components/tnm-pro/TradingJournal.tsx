import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BookOpen, 
  Filter, 
  Download, 
  Calendar as CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { EquityCurveEnhanced } from './EquityCurveEnhanced';
import { EnhancedTradesTable } from './EnhancedTradesTable';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { StreaksAnalytics } from './StreaksAnalytics';
import { DashboardKPIRow } from './DashboardKPIRow';
import { useRealInstruments } from '@/hooks/useRealInstruments';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';

export const TradingJournal: React.FC = () => {
  const { selectedAccount, trades, closedTrades, formatCurrency } = useTradingDashboard();
  const { instruments } = useRealInstruments();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();


  if (!selectedAccount) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="text-center">
          <CardHeader>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <CardTitle>No Account Selected</CardTitle>
            <CardDescription>
              Please select a trading account to view your journal
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }


  const handleExportCSV = () => {
    const csvHeaders = ['Date', 'Symbol', 'Direction', 'Entry', 'Exit', 'Volume', 'P&L', 'R:R', 'Tags'];
    const csvData = trades.map(trade => [
      trade.opened_at,
      trade.symbol,
      trade.direction,
      trade.entry_price,
      trade.exit_price || '',
      trade.volume,
      trade.pnl || '',
      trade.risk_reward_ratio || '',
      trade.tags?.join(';') || ''
    ]);
    
    const csvContent = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-${selectedAccount.login}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Symbol" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50 max-h-60 overflow-y-auto">
                <SelectItem value="all">All Symbols</SelectItem>
                {['forex', 'indices', 'commodities', 'crypto'].map(category => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    {instruments
                      .filter(inst => inst.assetClass.toLowerCase() === category)
                      .map(instrument => (
                        <SelectItem key={instrument.symbol} value={instrument.symbol}>
                          {instrument.symbol}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="win">Wins</SelectItem>
                <SelectItem value="loss">Losses</SelectItem>
                <SelectItem value="be">Break Even</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compact KPI Row for Journal Context */}
      <DashboardKPIRow compact={true} />

      {/* Enhanced Analytics */}
      <Tabs defaultValue="equity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="equity" className="text-xs sm:text-sm">Equity</TabsTrigger>
          <TabsTrigger value="heatmap" className="text-xs sm:text-sm">Heatmap</TabsTrigger>
          <TabsTrigger value="streaks" className="text-xs sm:text-sm">Streaks</TabsTrigger>
          <TabsTrigger value="trades" className="text-xs sm:text-sm">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="equity">
          <EquityCurveEnhanced 
            trades={closedTrades} 
            currency={selectedAccount.currency} 
          />
        </TabsContent>

        <TabsContent value="heatmap">
          <PerformanceHeatmap 
            trades={trades} 
            currency={selectedAccount.currency} 
          />
        </TabsContent>

        <TabsContent value="streaks">
          <StreaksAnalytics 
            trades={trades} 
            currency={selectedAccount.currency} 
          />
        </TabsContent>

        <TabsContent value="trades">
          <EnhancedTradesTable 
            trades={trades} 
            currency={selectedAccount.currency} 
            isLoading={false} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};