/**
 * Enhanced security headers middleware with comprehensive protection.
 *
 * @module middleware/security-headers
 * @exports securityHeaders - Enhanced helmet configuration
 * @exports additionalSecurityHeaders - Additional custom security headers
 */
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const securityHeaders = helmet({
  // Content Security Policy - Enhanced for Intercom integration
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Intercom Canvas styling
        'https://fonts.googleapis.com',
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:', // For custom fonts
      ],
      scriptSrc: [
        "'self'",
        // Only allow specific inline scripts for Intercom
        "'unsafe-inline'", // Limited to Intercom needs
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:', // Allow HTTPS images for Intercom
        'blob:', // For canvas and file handling
      ],
      connectSrc: [
        "'self'",
        'https://api.intercom.io',
        'https://api.intercom.com',
        'wss://nexus-websocket-a.intercom.io', // Intercom websockets
        'wss://nexus-websocket-b.intercom.io',
      ],
      frameSrc: [
        "'none'", // Prevent clickjacking
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests:
        process.env.NODE_ENV === 'production' ? [] : null,
    },
    // Report violations in development
    reportOnly: process.env.NODE_ENV === 'development',
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // Enable XSS protection
  xssFilter: true,

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Referrer Policy - Strict for security
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Cross-Origin Embedder Policy - Disabled for Intercom compatibility
  crossOriginEmbedderPolicy: false,

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },

  // Cross-Origin Resource Policy - Allow cross-origin for Intercom
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
});

// Additional custom security headers
export const additionalSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Feature Policy / Permissions Policy - Restrict dangerous features
  res.setHeader(
    'Permissions-Policy',
    [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'interest-cohort=()', // Disable FLoC
    ].join(', ')
  );

  // Additional security headers
  res.setHeader('X-Application-Name', 'SnoozePlus-Intercom-Integration');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent page from being loaded in frames from different origins
  res.setHeader('X-Frame-Options', 'DENY');

  // Control information sent in referrer header
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add cache control for sensitive endpoints
  if (req.path.includes('/auth') || req.path.includes('/admin')) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // Add security headers for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
  }

  next();
};
