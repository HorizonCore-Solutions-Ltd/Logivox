/**
 * Image Optimization Utilities
 * Helpers for optimizing images and assets
 */

import path from 'path';
import fs from 'fs/promises';

/**
 * Image format types
 */
export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

/**
 * Image optimization configuration
 */
export interface ImageOptimizationConfig {
  quality?: number; // 1-100
  format?: ImageFormat;
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
}

/**
 * Default optimization settings
 */
export const DEFAULT_IMAGE_CONFIG: Required<ImageOptimizationConfig> = {
  quality: 80,
  format: 'webp',
  width: 1200,
  height: 1200,
  fit: 'cover',
};

/**
 * Image size presets
 */
export const ImageSizePresets = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  small: { width: 400, height: 400, quality: 75 },
  medium: { width: 800, height: 800, quality: 80 },
  large: { width: 1200, height: 1200, quality: 85 },
  xlarge: { width: 1920, height: 1920, quality: 85 },
  hero: { width: 2400, height: 1200, quality: 90 },
} as const;

/**
 * Responsive image sizes for Next.js Image component
 */
export const responsiveImageSizes = {
  mobile: '(max-width: 640px) 100vw',
  tablet: '(max-width: 1024px) 50vw',
  desktop: '33vw',
};

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(
  src: string,
  config?: ImageOptimizationConfig
): string {
  const params = new URLSearchParams();

  if (config?.width) params.set('w', config.width.toString());
  if (config?.height) params.set('h', config.height.toString());
  if (config?.quality) params.set('q', config.quality.toString());
  if (config?.format) params.set('f', config.format);
  if (config?.fit) params.set('fit', config.fit);

  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920]
): string {
  return widths
    .map((width) => `${getOptimizedImageUrl(src, { width })} ${width}w`)
    .join(', ');
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(
  filePath: string
): Promise<{ width: number; height: number } | null> {
  try {
    const buffer = await fs.readFile(filePath);
    
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }
    
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        if (buffer[offset + 1] === 0xc0 || buffer[offset + 1] === 0xc2) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7),
          };
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

/**
 * Validate image file
 */
export interface ImageValidation {
  valid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
  size?: number;
}

