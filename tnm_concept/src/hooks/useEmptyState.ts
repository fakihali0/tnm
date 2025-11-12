import { useMemo } from 'react';
import { Database, Search, Wifi, AlertTriangle, FileX, Users, TrendingUp } from 'lucide-react';

export interface EmptyStateConfig {
  icon: any;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

interface UseEmptyStateProps {
  type: 'no-data' | 'no-results' | 'no-connection' | 'error' | 'no-trades' | 'no-accounts' | 'no-analytics';
  searchTerm?: string;
  onRefresh?: () => void;
  onClearSearch?: () => void;
  onAddData?: () => void;
  customConfig?: Partial<EmptyStateConfig>;
}

export function useEmptyState({
  type,
  searchTerm,
  onRefresh,
  onClearSearch,
  onAddData,
  customConfig
}: UseEmptyStateProps): EmptyStateConfig {
  const baseConfig = useMemo(() => {
    switch (type) {
      case 'no-data':
        return {
          icon: Database,
          title: 'No Data Available',
          description: 'There\'s no data to display at the moment. Try refreshing or check back later.',
          action: onRefresh ? {
            label: 'Refresh',
            onClick: onRefresh,
            variant: 'outline' as const
          } : undefined
        };

      case 'no-results':
        return {
          icon: Search,
          title: 'No Results Found',
          description: searchTerm 
            ? `No results found for "${searchTerm}". Try adjusting your search criteria.`
            : 'No results found. Try adjusting your filters or search terms.',
          action: onClearSearch ? {
            label: 'Clear Search',
            onClick: onClearSearch,
            variant: 'outline' as const
          } : undefined
        };

      case 'no-connection':
        return {
          icon: Wifi,
          title: 'Connection Lost',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          action: onRefresh ? {
            label: 'Retry Connection',
            onClick: onRefresh,
            variant: 'default' as const
          } : undefined
        };

      case 'error':
        return {
          icon: AlertTriangle,
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.',
          action: onRefresh ? {
            label: 'Try Again',
            onClick: onRefresh,
            variant: 'default' as const
          } : undefined
        };

      case 'no-trades':
        return {
          icon: TrendingUp,
          title: 'No Trades Recorded',
          description: 'You haven\'t recorded any trades yet. Start by adding your first trade to track your performance.',
          action: onAddData ? {
            label: 'Add Trade',
            onClick: onAddData,
            variant: 'default' as const
          } : undefined,
          secondaryAction: onRefresh ? {
            label: 'Sync Trades',
            onClick: onRefresh
          } : undefined
        };

      case 'no-accounts':
        return {
          icon: Users,
          title: 'No Accounts Linked',
          description: 'Link your trading accounts to start tracking your performance and accessing advanced analytics.',
          action: onAddData ? {
            label: 'Link Account',
            onClick: onAddData,
            variant: 'default' as const
          } : undefined
        };

      case 'no-analytics':
        return {
          icon: FileX,
          title: 'No Analytics Data',
          description: 'Not enough trading data to generate analytics. Add more trades or wait for account synchronization.',
          action: onAddData ? {
            label: 'Add Trades',
            onClick: onAddData,
            variant: 'default' as const
          } : undefined,
          secondaryAction: onRefresh ? {
            label: 'Refresh Data',
            onClick: onRefresh
          } : undefined
        };

      default:
        return {
          icon: Database,
          title: 'No Data',
          description: 'No data available to display.',
          action: undefined
        };
    }
  }, [type, searchTerm, onRefresh, onClearSearch, onAddData]);

  // Merge with custom config
  return useMemo(() => ({
    ...baseConfig,
    ...customConfig,
    action: customConfig?.action || baseConfig.action,
    secondaryAction: customConfig?.secondaryAction || baseConfig.secondaryAction
  }), [baseConfig, customConfig]);
}

// Hook for common trading-specific empty states
export function useTradingEmptyState(
  dataType: 'trades' | 'accounts' | 'analytics' | 'journal',
  isEmpty: boolean,
  actions?: {
    onAdd?: () => void;
    onRefresh?: () => void;
    onLink?: () => void;
  }
) {
  const emptyStateConfig = useEmptyState({
    type: isEmpty ? `no-${dataType}` as any : 'no-data',
    onAddData: actions?.onAdd || actions?.onLink,
    onRefresh: actions?.onRefresh
  });

  return {
    isEmpty,
    config: emptyStateConfig,
    shouldShow: isEmpty
  };
}

// Hook for search results empty state
export function useSearchEmptyState(
  results: any[],
  searchTerm: string,
  onClearSearch?: () => void
) {
  const isEmpty = results.length === 0 && searchTerm.length > 0;
  
  const emptyStateConfig = useEmptyState({
    type: 'no-results',
    searchTerm,
    onClearSearch
  });

  return {
    isEmpty,
    config: emptyStateConfig,
    shouldShow: isEmpty
  };
}