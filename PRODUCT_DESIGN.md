# BizStream v1 - Product Design Document

This document outlines the product requirements, target audience, and core features for the first official version of the BizStream application. This moves beyond the initial MVP phase into a structured product plan.

## 1. Target Audience

The primary user for BizStream is the **micro-enterprise**. As defined by the EU, this includes:
- Solo entrepreneurs and freelancers (service-based businesses).
- Small retail shops with physical inventory (product-based businesses).

This user group is currently underserved, caught between overly simple invoicing apps and overly complex, slow, and expensive ERP systems. Our goal is to provide a fast, intuitive, and affordable solution that covers the 10% of features they use 90% of the time.

## 2. Core Problem & Value Proposition

BizStream solves the core operational challenge for micro-enterprises: **the lack of a single, simple tool to manage the interconnected flow of purchases, inventory, sales, and money.**

Our unique value is in providing a lightweight, integrated system that other tools don't offer. We are not just an invoicing app; we are a streamlined inventory and financial management tool designed for speed and clarity.

## 3. Core Modules & Workflow

The application will be built around four interconnected modules that automate key business processes.

### a. Counterparties
- **Concept:** The `Clients` and `Vendors` entities will be merged into a single, more flexible `Counterparties` module.
- **Implementation:** Each counterparty will have a `type` field, which can be designated as "Client," "Vendor," or both. This avoids data duplication and simplifies relationship management.

### b. Purchases
- **Concept:** A new module to track incoming goods and associate expenses.
- **Workflow:**
    1. A **Purchase Order** is created for a "Vendor" (a type of Counterparty).
    2. When the order is marked as "Received," the system will **automatically increase the stock levels** for the corresponding products in the Inventory module.
    3. Simultaneously, an **expense transaction is automatically created** in the Payments module.

### c. Sales
- **Concept:** To track outgoing goods and services.
- **Workflow:**
    1. A **Sales Order** is created for a "Client" (a type of Counterparty).
    2. When the order is marked as "Fulfilled," the system will **automatically decrease the stock levels** for the corresponding products in the Inventory module.
    3. An **income transaction is automatically created** in the Payments module.

### d. Payments & Wallets
- **Concept:** To track the movement of money with real-world context.
- **Wallet System:** Users can create and manage multiple "Wallets" (e.g., "POS Cash Drawer," "Main Bank Account," "PayPal"). This answers the question "Where is my money?"
- **Transfers:** Users must be able to record transfers of funds between their wallets.
- **Payment Logic:**
    - Standard **Point of Sale** transactions are cash-based and are directed to a "Default Cash Wallet."
    - **Invoiced sales** unlock more specific payment tracking, allowing users to direct payments (cash, bank, card) to the appropriate wallet.

## 4. Foundational Features & Requirements

### a. User and Role Management (RBAC)
- **Requirement:** The system must support multiple users with different levels of permissions.
- **v1 Implementation:** A simple Role-Based Access Control system with at least two roles:
    - **Admin:** Full access to all modules, settings, and financial data.
    - **User:** Can create sales and manage inventory, but cannot access company settings or sensitive financial reports.

### b. Data Portability (Import/Export)
- **Requirement:** Users must be able to easily get their data out of the system. This is critical for data ownership and user trust.
- **v1 Implementation:**
    - **CSV Export:** Implement a "Export to CSV" feature for all core modules (`Counterparties`, `Products`, `Sales Orders`, and `Purchase Orders`). The system will generate and download a clean CSV file of the requested data.
    - **Future Considerations:** A CSV import feature and full database backups are planned for future versions to facilitate easy data migration into BizStream.

### c. First-Time Setup & Configuration
- **Requirement:** The application must have a clean initial state and guide new users through configuration.
- **v1 Implementation:** A one-time **Setup Wizard** will launch for the first Admin user to:
    - Enter company details (Name, Address, VAT number, etc.).
    - Configure initial "Wallets".
    - Set the starting numbers and prefixes for documents like invoices and sales orders (e.g., `INV-2024-101`).

### d. PDF Invoice Templating
- **Requirement:** Users must be able to generate and save invoices as PDFs to meet legal and business requirements.
- **v1 Implementation:** BizStream will provide a set of clean, professional, pre-designed invoice templates for users to choose from. Customization (e.g., adding a logo) will be a consideration for a future version.

### e. Internationalization (i18n)
- **Requirement:** The application must be built to support multiple languages.
- **v1 Implementation:** The architecture will be internationalized from the ground up, with all user-facing strings managed in resource files.
- **Initial Languages:** The initial launch will support **English** and **Bulgarian**.

## 5. Technical Principles

### a. Transactional Integrity
- **Requirement:** All operations involving money and inventory must be transactional. If one part of an operation fails, the entire operation must be rolled back to prevent data inconsistency.
- **Implementation:** This will be enforced at the database layer using database transactions for all multi-step operations (e.g., Fulfill Sale, Receive Purchase).

### b. Open-Source & Self-Hostable
- **Requirement:** The entire stack must be based on open-source technologies, be free from severe usage limitations in its free tier, and be deployable to an on-premise server. This ensures long-term viability, control, and cost-effectiveness.

---

## 6. Technical Architecture Scenarios

This section outlines three potential technology stacks for the backend. The goal is to choose the path that best balances development speed with our core principles of control, reliability, and open-source philosophy. All three scenarios assume the use of **Next.js** for the frontend and **Prisma ORM** for data access, allowing a seamless transition from local **SQLite** development to production **PostgreSQL**.

