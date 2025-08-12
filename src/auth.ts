
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
        if (!credentials?.email || !credentials.password) {
          throw new CredentialsSignin("Missing email or password.");
        }

        const email = credentials.email as string;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || user.password !== credentials.password) {
          // In a real app, hash and compare passwords.
          throw new CredentialsSignin("Invalid email or password.");
        }
        
        // The user object will be encoded in the JWT.
        return user;
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
    // We handle errors on the login page now, so a separate error page is not needed.
    // error: '/login' 
  },
});
