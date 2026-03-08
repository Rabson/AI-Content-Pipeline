import { getServerSession } from 'next-auth';
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
    'x-actor-id': user.id,
    'x-actor-role': user.role,
    'x-user-email': user.email,
    ...(user.name ? { 'x-user-name': user.name } : {}),
    ...(env.internalApiToken ? { 'x-internal-api-token': env.internalApiToken } : {}),
  };
}
