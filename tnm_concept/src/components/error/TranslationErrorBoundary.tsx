import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Languages } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TranslationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

interface TranslationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
  namespace?: string;
}

const DefaultTranslationFallback = ({ 
  error, 
  retry, 
  namespace 
}: { 
  error?: Error; 
  retry: () => void;
  namespace?: string;
}) => (
  <Card className="p-4 text-center border-destructive/50">
    <Languages className="h-8 w-8 text-destructive mx-auto mb-2" />
    <h3 className="text-sm font-semibold mb-2">
      Translation Error
    </h3>
    <p className="text-xs text-muted-foreground mb-3">
      {namespace 
        ? `Failed to load ${namespace} translations` 
        : 'Translation loading failed'
      }
    </p>
    <Button 
      onClick={retry} 
      variant="outline" 
      size="sm"
      className="gap-1"
    >
      <RefreshCw className="h-3 w-3" />
      Retry
    </Button>
  </Card>
);

export class TranslationErrorBoundary extends React.Component<
  TranslationErrorBoundaryProps,
  TranslationErrorBoundaryState
> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: TranslationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<TranslationErrorBoundaryState> {
    // Only catch translation-specific errors, not generic JavaScript errors
    const isTranslationError = error.message.includes('i18n') || 
                              error.message.includes('translation') ||
                              error.message.includes('namespace') ||
                              error.stack?.includes('i18next') ||
                              error.stack?.includes('react-i18next');
    
    if (!isTranslationError) {
      // Re-throw non-translation errors so they can be handled by other boundaries
      console.log('TranslationErrorBoundary: Ignoring non-translation error:', error.message);
      throw error;
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error logging for translation debugging
    console.error('Translation Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      namespace: this.props.namespace,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Try to get cache stats for debugging
    try {
      import('@/i18n/dynamic-loader').then(({ getTranslationCacheStats }) => {
        const stats = getTranslationCacheStats();
        console.error('Translation cache state at error:', stats);
      });
    } catch (e) {
      console.error('Could not get cache stats:', e);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  retry = async () => {
    const { retryCount } = this.state;
    
    // Limit retry attempts to prevent infinite loops
    if (retryCount >= 3) {
      console.warn(`Max retry attempts reached for translation namespace: ${this.props.namespace}`);
      return;
    }

    // If we have a specific namespace, actively reload it
    if (this.props.namespace) {
      try {
        const { clearTranslationCache, loadTranslationNamespace } = await import('@/i18n/dynamic-loader');
        const { useTranslation } = await import('react-i18next');
        
        // Get i18n instance through a component hook workaround
        let language = 'en';
        try {
          // Try to get language from browser or use default
          language = localStorage.getItem('i18nextLng') || navigator.language.startsWith('ar') ? 'ar' : 'en';
        } catch (e) {
          console.warn('Could not detect language, using English');
        }
        
        // Clear cache for this namespace and language
        clearTranslationCache(language);
        
        // Force reload the namespace
        const translations = await loadTranslationNamespace(this.props.namespace, language);
        
        console.log(`Retry loaded ${this.props.namespace} for ${language}:`, translations);
        
        // Try English fallback if current language failed
        if ((!translations || Object.keys(translations).length === 0) && language !== 'en') {
          const enTranslations = await loadTranslationNamespace(this.props.namespace, 'en');
          console.log(`Fallback loaded ${this.props.namespace} for en:`, enTranslations);
        }
      } catch (error) {
        console.error('Failed to reload translations during retry:', error);
      }
    }

    // Clear the error state
    this.setState({ 
      hasError: false, 
      error: undefined,
      retryCount: retryCount + 1
    });

    // If it fails again quickly, add a small delay before next retry
    if (retryCount > 0) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
      this.retryTimeout = setTimeout(() => {
        this.forceUpdate();
      }, delay);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <DefaultTranslationFallback 
          error={this.state.error} 
          retry={this.retry}
          namespace={this.props.namespace}
        />
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with translation error boundary
export function withTranslationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  namespace?: string
) {
  const WrappedComponent = (props: P) => (
    <TranslationErrorBoundary namespace={namespace}>
      <Component {...props} />
    </TranslationErrorBoundary>
  );
  
  WrappedComponent.displayName = `withTranslationErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}