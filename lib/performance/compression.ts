/**
 * Response Compression Middleware
 * Compress API responses to reduce bandwidth
 */

import { NextRequest, NextResponse } from 'next/server';
import { gzip, deflate } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const deflateAsync = promisify(deflate);

/**
 * Compression configuration
 */
export interface CompressionConfig {
  threshold?: number; // Minimum size in bytes to compress (default: 1024)
  level?: number; // Compression level 1-9 (default: 6)
  excludePaths?: RegExp[];
  excludeTypes?: string[];
}

const DEFAULT_CONFIG: Required<CompressionConfig> = {
  threshold: 1024, // 1KB
  level: 6,
  excludePaths: [/^\/api\/stream/, /^\/api\/upload/],
  excludeTypes: [
    'image/',
    'video/',
    'audio/',
    'application/zip',
    'application/gzip',
    'application/pdf',
  ],
};

/**
 * Check if content type should be compressed
 */
function shouldCompress(
  contentType: string | null,
  config: Required<CompressionConfig>
): boolean {
  if (!contentType) return false;

  // Check excluded types
  for (const excludeType of config.excludeTypes) {
    if (contentType.includes(excludeType)) {
      return false;
    }
  }

  // Compress text-based content
  return (
    contentType.includes('text/') ||
    contentType.includes('application/json') ||
    contentType.includes('application/javascript') ||
    contentType.includes('application/xml')
  );
}

/**
 * Check if path should be compressed
 */
function shouldCompressPath(
  pathname: string,
  config: Required<CompressionConfig>
): boolean {
  for (const excludePath of config.excludePaths) {
    if (excludePath.test(pathname)) {
      return false;
    }
  }
  return true;
}

/**
 * Get accepted encoding from request
 */
function getAcceptedEncoding(req: NextRequest): 'gzip' | 'deflate' | null {
  const acceptEncoding = req.headers.get('accept-encoding');
  if (!acceptEncoding) return null;

  if (acceptEncoding.includes('gzip')) return 'gzip';
  if (acceptEncoding.includes('deflate')) return 'deflate';
  return null;
}

/**
 * Compress response middleware
 */
export function compressionMiddleware(config: CompressionConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async function (
    req: NextRequest,
    response: NextResponse
  ): Promise<NextResponse> {
    try {
      // Check if path should be compressed
      if (!shouldCompressPath(req.nextUrl.pathname, finalConfig)) {
        return response;
      }

      // Check if client accepts compression
      const encoding = getAcceptedEncoding(req);
      if (!encoding) {
        return response;
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!shouldCompress(contentType, finalConfig)) {
        return response;
      }

      // Get response body
      const body = await response.text();
      const bodySize = Buffer.byteLength(body, 'utf-8');

      // Check minimum size threshold
      if (bodySize < finalConfig.threshold) {
        return response;
      }

      // Compress body
      const buffer = Buffer.from(body, 'utf-8');
      let compressed: Buffer;

      if (encoding === 'gzip') {
        compressed = await gzipAsync(buffer, { level: finalConfig.level });
      } else {
        compressed = await deflateAsync(buffer, { level: finalConfig.level });
      }

      // Create new response with compressed body
      const compressedResponse = new NextResponse(compressed, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Set compression headers
      compressedResponse.headers.set('Content-Encoding', encoding);
      compressedResponse.headers.set('Content-Length', compressed.length.toString());
      compressedResponse.headers.delete('Content-Type');
      compressedResponse.headers.set('Content-Type', contentType || 'application/json');

      // Add vary header for caching
      const vary = response.headers.get('vary');
      if (vary) {
        if (!vary.includes('Accept-Encoding')) {
          compressedResponse.headers.set('Vary', `${vary}, Accept-Encoding`);
        }
      } else {
        compressedResponse.headers.set('Vary', 'Accept-Encoding');
      }

      return compressedResponse;
    } catch (error) {
      console.error('Compression error:', error);
      return response; // Return original response on error
    }
  };
}

/**
 * Helper to create compressed JSON response
 */
export async function compressedJson(
  data: any,
  req: NextRequest,
  options?: {
    status?: number;
    headers?: Record<string, string>;
  }
): Promise<NextResponse> {
  const json = JSON.stringify(data);
  const encoding = getAcceptedEncoding(req);

  // If no compression support, return regular JSON
  if (!encoding) {
    return NextResponse.json(data, options);
  }

  const buffer = Buffer.from(json, 'utf-8');
  const bodySize = buffer.length;

  // Don't compress small responses
  if (bodySize < 1024) {
    return NextResponse.json(data, options);
  }

  try {
    // Compress
    const compressed =
      encoding === 'gzip'
        ? await gzipAsync(buffer, { level: 6 })
        : await deflateAsync(buffer, { level: 6 });

    // Create response
    const response = new NextResponse(compressed, {
      status: options?.status || 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': encoding,
        'Content-Length': compressed.length.toString(),
        'Vary': 'Accept-Encoding',
        ...options?.headers,
      },
    });

    return response;
  } catch (error) {
    console.error('JSON compression error:', error);
    return NextResponse.json(data, options);
  }
}

/**
 * Compression statistics
 */
export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  encoding: string;
}

export function getCompressionStats(
  originalSize: number,
  compressedSize: number,
  encoding: string
): CompressionStats {
  return {
    originalSize,
    compressedSize,
    compressionRatio: Math.round((1 - compressedSize / originalSize) * 100),
    encoding,
  };
}

/**
 * Middleware for API routes
 */
export async function withCompression(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const response = await handler();
  const compression = compressionMiddleware();
  return compression(req, response);
}
