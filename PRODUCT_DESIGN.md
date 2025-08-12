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
- **Requirement:** Users must be able to easily migrate their existing data into BizStream. This is critical for adoption.
- **v1 Implementation:**
    - **CSV Import:** Implement a CSV import feature for `Counterparties` and `Products`. The system will provide a downloadable template file with clear instructions for the required format.
    - **Full Database Backup:** Provide a feature for the Admin to download a full backup of their entire database in an optimal format (e.g., a `.sql` or `.json` file).

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

This document will serve as our guide as we proceed to the next stages of technical design and implementation.
