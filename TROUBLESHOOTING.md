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
