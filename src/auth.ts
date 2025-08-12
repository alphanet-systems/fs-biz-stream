
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from './lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { type User } from '@prisma/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
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
          // In a real app, you'd want to avoid logging this for security reasons,
          // but it's helpful for debugging.
          console.error(`[Auth] No user found for email: ${email}`);
          return null; // Triggers login failure
        }
        
        // In a real app, always hash and compare passwords!
        const passwordsMatch = user.password === password;

        if (passwordsMatch) {
          // Return the user object to be encoded in the JWT
          return user;
        }
        
        console.error(`[Auth] Invalid password for user: ${email}`);
        return null; // Triggers login failure
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
    error: '/login', // Redirect auth errors back to the login page
  },
  debug: process.env.NODE_ENV === "development",
});
