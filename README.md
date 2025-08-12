# BizStream - Small Business ERP

This is a Next.js application built in Firebase Studio, designed as an all-in-one ERP (Enterprise Resource Planning) solution for small businesses. It provides a suite of tools to manage core business operations from a single, modern web interface.

## Key Features

- **Dashboard**: Get an at-a-glance overview of your business with key metrics like revenue, expenses, and recent sales.
- **Sales Management**: Create and manage sales orders. This module is integrated with the inventory to check stock levels in real-time.
- **Client Management**: Keep a record of all your clients, manage their contact information, and view their history.
- **Inventory Tracking**: Manage your products, track stock levels, and view product details.
- **Point of Sale (POS)**: A simple and intuitive interface for processing in-person sales.
- **Calendar**: Schedule appointments, meetings, and other important events.
- **Payments**: Track incoming and outgoing payments to manage your cash flow effectively.

## Tech Stack

The application is built with a **"Next.js Full Stack"** architecture, prioritizing simplicity, developer experience, and deployment flexibility.

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend API**: [Next.js API Routes & Server Actions](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Production) / [SQLite](https://www.sqlite.org/index.html) (Development)
- **Data Access**: [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js (Auth.js)](https://authjs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit)

## Getting Started

To get started with development, run the following command to start the local server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.
