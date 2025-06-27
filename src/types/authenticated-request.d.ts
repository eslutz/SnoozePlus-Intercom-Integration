import { Request } from 'express';

/**
 * Extended Express Request interface that includes authentication-specific methods.
 * Provides proper type definitions for methods that are added by Express session and
 * Passport authentication middleware.
 *
 * @interface AuthenticatedRequest
 * @extends {Request}
 * @property {Function} logout - Function to log out the current user and clear their login session
 * @property {Object} session - Enhanced session object with destroy method
 */
export interface AuthenticatedRequest extends Request {
  /**
   * Terminates the login session of the current user.
   * This is added by Passport.js middleware when authentication is enabled.
   *
   * @param {Function} cb - Callback function called after logout completes
   * @param {Error|null} cb.err - Error if logout failed, null if successful
   * @returns {void}
   */
  logout(cb: (err: Error | null) => void): void;

  /**
   * Enhanced session object with additional methods for authenticated sessions.
   *
   * @property {Function} destroy - Destroys the current session
   */
  session: {
    /**
     * Destroys the current session and removes associated data.
     *
     * @param {Function} cb - Callback function called after session destruction completes
     * @param {Error|null} cb.err - Error if destruction failed, null if successful
     * @returns {void}
     */
    destroy(cb: (err: Error | null) => void): void;

    /**
     * Optional URL to return to after authentication.
     * Used in the login process to redirect after successful authentication.
     */
    lastUrl?: string;
  };
}
