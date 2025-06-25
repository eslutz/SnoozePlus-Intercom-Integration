import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../config/logger-config.js';

const validationLogger = logger.child({
  module: 'validation-middleware',
});

/**
 * Creates a middleware for validating request data using Joi schemas
 *
 * @param schema The Joi schema to validate against
 * @param property The request property to validate (body, query, params)
 * @returns Express middleware function
 */
export const validateRequest = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      validationLogger.warn('Request validation failed', {
        errors: errorMessages,
        property,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: req[property],
      });

      res.status(400).json({
        error: 'Validation Error',
        details: errorMessages,
      });
      return;
    }

    // Replace the original data with the validated (and potentially transformed) data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
export const schemas = {
  // Webhook validation
  webhook: Joi.object({
    type: Joi.string().required(),
    data: Joi.object().required(),
    created_at: Joi.number().integer().positive(),
    id: Joi.string(),
  }),

  // Canvas submission validation
  canvasSubmission: Joi.object({
    canvas_id: Joi.string().required(),
    workspace_id: Joi.string().required(),
    admin_id: Joi.string().required(),
    conversation_id: Joi.string().required(),
    current_url: Joi.string().uri().required(),
    input_values: Joi.object()
      .pattern(
        Joi.string(),
        Joi.string().max(5000) // Limit message size
      )
      .required(),
  }),

  // Message validation
  message: Joi.object({
    message: Joi.string().max(5000).required(),
    sendDate: Joi.date().iso().min('now').required(),
  }),

  // Snooze request validation
  snoozeRequest: Joi.object({
    conversationId: Joi.string().required(),
    adminId: Joi.string().required(),
    workspaceId: Joi.string().required(),
    messages: Joi.array()
      .items(
        Joi.object({
          message: Joi.string().max(5000).required(),
          sendDate: Joi.date().iso().min('now').required(),
        })
      )
      .min(1)
      .max(10)
      .required(), // Limit to 10 messages max
  }),

  // Health check validation
  healthCheck: Joi.object({
    detailed: Joi.boolean().default(false),
  }),
};

/**
 * Error handling middleware for validation errors
 */
export const handleValidationError = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.name === 'ValidationError') {
    validationLogger.error('Validation error occurred', {
      error: error.message,
      url: req.url,
      method: req.method,
    });

    // Check if response was already sent to prevent duplicate headers
    if (res.headersSent) {
      validationLogger.warn('Response already sent, delegating to next middleware');
      return next(error);
    }

    res.status(400).json({
      error: 'Validation Error',
      message: error.message,
    });
    return;
  }

  next(error);
};
