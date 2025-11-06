import { ImgHTMLAttributes, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'landscape' | 'hero';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  priority?: boolean;
  className?: string;
}

/**
 * ResponsiveImage - Automatically resizes images for mobile/tablet/desktop
 * 
 * Features:
 * - Auto-fits to container width
 * - Prevents layout overflow
 * - Lazy loading (except priority images)
 * - Loading skeleton
 * - Aspect ratio control
 * - Object-fit options
 * 
 * @example
 * ```tsx
 * <ResponsiveImage
 *   src="/hero.jpg"
 *   alt="Hero image"
 *   aspectRatio="video"
 *   objectFit="cover"
 * />
 * ```
 */
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = 'video',
  objectFit = 'cover',
  priority = false,
  className = '',
  ...props
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-portrait',
    landscape: 'aspect-landscape',
    hero: 'responsive-img-hero',
  }[aspectRatio];

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[objectFit];

  const baseClasses = 'responsive-img w-full h-auto';
  const combinedClasses = `${baseClasses} ${aspectRatioClass} ${objectFitClass} ${className}`.trim();

  if (hasError) {
    return (
      <div 
        className={`${aspectRatioClass} ${className} bg-muted flex items-center justify-center`}
        role="img"
        aria-label={`Failed to load: ${alt}`}
      >
        <span className="text-sm text-muted-foreground">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isLoading && (
        <Skeleton className={`absolute inset-0 ${aspectRatioClass}`} />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={combinedClasses}
        {...props}
      />
    </div>
  );
}

/**
 * HeroImage - Pre-configured responsive image for hero sections
 */
export function HeroImage(props: Omit<ResponsiveImageProps, 'aspectRatio'>) {
  return <ResponsiveImage {...props} aspectRatio="hero" priority />;
}

/**
 * CardImage - Pre-configured responsive image for card thumbnails
 */
export function CardImage(props: Omit<ResponsiveImageProps, 'aspectRatio' | 'objectFit'>) {
  return <ResponsiveImage {...props} aspectRatio="video" objectFit="cover" />;
}

/**
 * AvatarImage - Pre-configured responsive image for avatars
 */
export function AvatarImage(props: Omit<ResponsiveImageProps, 'aspectRatio' | 'objectFit'>) {
  return <ResponsiveImage {...props} aspectRatio="square" objectFit="cover" />;
}
