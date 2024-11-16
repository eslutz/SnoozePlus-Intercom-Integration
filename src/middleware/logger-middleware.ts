import morgan from 'morgan';
import logger from '../config/logger-config';

// Configure Morgan to use the winston logger.
const morganMiddleware = morgan(
  function (tokens, req, res) {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number.parseFloat(tokens.status(req, res) ?? '0'),
      content_length: tokens.res(req, res, 'content-length'),
      response_time: Number.parseFloat(
        tokens['response-time'](req, res) ?? '0'
      ),
    });
  },
  {
    stream: {
      // Configure Morgan to use custom logger with the http severity level.
      write: (message) => {
        const data = JSON.parse(message);
        logger.http(`incoming-request`, data);
      },
    },
  }
);

export { morganMiddleware };
