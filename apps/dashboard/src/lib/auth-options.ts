import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

function resolveRole(email: string) {
  const adminEmails = (process.env.AUTH_ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const reviewerEmails = (process.env.AUTH_REVIEWER_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const normalizedEmail = email.toLowerCase();
  if (adminEmails.includes(normalizedEmail)) {
    return 'ADMIN';
  }
  if (reviewerEmails.includes(normalizedEmail)) {
    return 'REVIEWER';
  }
  return 'EDITOR';
}

function isAllowedDomain(email: string) {
  const allowedDomains = (process.env.AUTH_ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedDomains.length) {
    return true;
  }

  return allowedDomains.some((domain) => email.toLowerCase().endsWith(`@${domain}`));
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'Internal access',
      credentials: {
        email: { label: 'Email', type: 'email' },
        accessCode: { label: 'Access code', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const accessCode = credentials?.accessCode?.trim();
        const requiredAccessCode = process.env.DASHBOARD_ACCESS_CODE?.trim();

        if (!email || !accessCode) {
          return null;
        }

        if (!isAllowedDomain(email)) {
          return null;
        }

        if (requiredAccessCode && accessCode !== requiredAccessCode) {
          return null;
        }

        return {
          id: email,
          email,
          role: resolveRole(email),
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? 'EDITOR';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? session.user.email ?? 'dashboard-user');
        session.user.role = String(token.role ?? 'EDITOR');
      }
      return session;
    },
  },
};
