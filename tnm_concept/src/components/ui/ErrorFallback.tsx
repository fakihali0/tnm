import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  className?: string;
  variant?: 'page' | 'component' | 'inline';
  showDetails?: boolean;
  customMessage?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }>;
}

export function ErrorFallback({
  error,
  resetError,
  className,
  variant = 'component',
  showDetails = false,
  customMessage,
  actions
}: ErrorFallbackProps) {
  const errorMessage = customMessage || error?.message || 'An unexpected error occurred';
  
  const handleReportError = () => {
    // In production, this would send error to monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', {
        message: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
    }
  };

  if (variant === 'inline') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {errorMessage}
          {resetError && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={resetError}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'page') {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-4 bg-background",
        className
      )}>
        <Card className="max-w-md p-8 text-center">
          <div className="mb-6">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground">
              {errorMessage}
            </p>
          </div>

          {showDetails && error && (
            <details className="text-left mb-6">
              <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                Error Details
              </summary>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32">
                {error.stack || error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {resetError && (
              <Button onClick={resetError}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReportError}
            >
              <Bug className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>

          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Component variant (default)
  return (
    <Card className={cn("p-6 text-center", className)}>
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      
      <h3 className="text-lg font-semibold mb-2">
        Something went wrong
      </h3>
      
      <p className="text-muted-foreground mb-4">
        {errorMessage}
      </p>

      {showDetails && error && (
        <details className="text-left mb-4">
          <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
            Technical Details
          </summary>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-24">
            {error.stack || error.message}
          </pre>
        </details>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        {resetError && (
          <Button onClick={resetError} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {actions && actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'secondary'}
            size="sm"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

// Specialized error components
export function NetworkErrorFallback({ 
  onRetry, 
  onGoOffline 
}: { 
  onRetry?: () => void;
  onGoOffline?: () => void;
}) {
  return (
    <ErrorFallback
      customMessage="Unable to connect to the server. Please check your internet connection."
      resetError={onRetry}
      actions={onGoOffline ? [{
        label: "Continue Offline",
        onClick: onGoOffline,
        variant: "secondary"
      }] : undefined}
    />
  );
}

export function DataErrorFallback({ 
  onRefresh, 
  onContactSupport 
}: { 
  onRefresh?: () => void;
  onContactSupport?: () => void;
}) {
  return (
    <ErrorFallback
      customMessage="There was a problem loading your data."
      resetError={onRefresh}
      actions={onContactSupport ? [{
        label: "Contact Support",
        onClick: onContactSupport,
        variant: "secondary"
      }] : undefined}
    />
  );
}