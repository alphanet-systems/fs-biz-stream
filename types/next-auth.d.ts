import { type User as PrismaUser } from '@prisma/client';
import NextAuth, { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: PrismaUser['role'];
    } & DefaultSession['user'];
  }

   interface User extends PrismaUser {}
}
