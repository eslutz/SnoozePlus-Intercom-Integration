/**
 * Type declarations for the passport-intercom module.
 * This module provides Passport strategy for authenticating with Intercom using OAuth 2.0.
 */
declare module 'passport-intercom' {
  import { Strategy as PassportStrategy } from 'passport-strategy';
  import { Request } from 'express';

  /**
   * Configuration options for the Intercom authentication strategy.
   *
   * @interface IntercomStrategyOptions
   * @property {string} clientID - The client ID assigned to your app by Intercom
   * @property {string} clientSecret - The client secret assigned to your app by Intercom
   * @property {string} callbackURL - URL to which Intercom will redirect after authentication
   * @property {boolean} [passReqToCallback] - Whether to pass the request object to the verify callback
   */
  interface IntercomStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    passReqToCallback?: boolean;
  }

  /**
   * Profile object containing user information returned by Intercom.
   *
   * @interface Profile
   * @property {string} provider - The provider name ('intercom')
   * @property {string} id - The user's Intercom ID
   * @property {string} displayName - The user's display name
   * @property {Array} emails - Array of user email objects
   * @property {Array} photos - Array of user photo URLs
   * @property {string} _raw - Raw JSON string of the profile data
   * @property {object} _json - Parsed JSON object containing complete profile information
   * @property {string} accessToken - OAuth access token (not readonly as it's assigned after authentication)
   */
  interface Profile {
    readonly provider: string;
    readonly id: string;
    readonly displayName: string;
    readonly emails: { value: string; type: string }[];
    readonly photos: string[];
    readonly _raw: string;
    readonly _json: {
      type: string;
      id: string;
      email: string;
      name: string;
      email_verified: boolean;
      app: {
        type: string;
        id_code: string;
        name: string;
        created_at: number;
        secure: boolean;
        identity_verification: boolean;
        timezone: string;
        region: string;
      };
      avatar: {
        type: string;
        image_url: string;
      };
      has_inbox_seat: boolean;
    };
    accessToken: string;
  }

  /**
   * Verify callback function signature for Intercom strategy.
   *
   * @callback VerifyFunction
   * @param {Request} req - The Express request object if passReqToCallback is true
   * @param {string} accessToken - OAuth 2.0 access token
   * @param {string|undefined} refreshToken - OAuth 2.0 refresh token (may be undefined)
   * @param {Profile} profile - User profile from Intercom
   * @param {Function} done - Callback to signal authentication success or failure
   * @returns {void|Promise<void>} Nothing or a Promise resolving to nothing
   */
  type VerifyFunction = (
    req: Request,
    accessToken: string,
    refreshToken: string | undefined,
    profile: Profile,
    done: (
      error: Error | null,
      user?: Profile | false | null,
      info?: { message: string }
    ) => void
  ) => void | Promise<void>;

  /**
   * Passport strategy for authenticating with Intercom using OAuth 2.0.
   *
   * @class Strategy
   * @extends {PassportStrategy}
   */
  export class Strategy extends PassportStrategy {
    /**
     * Creates an instance of the Intercom authentication strategy.
     *
     * @constructor
     * @param {IntercomStrategyOptions} options - Configuration options
     * @param {VerifyFunction} verify - Verification callback
     */
    constructor(options: IntercomStrategyOptions, verify: VerifyFunction);

    /**
     * Authenticate request by delegating to Intercom OAuth 2.0 provider.
     *
     * @param {Request} req - The request object
     * @param {object} [options] - Authentication options
     * @param {string} [options.state] - State parameter for OAuth flow
     * @param {string} [options.failureRedirect] - URL to redirect to on authentication failure
     * @param {string} [options.failureMessage] - Message to display on authentication failure
     * @returns {void}
     */
    authenticate(
      req: Request,
      options?: {
        state?: string;
        failureRedirect?: string;
        failureMessage?: string;
      }
    ): void;
  }
}
