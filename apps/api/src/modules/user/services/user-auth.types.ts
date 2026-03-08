import { AppRole } from '@api/common/auth/roles.enum';

export class AuthenticatedUserView {
  id!: string;
  email!: string;
  role!: AppRole;
  name?: string | null;
  apiToken!: string;
  apiTokenExpiresInSeconds!: number;
}
