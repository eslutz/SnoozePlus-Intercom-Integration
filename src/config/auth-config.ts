import passport from 'passport';
import logger from './logger-config';
import * as userDbService from '../services/user-db-service';
import { encrypt } from '../utilities/crypto-utility';
import { Profile } from '../models/profile-model';
import { User } from '../models/user-model';

const IntercomStrategy = require('passport-intercom').Strategy;

// Load Intercom client ID and secret from environment variables.
const intercomClientId = process.env.INTERCOM_CLIENT_ID;
if (!intercomClientId) {
  throw new Error('INTERCOM_CLIENT_ID cannot be found!');
}
const intercomClientSecret = process.env.INTERCOM_CLIENT_SECRET;
if (!intercomClientSecret) {
  throw new Error('INTERCOM_CLIENT_SECRET cannot be found!');
}

const authLogger = logger.child({ module: 'auth-config' });

passport.use(
  new IntercomStrategy(
    {
      clientID: intercomClientId,
      clientSecret: intercomClientSecret,
      callbackURL: 'https://localhost:8706/auth/intercom/callback',
      passReqToCallback: true,
    },
    async (
      req: any,
      accessToken: any,
      refreshToken: any,
      profile: Profile,
      done: (arg0: null, arg1: any) => any
    ) => {
      // Encrypt the access token before storing it.
      let encryptedAccessToken: string;
      authLogger.info('Encrypting access token.');
      authLogger.profile('encrypt');
      try {
        encryptedAccessToken = encrypt(accessToken);
      } catch (err) {
        authLogger.error(`Error encrypting access token: ${err}`);
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
        encryptedAuthorizationCode = encrypt(req.query.code);
      } catch (err) {
        authLogger.error(`Error encrypting authorization code: ${err}`);
        throw err;
      }
      authLogger.profile('encrypt', {
        level: 'info',
        message: 'Authorization code encrypted.',
      });

      // Add accessToken to the profile object.
      profile.accessToken = encryptedAccessToken;

      // Create a user to save to the database.
      const user: User = {
        id: Number(profile.id),
        accountType: profile._json.type,
        accessToken: encryptedAccessToken,
        authorizationCode: encryptedAuthorizationCode,
      };

      authLogger.debug('Saving user to database');
      authLogger.profile('saveUser');
      const userResponse = await userDbService.saveUser(user);
      authLogger.profile('saveUser', {
        level: 'debug',
        message: 'User saved to database.',
      });
      authLogger.debug(`Save user response: ${JSON.stringify(userResponse)}`);
      authLogger.debug(`User profile: ${profile}`);

      return done(null, profile);
    }
  )
);

passport.serializeUser((user: any, done: (arg0: null, arg1: any) => any) =>
  done(null, user)
);
passport.deserializeUser((obj: any, done: (arg0: null, arg1: any) => any) =>
  done(null, obj)
);
