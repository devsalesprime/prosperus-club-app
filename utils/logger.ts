// ============================================
// CENTRALIZED LOGGER
// ============================================
// Environment-aware logging utility.
// debug/info/warn are silenced in production builds.
// error always logs (critical for production debugging).
//
// Usage:
//   import { logger } from '../utils/logger';
//   logger.debug('Subscription started', { id });
//   logger.info('✅ Profile saved');
//   logger.warn('⚠️ Invalid UUID');
//   logger.error('❌ Query failed:', error);

const isDev = import.meta.env.DEV;

function noop(..._args: unknown[]): void {
    // intentionally empty — silenced in production
}

export const logger = {
    /** Noisy diagnostic info — dev only */
    debug: isDev ? console.log.bind(console) : noop,

    /** Successful operations, confirmations — dev only */
    info: isDev ? console.log.bind(console) : noop,

    /** Validation warnings, fallback paths — dev only */
    warn: isDev ? console.warn.bind(console) : noop,

    /** Errors — always active, even in production */
    error: console.error.bind(console),
};

export default logger;
