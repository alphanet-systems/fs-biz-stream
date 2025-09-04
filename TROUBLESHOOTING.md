# Troubleshooting Common Development Issues

This document outlines solutions to common errors that may occur during the initial setup and development of this project, particularly related to Prisma and the development environment.

## 1. Prisma Error: "The table main.User does not exist"

- **Error Log:** `PrismaClientKnownRequestError: Invalid prisma.user.findUnique() invocation... The table main.User does not exist in the current database.`

- **Cause:** This error (P2021) occurs when a Prisma command (like `prisma db seed`) tries to access a database table that hasn't been created yet. The `dev` script was attempting to seed the database *before* the schema was pushed to create the tables.

- **Solution:** The order of operations in the `dev` script in `package.json` is critical. We must ensure the database schema is synchronized **before** attempting to seed it. The `prisma db push` command handles this by creating or updating tables to match `schema.prisma`.

  The `dev` script in `package.json` was updated to run the commands in the correct order:

  ```json
  "scripts": {
    "dev": "prisma db push && prisma db seed && next dev --turbopack -p 9002",
    //...
  }
  ```

  This ensures that every time the development server starts, the database schema is synchronized first, then seeded, and finally, the application is launched.

## 2. Prisma Error: OpenSSL Version Mismatch

- **Error Log:** `Prisma Client could not locate the Query Engine for runtime "debian-openssl-3.0.x". This happened because Prisma Client was generated for "debian-openssl-1.1.x"...`

- **Cause:** This error occurs when the Prisma Client is generated in an environment with one version of OpenSSL, but the application runs in an environment with a different, incompatible version. The pre-compiled Query Engine binary that Prisma downloads must match the system's OpenSSL version.

- **Solution:** The fix is to explicitly tell Prisma to generate binaries for all required environments. This is done by adding the target environment's identifier to the `binaryTargets` array in the `generator` block of the `prisma/schema.prisma` file.

  The `generator` block was updated as follows:

  ```prisma
  // prisma/schema.prisma

  generator client {
    provider      = "prisma-client-js"
    binaryTargets = ["native", "debian-openssl-3.0.x", "debian-openssl-1.1.x"]
  }
  ```
  After making this change, running `prisma generate` (which happens automatically on `npm install`) downloads the correct binaries, resolving the conflict.

## 3. NextAuth.js Error: "MissingCSRF" in Cloud IDEs

- **Error Log:** `Error: [auth][error] MissingCSRF: CSRF token was missing during an action callback.` This often occurs when logging in from the integrated browser preview in a cloud development environment like Firebase Studio.

- **Cause:** The integrated browser is an `<iframe>`. Modern browsers have strict security policies that block "third-party cookies" inside iframes to prevent tracking. The Next.js server, running on `localhost` inside a container, sets an authentication cookie for that `localhost` domain. Your browser, viewing the app from a public `...cloudworkstations.dev` URL, sees this as a cross-site context and refuses to send the cookie back with the login request. The NextAuth.js backend, expecting a CSRF token in the cookie, sees that it's missing and throws a security error.

- **Solution:** The solution involves multiple steps to configure NextAuth.js to be compatible with this proxied, iframe environment.

  **Step 1: Configure Iframe-Friendly Cookies in `src/auth.ts`**
  You must explicitly tell NextAuth.js to set cookies with the `SameSite=None` and `Secure=true` attributes. This is done by adding a `cookies` block to the `NextAuth` configuration. The `__Secure-` and `__Host-` prefixes are a best practice that enforces these security policies.

  ```typescript
  // src/auth.ts

  export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut
  } = NextAuth({
    // ... adapter, providers
    session: {
      strategy: 'jwt',
    },
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "none",
          path: "/",
          secure: true,
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
    // ... rest of config
  });
  ```
  
  **Step 2: Trust the Proxy Host Header in `src/auth.ts`**
  You also need to tell NextAuth.js to trust the `Host` header from the proxy server, which will be the public URL of your environment. This is done with the `trustHost` option.

  ```typescript
  // src/auth.ts
  
  export const {
    // ...
  } = NextAuth({
    // ... adapter, providers, session, cookies
    trustHost: true,
    pages: {
      signIn: '/login',
    },
    debug: process.env.NODE_ENV === "development",
  });
  ```

  **Step 3: Ensure `SessionProvider` is Wrapping the App**
  Your entire application must be wrapped in a `SessionProvider` to make the authentication context (and the CSRF token) available to all client components. This is done by creating a client component wrapper and using it in the root layout.

  ```tsx
  // src/components/AuthProvider.tsx
  "use client";
  import { SessionProvider } from "next-auth/react";
  import React from "react";

  export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
  }
  ```

  ```tsx
  // src/app/layout.tsx
  import { AuthProvider } from '@/components/AuthProvider';
  // ...
  export default async function RootLayout({ children }) {
    return (
      <html lang="en">
        <body>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
          <Toaster />
        </body>
      </html>
    );
  }
  ```
  
These configuration changes work together to make NextAuth.js fully functional within the security constraints of a proxied, iframe-based cloud development environment.

    