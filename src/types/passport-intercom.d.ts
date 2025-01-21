declare module 'passport-intercom' {
  import { Strategy as PassportStrategy } from 'passport-strategy';
  import { Request } from 'express';

  interface IntercomStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    passReqToCallback?: boolean;
  }

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

  export class Strategy extends PassportStrategy {
    constructor(options: IntercomStrategyOptions, verify: VerifyFunction);
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
