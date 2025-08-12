
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import prisma from './lib/prisma';
import type { User } from '@prisma/client';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
        });

        if (!user || user.password !== credentials.password) { // In a real app, hash and compare passwords!
            return null;
        }

        return user;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as User['role'];
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.email) {
          return token;
      }
      const user = await prisma.user.findUnique({
        where: { email: token.email },
      });
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
});
