
import NextAuth from 'next-auth';
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
        console.log('--- Authorize function started ---');
        console.log('Received credentials:', credentials);

        if (!credentials?.email || !credentials.password) {
          console.log('Error: Missing email or password.');
          console.log('--- Authorize function ending ---');
          return null;
        }

        const email = credentials.email as string;
        console.log(`Attempting to find user with email: ${email}`);
        
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          console.log(`Error: No user found with email: ${email}`);
          console.log('--- Authorize function ending ---');
          return null;
        }
        
        console.log('User found in database:', { id: user.id, email: user.email, role: user.role });

        // In a real app, always hash and compare passwords.
        // For this project, we are using plain text comparison.
        if (user.password !== credentials.password) {
          console.log('Error: Password does not match.');
          console.log('--- Authorize function ending ---');
          return null;
        }
        
        console.log('Password matches. User authenticated successfully.');
        console.log('--- Authorize function ending ---');
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
    error: '/login' // Redirect to login page on any auth error
  },
});
