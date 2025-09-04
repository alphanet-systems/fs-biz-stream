import NextAuth, { type DefaultSession } from 'next-auth';
import { type User as PrismaUser } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      companyName?: string | null;
    } & DefaultSession['user'];
  }

   interface User extends Omit<PrismaUser, 'role'> {
     role: string;
   }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    companyName?: string | null;
  }
}
