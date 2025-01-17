import { Profile } from '../models/profile-model';

declare namespace Express {
  export interface Request {
    user?: Profile;
  }
}
