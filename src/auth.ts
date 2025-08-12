
'use server';

import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from './lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { type User } from '@prisma/client';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth] Authorize function started.');
        if (!credentials?.email || !credentials.password) {
          console.error('[Auth] Missing email or password.');
          throw new CredentialsSignin('Missing email or password.');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        console.log(`[Auth] Attempting to log in with email: ${email}`);

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.error(`[Auth] No user found for email: ${email}`);
            return null; // Triggers login failure
          }
          console.log(`[Auth] Found user: ${user.name}`);

          // In a real app, always hash and compare passwords!
          if (user.password !== password) {
            console.error(`[Auth] Invalid password for user: ${email}`);
            return null; // Triggers login failure
          }

          console.log(`[Auth] Password verified for user: ${email}. Login successful.`);
          // The user object will be encoded in the JWT.
          return user;
        } catch (error) {
            console.error('[Auth] A database error occurred:', error);
            // Throwing the error will prevent login and log the issue.
            throw new Error('Database error during authorization.');
        }

      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, the `user` object is available.
      if (user) {
        token.id = user.id;
        token.role = (user as User).role; // Cast to get role
      }
      return token;
    },
    async session({ session, token }) {
      // Add id and role to the session object from the token.
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