### **Scenario A: The "Modular Control" Stack**

This approach uses a set of best-in-class, independent, open-source tools that we integrate ourselves. It prioritizes control and leanness over an all-in-one solution.

- **Database:** **PostgreSQL.** The industry standard for reliable, open-source relational databases.
- **API Layer:** **PostgREST.** A standalone web server that turns our PostgreSQL database directly into a secure, RESTful API. It's extremely lightweight and fast.
- **Authentication/RBAC:** **Lucia Auth.** An open-source, framework-agnostic authentication library that gives us full control to build our own user management and role-based access control system within Next.js.
- **File Storage:** **MinIO.** An open-source, S3-compatible object storage server we can self-host for CSV uploads, logos, and backups.
- **How it Works:** The Next.js app, using Lucia Auth, handles user login and generates a secure JSON Web Token (JWT). For all subsequent data requests, our frontend sends this JWT to the PostgREST server. PostgREST validates the token and uses the `role` claim inside it to switch to a corresponding database role for that specific transaction. **Authorization is then handled by PostgreSQL itself** using its powerful Row-Level Security (RLS) features. This means our permission logic (e.g., "users can only see their own invoices") is written in SQL and lives directly in the database, providing a highly secure and centralized architecture.

*   **Pros:**
    *   **Maximum Control & No Bloat:** We only include the exact functionality we need.
    *   **Un-opinionated:** We are not tied to any single platform's way of doing things.
    *   **Component Swapping:** Each part (auth, storage) is independent and can be replaced in the future if needed.
    *   **Centralized Security:** Authorization logic is consolidated in the database layer, which is considered a security best practice.
*   **Cons:**
    *   **Highest Initial Integration Effort:** We are responsible for connecting these different services and ensuring they work together seamlessly.
    *   **Requires SQL for Authorization:** Writing and managing RLS policies requires comfort with SQL.

### **Scenario B: The "Integrated BaaS" Stack**

This approach uses a single, open-source Backend-as-a-Service (BaaS) platform that provides multiple services in one package. This prioritizes development speed.

- **Core Platform:** **Appwrite.** An open-source platform that bundles a database, authentication, file storage, and server-side functions into a single product.
- **Database:** Appwrite can be configured to use a PostgreSQL-compatible database.
- **API Layer:** Provided automatically by Appwrite.
- **Authentication/RBAC:** Handled by Appwrite's built-in user management system.
- **File Storage:** Handled by Appwrite's built-in storage buckets.

*   **Pros:**
    *   **Fastest Development Speed:** Most of the backend boilerplate is pre-built, letting us focus on frontend features.
    *   **Simplified Management:** A single platform to deploy and manage.
    *   **Meets Core Principles:** It is open-source and designed for self-hosting.
*   **Cons:**
    *   **Platform Risk:** While open-source, we are still adopting a specific platform's architecture and opinions. We are dependent on its future development and community support.
    *   **Potential for "BaaS Bloat":** We might not need every feature the platform offers.

### **Scenario C: The "Next.js Full Stack"**

This approach leverages the Next.js framework to its maximum potential, minimizing external backend dependencies beyond the database itself.

- **Database:** **PostgreSQL.**
- **API Layer:** **Written entirely in Next.js.** We would use Prisma to connect directly to the database from Next.js API Routes and Server Actions. We would write all business logic for every API endpoint ourselves.
- **Authentication/RBAC:** **NextAuth.js (Auth.js).** The de-facto open-source authentication solution for Next.js. It's highly customizable and has adapters for Prisma, allowing us to build our RBAC system.
- **File Storage:** Handled by a custom API route in Next.js that would write files to a secure, persistent volume on the server.

*   **Pros:**
    *   **Single Codebase & Language:** The entire application, both frontend and backend logic, lives in one Next.js repository using TypeScript. This simplifies the development workflow.
    *   **Excellent Developer Experience:** We stay within the familiar and highly-optimized Next.js ecosystem.
*   **Cons:**
    *   **"Reinventing the Wheel":** We would be manually creating an API for our database, a task that PostgREST (Scenario A) or Appwrite (Scenario B) would largely automate.
    *   **Scattered Authorization Logic:** Permission checks would live within the application code (in various API routes), which can become complex to manage if not handled with care.

---
## 7. Final Architecture Decision

After analyzing all three scenarios against our core principles and deployment requirements (both cloud and on-premise), a final decision has been made.

### Deployment Analysis Summary

-   **Scenario A ("Modular Control"):** Powerful and flexible, and excellent for on-premise deployment using Docker. However, it presents the highest complexity for cloud deployments, requiring the management of at least three separate services (Next.js App, PostgREST Server, Database).

-   **Scenario B ("Integrated BaaS"):** Simple to deploy both on its own cloud and on-premise. However, it introduces a significant platform dependency and the risks of bloat and vendor-specific issues that we aim to avoid.

-   **Scenario C ("Next.js Full Stack"):** Offers the best balance. It is the simplest to deploy to the cloud, as modern platforms are optimized for this two-part architecture (Next.js App + Database). It is also simple to deploy on-premise with Docker, as it involves only two services.

### Conclusion: The Path Forward is Scenario C

We will officially proceed with **Scenario C: The "Next.js Full Stack"**.

This architecture provides the optimal blend of developer experience, deployment simplicity, and control. By consolidating our logic within the Next.js framework and connecting to a standard PostgreSQL database, we minimize complexity while still satisfying our critical requirements for on-premise hosting and data ownership. This path allows us to build a robust, maintainable, and scalable application efficiently.
