import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TradingViewErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

interface TradingViewErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void; retryCount: number }>;
  maxRetries?: number;
}

const DefaultTradingViewFallback = ({ 
  error, 
  retry, 
  retryCount 
}: { 
  error?: Error; 
  retry: () => void; 
  retryCount: number;
}) => (
  <Card className="w-full bg-card border">
    <CardContent className="p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Trading Widget Unavailable</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        {retryCount >= 3 
          ? "Trading data is temporarily unavailable. Please check your connection and try again later."
          : "Failed to load trading widget. This might be due to network issues or ad blockers."
        }
      </p>
      {retryCount < 3 && (
        <Button 
          onClick={retry} 
          variant="outline" 
          size="sm"
          className="mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry ({3 - retryCount} attempts left)
        </Button>
      )}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-4 text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer">
            Error Details (Development)
          </summary>
          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
    </CardContent>
  </Card>
);

export class TradingViewErrorBoundary extends React.Component<
  TradingViewErrorBoundaryProps,
  TradingViewErrorBoundaryState
> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: TradingViewErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<TradingViewErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Replace with actual error reporting service (e.g., Sentry)
      console.error('TradingView Widget Error:', error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  retry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));

    // Auto-retry with exponential backoff for network issues
    if (this.state.retryCount < maxRetries - 1) {
      this.retryTimeout = setTimeout(() => {
        if (this.state.hasError) {
          this.retry();
        }
      }, Math.pow(2, this.state.retryCount) * 1000);
    }
  };

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultTradingViewFallback;
      return (
        <Fallback 
          error={this.state.error} 
          retry={this.retry}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}