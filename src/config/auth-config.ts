import passport from 'passport';
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

passport.use(
  new IntercomStrategy(
    {
      clientID: intercomClientId,
      clientSecret: intercomClientSecret,
      callbackURL: 'https://localhost:8706/auth/intercom/callback',
    },
    (
      accessToken: any,
      refreshToken: any,
      profile: Profile,
      done: (arg0: null, arg1: any) => any
    ) => {
      profile.accessToken = accessToken;
      console.log('accessToken', accessToken);
      console.log('refreshToken', refreshToken);
      console.log('profile', profile);
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