export async function validateImage(
  filePath: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    maxSize?: number; // in bytes
    allowedFormats?: string[];
  }
): Promise<ImageValidation> {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    // Check file size
    if (options?.maxSize && stats.size > options.maxSize) {
      return {
        valid: false,
        error: `File size ${stats.size} exceeds maximum ${options.maxSize}`,
        size: stats.size,
      };
    }
    
    // Check format
    const allowedFormats = options?.allowedFormats || ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    if (!allowedFormats.includes(ext)) {
      return {
        valid: false,
        error: `Format ${ext} not allowed. Allowed formats: ${allowedFormats.join(', ')}`,
        size: stats.size,
      };
    }
    
    // Check dimensions
    const dimensions = await getImageDimensions(filePath);
    if (dimensions) {
      if (options?.maxWidth && dimensions.width > options.maxWidth) {
        return {
          valid: false,
          error: `Width ${dimensions.width} exceeds maximum ${options.maxWidth}`,
          dimensions,
          size: stats.size,
        };
      }
      if (options?.maxHeight && dimensions.height > options.maxHeight) {
        return {
          valid: false,
          error: `Height ${dimensions.height} exceeds maximum ${options.maxHeight}`,
          dimensions,
          size: stats.size,
        };
      }
    }
    
    return {
      valid: true,
      dimensions: dimensions || undefined,
      size: stats.size,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate placeholder blur data URL
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  // Generate a simple gray placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e5e7eb"/>
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Image CDN configuration
 */
export interface CDNConfig {
  provider: 'cloudinary' | 'imgix' | 'cloudflare' | 'custom';
  baseUrl: string;
  apiKey?: string;
}

/**
 * Get CDN image URL
 */
export function getCDNImageUrl(
  src: string,
  config: ImageOptimizationConfig,
  cdn: CDNConfig
): string {
  switch (cdn.provider) {
    case 'cloudinary':
      return getCloudinaryUrl(src, config, cdn.baseUrl);
    case 'imgix':
      return getImgixUrl(src, config, cdn.baseUrl);
    case 'cloudflare':
      return getCloudflareUrl(src, config, cdn.baseUrl);
    default:
      return getOptimizedImageUrl(src, config);
  }
}

/**
 * Cloudinary URL builder
 */
function getCloudinaryUrl(
  src: string,
  config: ImageOptimizationConfig,
  baseUrl: string
): string {
  const transformations: string[] = [];
  
  if (config.width) transformations.push(`w_${config.width}`);
  if (config.height) transformations.push(`h_${config.height}`);
  if (config.quality) transformations.push(`q_${config.quality}`);
  if (config.format) transformations.push(`f_${config.format}`);
  if (config.fit) transformations.push(`c_${config.fit}`);
  
  const transform = transformations.join(',');
  return `${baseUrl}/image/upload/${transform}/${src}`;
}

/**
 * Imgix URL builder
 */
function getImgixUrl(
  src: string,
  config: ImageOptimizationConfig,
  baseUrl: string
): string {
  const params = new URLSearchParams();
  
  if (config.width) params.set('w', config.width.toString());
  if (config.height) params.set('h', config.height.toString());
  if (config.quality) params.set('q', config.quality.toString());
  if (config.format) params.set('fm', config.format);
  if (config.fit) params.set('fit', config.fit);
  
  params.set('auto', 'format,compress');
  
  return `${baseUrl}/${src}?${params.toString()}`;
}

/**
 * Cloudflare Images URL builder
 */
function getCloudflareUrl(
  src: string,
  config: ImageOptimizationConfig,
  baseUrl: string
): string {
  const options: string[] = [];
  
  if (config.width) options.push(`width=${config.width}`);
  if (config.height) options.push(`height=${config.height}`);
  if (config.quality) options.push(`quality=${config.quality}`);
  if (config.format) options.push(`format=${config.format}`);
  if (config.fit) options.push(`fit=${config.fit}`);
  
  const optionsString = options.join(',');
  return `${baseUrl}/cdn-cgi/image/${optionsString}/${src}`;
}

/**
 * Asset optimization utilities
 */
export const AssetOptimization = {
  /**
   * Get optimal image format based on browser support
   */
  getOptimalFormat(userAgent?: string): ImageFormat {
    if (!userAgent) return 'webp';
    
    // Check for AVIF support (newer browsers)
    if (
      userAgent.includes('Chrome/') &&
      parseInt(userAgent.split('Chrome/')[1]) >= 85
    ) {
      return 'avif';
    }
    
    // WebP is widely supported
    return 'webp';
  },

  /**
   * Get responsive sizes attribute
   */
  getResponsiveSizes(maxWidth?: number): string {
    if (maxWidth && maxWidth <= 640) {
      return '100vw';
    } else if (maxWidth && maxWidth <= 1024) {
      return '(max-width: 640px) 100vw, 50vw';
    }
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  },

  /**
   * Generate image loader for Next.js
   */
  imageLoader: ({
    src,
    width,
    quality,
  }: {
    src: string;
    width: number;
    quality?: number;
  }) => {
    return getOptimizedImageUrl(src, {
      width,
      quality: quality || 75,
    });
  },
};

/**
 * Performance hints for images
 */
export const ImagePerformanceHints = {
  // Use appropriate image formats
  formats: {
    photos: 'webp or avif',
    graphics: 'webp or png',
    icons: 'svg',
    logos: 'svg or webp',
  },

  // Recommended sizes
  recommendations: {
    thumbnail: '150x150px, quality 70',
    preview: '400x400px, quality 75',
    detail: '800x800px, quality 80',
    hero: '1920x1080px, quality 85',
  },

  // Best practices
  tips: [
    'Use WebP format for 25-35% smaller file sizes',
    'Consider AVIF for even better compression',
    'Implement lazy loading for images below the fold',
    'Use responsive images with srcset',
    'Add blur placeholders for better perceived performance',
    'Serve images from CDN when possible',
    'Use appropriate quality settings (70-85 for most cases)',
    'Implement proper caching headers',
  ],
};
