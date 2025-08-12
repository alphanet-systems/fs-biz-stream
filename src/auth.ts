
import NextAuth, { type CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from './lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { type User } from '@prisma/client';

const authConfig = NextAuth({
  adapter: PrismaAdapter(prisma),
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
          throw new CredentialsSignin('Missing email or password.');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          console.error("No user found with that email.");
          return null;
        }
        
        const passwordsMatch = user.password === password;

        if (passwordsMatch) {
          return user;
        }
        
        console.error("Passwords do not match.");
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as User).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === "development",
});

export const { 
  handlers: { GET, POST }, 
  auth, 
  signIn, 
  signOut 
} = authConfig;
