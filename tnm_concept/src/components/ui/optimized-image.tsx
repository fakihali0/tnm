import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  // Modern format support
  webpSrc?: string;
  avifSrc?: string;
  // Responsive sources
  srcSet?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes = '100vw',
  fill = false,
  onLoad,
  onError,
  webpSrc,
  avifSrc,
  srcSet: customSrcSet,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate responsive image sources with better format detection
  const generateSrcSet = (baseSrc: string, format?: string) => {
    if (customSrcSet) return customSrcSet;
    
    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    const ext = format || baseSrc.split('.').pop()?.toLowerCase() || 'jpg';
    
    return breakpoints
      .map(w => `${baseSrc.replace(/\.[^.]+$/, '')}-${w}w.${ext} ${w}w`)
      .join(', ');
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Create blur placeholder data URL if not provided
  const defaultBlurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=';

  const containerClasses = cn(
    'relative overflow-hidden',
    fill ? 'absolute inset-0' : '',
    className
  );

  const imageClasses = cn(
    'transition-opacity duration-300',
    isLoaded ? 'opacity-100' : 'opacity-0',
    fill ? 'absolute inset-0 object-cover w-full h-full' : 'w-full h-auto'
  );

  const placeholderClasses = cn(
    'absolute inset-0 bg-muted animate-pulse',
    isLoaded ? 'opacity-0' : 'opacity-100',
    'transition-opacity duration-300'
  );

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={containerClasses}
        style={{ width, height }}
      >
        <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
          <span className="text-sm">Image failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={fill ? undefined : { width, height }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div className={placeholderClasses}>
          {blurDataURL && (
            <img
              src={blurDataURL || defaultBlurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110"
              aria-hidden="true"
            />
          )}
        </div>
      )}

      {/* Empty placeholder */}
      {placeholder === 'empty' && !isLoaded && (
        <div className={placeholderClasses} />
      )}

      {/* Main image with modern format support */}
      {isInView && (
        <picture>
          {/* AVIF - Best compression, modern browsers */}
          {avifSrc && (
            <source
              type="image/avif"
              srcSet={generateSrcSet(avifSrc, 'avif')}
              sizes={sizes}
            />
          )}
          
          {/* WebP - Good compression, wide support */}
          {webpSrc && (
            <source
              type="image/webp"
              srcSet={generateSrcSet(webpSrc, 'webp')}
              sizes={sizes}
            />
          )}
          
          {/* Fallback to original format */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            srcSet={customSrcSet || generateSrcSet(src)}
            className={imageClasses}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        </picture>
      )}
    </div>
  );
};

// Convenience component for hero images
export const HeroImage: React.FC<Omit<OptimizedImageProps, 'priority'>> = (props) => (
  <OptimizedImage {...props} priority={true} placeholder="blur" />
);

// Convenience component for background images
export const BackgroundImage: React.FC<Omit<OptimizedImageProps, 'fill'>> = (props) => (
  <OptimizedImage {...props} fill={true} className={cn('object-cover', props.className)} />
);