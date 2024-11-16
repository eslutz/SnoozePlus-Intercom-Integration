import passport from 'passport';
const IntercomStrategy = require('passport-intercom').Strategy;

const INTERCOM_CLIENT_ID = process.env.INTERCOM_CLIENT_ID;
const INTERCOM_CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET;

passport.use(
  new IntercomStrategy(
    {
      clientID: INTERCOM_CLIENT_ID,
      clientSecret: INTERCOM_CLIENT_SECRET,
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
