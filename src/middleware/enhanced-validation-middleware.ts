/**
 * Enhanced input validation middleware with comprehensive sanitization and XSS protection.
 *
 * @module middleware/enhanced-validation-middleware
 * @exports enhancedSchemas - Enhanced validation schemas with security features
 * @exports validateSchema - Validation middleware factory with sanitization
 * @exports validateFileUpload - File upload validation middleware
 */
import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { Request, Response, NextFunction } from 'express';
import {
  CategorizedError,
  ErrorCategory,
  ErrorSeverity,
} from './enhanced-error-middleware.js';

// Custom Joi extensions for security
const secureString = Joi.string().custom((value: string) => {
  // Remove potentially dangerous HTML/JS first
  const sanitized = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Return sanitized value - DOMPurify handles the XSS protection
  return sanitized;
}, 'XSS protection');

const secureUrl = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .max(2048);

// Enhanced validation schemas
export const enhancedSchemas = {
  // Webhook validation with strict requirements
  webhook: Joi.object({
    type: Joi.string()
      .required()
      .valid(
        'conversation.admin.replied',
        'conversation.admin.noted',
        'conversation.admin.closed',
        'conversation.user.created',
        'conversation.user.replied'
      ),
    data: Joi.object().required(),
    created_at: Joi.number()
      .integer()
      .positive()
      .max(Math.floor(Date.now() / 1000) + 300) // Max 5 minutes in future
      .required(),
    id: Joi.string()
      .uuid({ version: ['uuidv4'] })
      .required(),
    app_id: Joi.string().alphanum().length(8).required(),
  }).unknown(false), // Reject unknown fields

  // Enhanced message validation
  message: Joi.object({
    message: secureString
      .min(1)
      .max(10000) // Intercom's message limit
      .required(),
    sendDate: Joi.date()
      .iso()
      .min('now')
      .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // Max 1 year
      .required(),
    closeConversation: Joi.boolean().default(false),
  }),

  // Workspace validation
  workspace: Joi.object({
    workspaceId: Joi.string().alphanum().min(3).max(50).required(),
    adminId: Joi.number()
      .integer()
      .positive()
      .max(2147483647) // 32-bit integer limit
      .required(),
    accessToken: Joi.string()
      .pattern(/^[A-Za-z0-9_-]+$/)
      .min(10)
      .max(512)
      .required(),
    authorizationCode: Joi.string()
      .pattern(/^[A-Za-z0-9_-]+$/)
      .min(10)
      .max(512)
      .required(),
  }),

  // Canvas kit validation - Enhanced but maintains compatibility
  canvas: Joi.object({
    canvas_id: Joi.string().required(),
    workspace_id: Joi.string().required(),
    admin_id: Joi.string().required(),
    conversation_id: Joi.string().allow(''),
    current_url: secureUrl.required(),
    current_state: Joi.string().allow(''),
    submitted_state: Joi.object().unknown(true), // Allow flexible structure
    context: Joi.object({
      location: Joi.string().valid('conversation', 'inbox').required(),
      conversation_id: Joi.string().when('location', {
        is: 'conversation',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    }),
    input_values: Joi.object().pattern(
      Joi.string(),
      secureString.max(5000) // Apply sanitization to input values
    ),
  }).unknown(true), // Allow additional Intercom fields

  // Canvas submission validation with comprehensive input sanitization
  canvasSubmission: Joi.object({
    canvas_id: Joi.string().required(),
    workspace_id: Joi.string().required(),
    admin_id: Joi.string().required(),
    conversation_id: Joi.string().required(),
    current_url: secureUrl.required(),
    input_values: Joi.object()
      .pattern(
        Joi.string(),
        secureString.max(5000) // Sanitize all input values
      )
      .required(),
  }),

  // Snooze request validation with enhanced security
  snoozeRequest: Joi.object({
    conversationId: Joi.string().required(),
    adminId: Joi.string().required(),
    workspaceId: Joi.string().required(),
    messages: Joi.array()
      .items(
        Joi.object({
          message: secureString.max(5000).required(),
          sendDate: Joi.date().iso().min('now').required(),
        })
      )
      .min(1)
      .max(10)
      .required(),
  }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string()
      .valid('created_at', 'updated_at', 'send_date')
      .default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Health check validation
  healthCheck: Joi.object({
    detailed: Joi.boolean().default(false),
  }),
};

/**
 * Validation middleware factory that creates middleware to validate request data against Joi schemas.
 * Supports validation of body, query parameters, and route parameters with enhanced security features.
 *
 * @param schema - Joi schema to validate against
 * @param source - Source of data to validate ('body', 'query', or 'params')
 * @returns Express middleware function that validates the specified request data
 * @throws {CategorizedError} When validation fails, throws error with validation details
 */
export function validateSchema(
  schema: Joi.ObjectSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = req[source];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Joi validation result includes any type
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Joi context may contain any values
        value: detail.context?.value,
      }));

      throw new CategorizedError(
        'Input validation failed',
        400,
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        'validation-middleware',
        new Error(JSON.stringify(details))
      );
    }

    // Replace original data with validated/sanitized data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req[source] = value;
    next();
  };
}

/**
 * File upload validation middleware factory that validates uploaded files.
 * Checks file type against allowed MIME types and validates file size limits.
 *
 * @param allowedTypes - Array of allowed MIME types (default: image types)
 * @param maxSize - Maximum file size in bytes (default: 5MB)
 * @returns Express middleware function that validates uploaded files
 * @throws {CategorizedError} When file validation fails
 */
export const validateFileUpload = (
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Type assertion for multer file property - using any for Express.Multer compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const file = (req as any).file as
      | { mimetype: string; size: number }
      | undefined;

    if (!file) {
      return next();
    }

    // Validate file type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new CategorizedError(
        `File type ${file.mimetype} not allowed`,
        400,
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        'file-validation'
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      throw new CategorizedError(
        `File size ${file.size} exceeds maximum ${maxSize}`,
        400,
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        'file-validation'
      );
    }

    next();
  };
};
