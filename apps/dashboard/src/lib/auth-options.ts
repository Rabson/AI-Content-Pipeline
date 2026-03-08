import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { env } from '../config/env';
import { clearAuthRateLimit, enforceAuthRateLimit } from './auth-rate-limit';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  providers: [
    CredentialsProvider({
      name: 'Internal access',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password?.trim();
        const rateLimitKey = `${email ?? 'unknown'}:${request.headers?.['x-forwarded-for'] ?? 'local'}`;
        if (!email || !password) return null;
        enforceAuthRateLimit(rateLimitKey, env.authRateLimitMaxAttempts, env.authRateLimitWindowMs);
        try {
          const response = await fetch(`${env.apiBase}/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            cache: 'no-store',
          });
          if (!response.ok) return null;
          clearAuthRateLimit(rateLimitKey);
          const user = (await response.json()) as { id: string; email: string; role: string; name?: string | null };
          return { id: user.id, email: user.email, role: user.role, name: user.name } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? 'USER';
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? session.user.email ?? 'dashboard-user');
        session.user.role = String(token.role ?? 'USER');
        session.user.name = typeof token.name === 'string' ? token.name : session.user.name;
      }
      return session;
    },
  },
};
