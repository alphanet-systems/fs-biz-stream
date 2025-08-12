import NextAuth, { type CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { type User } from '@prisma/client';

export const { 
  handlers: { GET, POST }, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials.password) {
          throw new CredentialsSignin('Missing email or password.');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new CredentialsSignin("Invalid email or password.");
        }
        
        // In a real app, you MUST hash passwords.
        const passwordsMatch = user.password === password;

        if (passwordsMatch) {
          return user;
        }
        
        throw new CredentialsSignin("Invalid email or password.");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.id = user.id;
        token.role = (user as User).role;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
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
  debug: process.env.NODE_ENV === "development",
});