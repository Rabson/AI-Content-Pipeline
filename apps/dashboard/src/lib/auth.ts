import { getServerSession } from 'next-auth';
import { signServiceToken } from '@aicp/shared-config/auth/service-token';
import { env } from '../config/env';
import { authOptions } from './auth-options';

export interface DashboardUser {
  id: string;
  role: string;
  email: string;
  name?: string | null;
  authorized: boolean;
}

export async function getDashboardUser(): Promise<DashboardUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      id: '',
      role: '',
      email: '',
      name: '',
      authorized: false,
    };
  }

  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
    name: session.user.name,
    authorized: true,
  };
}

export async function getDashboardAuthHeaders() {
  const user = await getDashboardUser();
  if (!user.authorized) {
    throw new Error('Dashboard user is not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${signServiceToken({
      secret: env.internalServiceJwtSecret,
      issuer: env.internalServiceJwtIssuer,
      audience: env.internalServiceJwtAudience,
      subject: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      ttlSeconds: env.internalServiceJwtTtlSeconds,
    })}`,
  };
}
