import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      email: string;
      apiToken: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: string;
    apiToken: string;
    name?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    apiToken?: string;
    name?: string | null;
  }
}
