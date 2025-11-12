import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trade } from '@/types/trading';
import { 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Camera, 
  StickyNote,
  ArrowUpDown,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface EnhancedTradesTableProps {
  trades: Trade[];
  currency: string;
  isLoading?: boolean;
}

type SortField = 'opened_at' | 'closed_at' | 'symbol' | 'pnl' | 'risk_reward_ratio' | 'volume';
type SortDirection = 'asc' | 'desc';

export const EnhancedTradesTable = ({ trades, currency, isLoading }: EnhancedTradesTableProps) => {
  const { t } = useTranslation('tnm-ai');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('closed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedTrades = useMemo(() => {
    let filtered = trades;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = trades.filter(trade => 
        trade.symbol.toLowerCase().includes(term) ||
        trade.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        trade.notes?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date fields
      if (sortField === 'opened_at' || sortField === 'closed_at') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [trades, searchTerm, sortField, sortDirection]);

  const toggleRowExpansion = (tradeId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(tradeId)) {
      newExpanded.delete(tradeId);
    } else {
      newExpanded.add(tradeId);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency || 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getPnlColor = (pnl: number | undefined) => {
    if (pnl === undefined) return 'text-muted-foreground';
    return pnl >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Trades Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            Loading trades...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trades.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Trades Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            {t('trades.table.noTrades')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enhanced Trades Table</CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder={t('trades.table.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center gap-1">
                    {t('trades.table.symbol')}
                    {getSortIcon('symbol')}
                  </div>
                </TableHead>
                <TableHead>{t('trades.table.type')}</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('opened_at')}
                >
                  <div className="flex items-center gap-1">
                    {t('trades.table.openedAt')}
                    {getSortIcon('opened_at')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('closed_at')}
                >
                  <div className="flex items-center gap-1">
                    {t('trades.table.closedAt')}
                    {getSortIcon('closed_at')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center gap-1">
                    {t('trades.table.volume')}
                    {getSortIcon('volume')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('risk_reward_ratio')}
                >
                  <div className="flex items-center gap-1">
                    {t('trades.table.riskReward')}
                    {getSortIcon('risk_reward_ratio')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center gap-1">
                    {t('trades.table.pnl')}
                    {getSortIcon('pnl')}
                  </div>
                </TableHead>
                <TableHead>{t('trades.table.tags')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTrades.map((trade) => (
                <Collapsible key={trade.id} asChild>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRowExpansion(trade.id)}
                      >
                        <TableCell>
                          {expandedRows.has(trade.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === 'BUY' ? 'default' : 'secondary'}>
                            {trade.direction === 'BUY' ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {trade.direction}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(trade.opened_at)}</TableCell>
                        <TableCell>{formatDateTime(trade.closed_at)}</TableCell>
                        <TableCell>{trade.volume}</TableCell>
                        <TableCell>
                          {trade.risk_reward_ratio !== undefined ? trade.risk_reward_ratio.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell className={getPnlColor(trade.pnl)}>
                          {formatCurrency(trade.pnl)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {trade.tags?.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {trade.tags && trade.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{trade.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={9}>
                          <div className="p-4 space-y-4">
                            {/* Trade Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="font-medium mb-1">{t('trades.table.openPrice')}</div>
                                <div>{trade.entry_price.toFixed(5)}</div>
                              </div>
                              <div>
                                <div className="font-medium mb-1">{t('trades.table.closePrice')}</div>
                                <div>{trade.exit_price?.toFixed(5) || '-'}</div>
                              </div>
                              <div>
                                <div className="font-medium mb-1">Stop Loss</div>
                                <div>{trade.stop_loss?.toFixed(5) || '-'}</div>
                              </div>
                              <div>
                                <div className="font-medium mb-1">Take Profit</div>
                                <div>{trade.take_profit?.toFixed(5) || '-'}</div>
                              </div>
                            </div>

                            {/* Session & Additional Info */}
                            <div className="flex flex-wrap gap-4 text-sm">
                              {trade.session && (
                                <div>
                                  <span className="font-medium">Session: </span>
                                  <Badge variant="outline">{trade.session}</Badge>
                                </div>
                              )}
                              {trade.tags && trade.tags.length > 0 && (
                                <div>
                                  <span className="font-medium">{t('trades.table.tags')}: </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {trade.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Notes & Screenshot */}
                            {(trade.notes || trade.screenshot_url) && (
                              <div className="space-y-2">
                                {trade.notes && (
                                  <div>
                                    <div className="flex items-center gap-1 font-medium mb-1">
                                      <StickyNote className="h-4 w-4" />
                                      {t('trades.table.notes')}
                                    </div>
                                    <div className="text-sm text-muted-foreground p-2 bg-background rounded border">
                                      {trade.notes}
                                    </div>
                                  </div>
                                )}
                                {trade.screenshot_url && (
                                  <div>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex items-center gap-1"
                                      onClick={() => window.open(trade.screenshot_url, '_blank')}
                                    >
                                      <Camera className="h-4 w-4" />
                                      {t('trades.table.screenshot')}
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredAndSortedTrades.length === 0 && searchTerm && (
          <div className="text-center py-8 text-muted-foreground">
            No trades found matching "{searchTerm}"
          </div>
        )}
      </CardContent>
    </Card>
  );
};