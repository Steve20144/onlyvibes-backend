import morgan from 'morgan';

export const requestLogger = morgan(':method :url :status :response-time ms');

export const logger = {
  info: (...args) => console.log('[OnlyVibes]', ...args),
  warn: (...args) => console.warn('[OnlyVibes]', ...args),
  error: (...args) => console.error('[OnlyVibes]', ...args)
};
