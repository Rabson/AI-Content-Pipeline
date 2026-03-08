import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: string;
    name?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    name?: string | null;
  }
}
