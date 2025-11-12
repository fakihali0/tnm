import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface FeatureErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
  featureName?: string;
}

export class FeatureErrorBoundary extends React.Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error reporting service here
      // e.g., Sentry, LogRocket, etc.
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <div className="trading-card p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {this.props.featureName ? `${this.props.featureName} Error` : 'Something went wrong'}
          </h3>
          <p className="text-muted-foreground mb-4">
            This feature is temporarily unavailable. Please try again.
          </p>
          <Button onClick={this.retry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for common use cases
export function withFeatureErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  featureName?: string
) {
  const WrappedComponent = (props: P) => (
    <FeatureErrorBoundary featureName={featureName}>
      <Component {...props} />
    </FeatureErrorBoundary>
  );
  
  WrappedComponent.displayName = `withFeatureErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}