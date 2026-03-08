import { Request } from 'express';
import { AppRole } from '../auth/roles.enum';

export interface AuthenticatedUser {
  id: string;
  role: AppRole;
  email?: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
