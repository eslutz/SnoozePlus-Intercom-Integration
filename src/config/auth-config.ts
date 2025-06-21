/**
 * Authentication configuration using Passport.js with Intercom OAuth strategy.
 *
 * The authentication flow:
 * 1. Initializes Passport with Intercom Strategy
 * 2. Processes OAuth callback with user profile data
 * 3. Encrypts access token and authorization code
 * 4. Saves workspace information to database
 * 5. Handles success/failure redirects
 *
 * @module auth-config
 * @exports passport Configured Passport instance
 * @remarks
 *  - The strategy requires Intercom client ID, client secret, and callback URL from config
 *  - Implements encryption for sensitive data (access token and authorization code)
 *  - Stores workspace information including admin ID and encrypted tokens
 *  - Includes error handling with appropriate redirects
 *  - Uses custom logging for debugging and performance profiling
 */
import passport from 'passport';
import { Strategy as IntercomStrategy, Profile } from 'passport-intercom';
import { Request } from 'express';
import config from './config.js';
import logger from './logger-config.js';
import * as workspaceDbService from '../services/user-db-service.js';
import { encrypt } from '../utilities/crypto-utility.js';
import { Workspace } from '../models/workspace-model.js';

const authLogger = logger.child({ module: 'auth-config' });

passport.use(
  new IntercomStrategy(
    {
      clientID: config.intercomClientId,
      clientSecret: config.intercomClientSecret,
      callbackURL: config.intercomCallbackUrl,
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      _refreshToken: string | undefined,
      profile: Profile,
      done: (error: Error | null, user?: Profile | false | null) => void
    ) => {
      try {
        // Encrypt the access token before storing it.
        let encryptedAccessToken: string;
        authLogger.info('Encrypting access token.');
        authLogger.profile('encrypt');
        try {
          encryptedAccessToken = encrypt(accessToken);
        } catch (err) {
          authLogger.error(`Error encrypting access token: ${String(err)}`);
          throw err;
        }
        authLogger.profile('encrypt', {
          level: 'info',
          message: 'Access token encrypted.',
        });

        // Encrypt the authorization code before storing it.
        let encryptedAuthorizationCode: string;
        authLogger.info('Encrypting authorization code.');
        authLogger.profile('encrypt');
        try {
          encryptedAuthorizationCode = encrypt(req.query.code as string);
        } catch (err) {
          authLogger.error(
            `Error encrypting authorization code: ${String(err)}`
          );
          throw err;
        }
        authLogger.profile('encrypt', {
          level: 'info',
          message: 'Authorization code encrypted.',
        });

        // Add accessToken to the profile object.
        profile.accessToken = encryptedAccessToken;

        // Create a user to save to the database.
        const user: Workspace = {
          workspaceId: profile._json.app.id_code,
          adminId: Number(profile.id),
          accessToken: encryptedAccessToken,
          authorizationCode: encryptedAuthorizationCode,
        };

        authLogger.debug('Saving user to database');
        authLogger.profile('saveWorkspace');
        const userResponse = await workspaceDbService.saveWorkspace(user);
        authLogger.profile('saveWorkspace', {
          level: 'debug',
          message: 'User saved to database.',
        });
        authLogger.debug(`Save user response: ${JSON.stringify(userResponse)}`);
        authLogger.debug(`User profile: ${JSON.stringify(profile)}`);

        // Redirect the user after successful authentication
        if (!req.res) {
          return done(new Error('Response object is undefined'), null);
        }
        req.res.redirect(
          'https://app.intercom.com/appstore/redirect?install_success=true'
        );
        return done(null, profile);
      } catch (err) {
        // Redirect the user after authentication failure
        if (!req.res) {
          return done(new Error('Response object is undefined'), null);
        }
        req.res.redirect(
          `https://app.intercom.com/appstore/redirect?install_success=false&error_message=${encodeURIComponent(err as string)}`
        );
      }
    }
  )
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.serializeUser((user: any, done: (err: any, id?: any) => void) =>
  done(null, user)
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.deserializeUser((obj: any, done: (err: any, user?: any) => void) =>
  done(null, obj)
);
