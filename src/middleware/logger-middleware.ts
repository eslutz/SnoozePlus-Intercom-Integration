import morgan from 'morgan';
import { Request, Response } from 'express';
import logger from '../config/logger-config.js';
import { LogData } from '../models/log-data-model.js';

// Configure Morgan to use the winston logger.
const morganMiddleware = morgan(
  function (tokens, req: Request, res: Response) {
    return JSON.stringify({
      method: tokens.method?.(req, res) ?? 'UNKNOWN',
      url: tokens.url?.(req, res) ?? 'UNKNOWN',
      status: Number.parseFloat(tokens.status?.(req, res) ?? '0'),
      content_length: tokens.res?.(req, res, 'content-length') ?? '0',
      response_time: Number.parseFloat(
        tokens['response-time']?.(req, res) ?? '0'
      ),
    });
  },
  {
    stream: {
      // Configure Morgan to use custom logger with the http severity level.
      write: (message: string) => {
        const data = JSON.parse(message) as LogData;
        logger.http(`incoming-request`, data);
      },
    },
  }
);

export { morganMiddleware };
