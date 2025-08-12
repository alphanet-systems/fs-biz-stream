
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
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none", // Required for cross-site and iframe contexts
        path: "/",
        secure: true, // Required when sameSite is "none"
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("--- Authorize Function Triggered ---");
        console.log("Received credentials from form:", credentials);

        if (!credentials?.email || !credentials?.password) {
          console.error("Credentials missing email or password.");
          return null;
        }
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // 1. Find the user in the database
          console.log(`Searching for user with email: '${credentials.email}'`);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user) {
            console.error("DATABASE_SEARCH: User not found in database.");
            return null; // Stop here if user doesn't exist
          }

          console.log("DATABASE_SEARCH: Found user:", user);

          // 2. Compare the provided password with the one in the database
          console.log("--- Password Comparison ---");
          console.log(`Password from form: '${credentials.password}'`);
          console.log(`Password from DB:   '${user.password}'`);

          const passwordsMatch = user.password === credentials.password;

          console.log(`Do passwords match? ${passwordsMatch}`);
          console.log("--------------------------");


          if (passwordsMatch) {
            console.log("SUCCESS: Passwords match. Returning user.");
            return user; // Success!
          } else {
            console.error("FAILURE: Passwords do not match.");
            return null; // Passwords didn't match
          }
        } catch (error) {
          console.error("An unexpected error occurred during authorization:", error);
          return null;
        }
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
