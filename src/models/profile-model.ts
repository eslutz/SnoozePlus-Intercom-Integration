export interface Profile {
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
