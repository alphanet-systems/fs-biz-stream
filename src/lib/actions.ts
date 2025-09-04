
'use server';

import { revalidatePath } from 'next/cache';
import prisma from './prisma';
import { type Counterparty as PrismaCounterparty, type Product, type Payment, type SalesOrder, type PurchaseOrder, type Wallet, type Invoice, type User, type CalendarEvent } from '@prisma/client';
import { jsonToCsv } from '@/ai/flows/export-flow';
import { csvToJson } from '@/ai/flows/csv-to-json-flow';
import { auth } from '@/auth';

type ServerActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Custom Counterparty type for the application to handle the string-to-array conversion
export type Counterparty = Omit<PrismaCounterparty, 'types'> & {
  types: string[];
};

// Setup Actions
export async function saveCompanyDetails(data: { companyName: string }): Promise<ServerActionResult<User>> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    try {
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { companyName: data.companyName },
        });
        return { success: true, data: updatedUser };
    } catch (error) {
        console.error("Error saving company details:", error);
        return { success: false, error: "Failed to save company details." };
    }
}

export async function createInitialWallets(): Promise<ServerActionResult<{ count: number }>> {
    try {
        const result = await prisma.wallet.createMany({
            data: [
                { name: "Main Bank Account", balance: 5000.00 },
                { name: "Cash Drawer", balance: 100.00 },
            ],
            skipDuplicates: true,
        });
        revalidatePath('/payments');
        revalidatePath('/setup');
        return { success: true, data: { count: result.count } };
    } catch (error) {
        console.error("Error creating initial wallets:", error);
        return { success: false, error: "Failed to create initial wallets." };
    }
}

// Counterparty Actions
export async function getCounterparties(type?: 'CLIENT' | 'VENDOR'): Promise<Counterparty[]> {
  try {
    const counterparties = await prisma.counterparty.findMany({
      where: type ? {
        types: {
          contains: type
        }
      } : {},
      orderBy: {
        createdAt: 'desc',
      },
    });
    return counterparties.map(c => ({
      ...c,
      types: c.types.split(',').filter(t => t)
    }));
  } catch (error) {
    console.error('Error fetching counterparties:', error);
    return [];
  }
}

type CounterpartyInput = {
    id?: string; // Optional for updates
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    types: string[];
}

export async function createCounterparty(data: Omit<CounterpartyInput, 'id'>): Promise<ServerActionResult<Counterparty>> {
  try {
    const newCounterparty = await prisma.counterparty.create({ 
      data: {
        ...data,
        types: data.types.join(','),
      } 
    });
    revalidatePath('/clients');
    revalidatePath('/setup');
    return { success: true, data: { ...newCounterparty, types: newCounterparty.types.split(',').filter(t => t) }};
  } catch (error) {
    console.error('Error creating counterparty:', error);
    if ((error as any).code === 'P2002') {
        return { success: false, error: 'A counterparty with this email already exists.' };
    }
    return { success: false, error: 'Failed to create counterparty.' };
  }
}

export async function updateCounterparty(data: CounterpartyInput): Promise<ServerActionResult<Counterparty>> {
  if (!data.id) {
    return { success: false, error: 'Counterparty ID is required for updates.' };
  }
  try {
    const updatedCounterparty = await prisma.counterparty.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        types: data.types.join(','),
      },
    });
    revalidatePath('/clients');
    return { success: true, data: { ...updatedCounterparty, types: updatedCounterparty.types.split(',').filter(t => t) } };
  } catch (error) {
    console.error('Error updating counterparty:', error);
     if ((error as any).code === 'P2002') {
        return { success: false, error: 'A counterparty with this email already exists.' };
    }
    return { success: false, error: 'Failed to update counterparty.' };
  }
}

export async function deleteCounterparty(id: string): Promise<ServerActionResult<{ id: string }>> {
  try {
    // Check if the counterparty is associated with any orders
    const salesOrders = await prisma.salesOrder.count({ where: { counterpartyId: id } });
    const purchaseOrders = await prisma.purchaseOrder.count({ where: { counterpartyId: id } });

    if (salesOrders > 0 || purchaseOrders > 0) {
      return { success: false, error: 'Cannot delete counterparty with existing sales or purchase orders.' };
    }
    
    await prisma.counterparty.delete({
      where: { id },
    });
    revalidatePath('/clients');
    return { success: true, data: { id } };
  } catch (error) {
    console.error('Error deleting counterparty:', error);
    return { success: false, error: 'Failed to delete counterparty.' };
  }
}


// Product Actions
export async function getProducts(): Promise<Product[]> {
  try {
    return await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

type ProductInput = {
    id?: string;
    name: string;
    sku: string;
    stock: number;
    price: number;
    category: string | null;
    imageUrl?: string | null;
}

export async function createProduct(data: Omit<ProductInput, 'id'>): Promise<ServerActionResult<Product>> {
  try {
    const newProduct = await prisma.product.create({
      data: {
        ...data,
        imageUrl: data.imageUrl ?? null
      },
    });
    revalidatePath('/inventory');
    revalidatePath('/setup');
    return { success: true, data: newProduct };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'Failed to create product.' };
  }
}

export async function updateProduct(data: ProductInput): Promise<ServerActionResult<Product>> {
    if (!data.id) {
        return { success: false, error: 'Product ID is required for updates.' };
    }
    try {
        const updatedProduct = await prisma.product.update({
            where: { id: data.id },
            data: {
                name: data.name,
                sku: data.sku,
                stock: data.stock,
                price: data.price,
                category: data.category,
                imageUrl: data.imageUrl ?? null,
            },
        });
        revalidatePath('/inventory');
        return { success: true, data: updatedProduct };
    } catch (error) {
        console.error('Error updating product:', error);
        return { success: false, error: 'Failed to update product.' };
    }
}

export async function deleteProduct(id: string): Promise<ServerActionResult<{ id: string }>> {
    try {
        const salesOrderItems = await prisma.salesOrderItem.count({ where: { productId: id } });
        const purchaseOrderItems = await prisma.purchaseOrderItem.count({ where: { productId: id } });

        if (salesOrderItems > 0 || purchaseOrderItems > 0) {
            return { success: false, error: 'Cannot delete product that is part of an existing sales or purchase order.' };
        }
        
        await prisma.product.delete({
            where: { id },
        });
        revalidatePath('/inventory');
        return { success: true, data: { id } };
    } catch (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: 'Failed to delete product.' };
    }
}

// Wallet Actions
export async function getWallets(): Promise<Wallet[]> {
    try {
        return await prisma.wallet.findMany({
            orderBy: {
                createdAt: 'asc',
            },
        });
    } catch (error) {
        console.error('Error fetching wallets:', error);
        return [];
    }
}

export async function createWallet(data: { name: string, balance: number }): Promise<ServerActionResult<Wallet>> {
    try {
        const newWallet = await prisma.wallet.create({
            data,
        });
        revalidatePath('/payments');
        return { success: true, data: newWallet };
    } catch (error) {
        console.error('Error creating wallet:', error);
        return { success: false, error: 'Failed to create wallet.' };
    }
}


// Payment Actions
export async function getPayments(): Promise<(Payment & { counterparty: Counterparty, wallet: Wallet })[]> {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        counterparty: true,
        wallet: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
    return payments.map(p => ({
        ...p,
        counterparty: {
            ...p.counterparty,
            types: p.counterparty.types.split(',').filter(t => t),
        }
    }));
  } catch (error)
 {
    console.error('Error fetching payments:', error);
    return [];
  }
}

type PaymentInput = {
    amount: number;
    type: string;
    status: string;
    description: string;
    counterpartyId: string;
    walletId: string;
};

export async function createPayment(data: PaymentInput): Promise<ServerActionResult<Payment>> {
    try {
        const newPayment = await prisma.$transaction(async (tx) => {
            // 1. Create the payment record
            const payment = await tx.payment.create({
                data: {
                    ...data,
                    date: new Date(),
                },
            });

            // 2. Update the wallet balance
            await tx.wallet.update({
                where: { id: data.walletId },
                data: {
                    balance: {
                        increment: data.amount, // amount is positive for income, negative for expenses
                    },
                },
            });

            return payment;
        });
        
        revalidatePath('/payments');
        return { success: true, data: newPayment };
    } catch (error) {
        console.error('Error creating payment:', error);
        return { success: false, error: 'Failed to create payment.' };
    }
}

// Sales Order Actions
export async function getSalesOrders(): Promise<(SalesOrder & { counterparty: Counterparty })[]> {
    try {
        const orders = await prisma.salesOrder.findMany({
            include: {
                counterparty: true,
            },
            orderBy: {
                orderDate: 'desc',
            },
        });
        return orders.map(o => ({
            ...o,
            counterparty: {
                ...o.counterparty,
                types: o.counterparty.types.split(',').filter(t => t),
            }
        }));
    } catch (error) {
        console.error('Error fetching sales orders:', error);
        return [];
    }
}

type SalesOrderInput = {
    counterpartyId: string;
    orderDate: Date;
    generateInvoice: boolean;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
    }[];
};

export async function createSalesOrder(input: SalesOrderInput): Promise<ServerActionResult<SalesOrder>> {
    try {
        // Use a transaction to ensure all operations succeed or none do.
        const newSalesOrder = await prisma.$transaction(async (tx) => {
            // 1. Calculate totals
            const subtotal = input.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
            const tax = subtotal * 0.20; // 20% VAT
            const total = subtotal + tax;

            // 2. Create the SalesOrder
            const order = await tx.salesOrder.create({
                data: {
                    counterpartyId: input.counterpartyId,
                    orderDate: input.orderDate,
                    orderNumber: `SO-${Date.now().toString().slice(-6)}`,
                    status: 'Pending',
                    generateInvoice: input.generateInvoice,
                    subtotal,
                    tax,
                    total,
                    items: {
                        create: input.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
            });

            // 3. Decrement stock for each product
            for (const item of input.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            // 4. If requested, create an invoice
            if (order.generateInvoice) {
                const issueDate = new Date();
                const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Due in 30 days
                await tx.invoice.create({
                    data: {
                        invoiceNumber: `INV-${order.orderNumber}`,
                        issueDate,
                        dueDate,
                        status: 'Draft',
                        total: order.total,
                        salesOrderId: order.id,
                        counterpartyId: order.counterpartyId
                    }
                });
            }

            return order;
        });

        revalidatePath('/sales');
        revalidatePath('/invoices');
        revalidatePath('/inventory'); // Revalidate inventory to show new stock levels
        revalidatePath('/pos'); // Revalidate POS to show new stock levels
        return { success: true, data: newSalesOrder };
    } catch (error) {
        console.error('Error creating sales order:', error);
        return { success: false, error: 'Failed to create sales order.' };
    }
}

export async function fulfillSalesOrder(orderId: string): Promise<ServerActionResult<SalesOrder>> {
    try {
        const updatedOrder = await prisma.$transaction(async (tx) => {
            // 1. Find the sales order
            const order = await tx.salesOrder.findUnique({
                where: { id: orderId },
            });

            if (!order || order.status !== 'Pending') {
                throw new Error('Order not found or not in a fulfillable state.');
            }

            // 2. Find the default bank wallet to receive the income
            const bankWallet = await tx.wallet.findFirst({
                where: { name: 'Main Bank Account' },
            });
            if (!bankWallet) {
                throw new Error('Main Bank Account wallet not found. Cannot record income.');
            }

            // 3. Create the income payment record
            await tx.payment.create({
                data: {
                    amount: order.total, // Positive for income
                    type: 'Sale',
                    status: 'Received',
                    description: `Payment for Sales Order ${order.orderNumber}`,
                    date: new Date(),
                    counterpartyId: order.counterpartyId,
                    walletId: bankWallet.id,
                },
            });

            // 4. Update the sales order status
            const fulfilledOrder = await tx.salesOrder.update({
                where: { id: orderId },
                data: { status: 'Fulfilled' },
            });

            return fulfilledOrder;
        });

        revalidatePath('/sales');
        revalidatePath('/payments');
        return { success: true, data: updatedOrder };
    } catch (error) {
        console.error('Failed to fulfill sales order:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: errorMessage };
    }
}


// Purchase Order Actions
export async function getPurchaseOrders(): Promise<(PurchaseOrder & { counterparty: Counterparty })[]> {
    try {
        const orders = await prisma.purchaseOrder.findMany({
            include: {
                counterparty: true,
            },
            orderBy: {
                orderDate: 'desc',
            },
        });
        return orders.map(o => ({
            ...o,
            counterparty: {
                ...o.counterparty,
                types: o.counterparty.types.split(',').filter(t => t),
            }
        }));
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        return [];
    }
}

type PurchaseOrderInput = {
    counterpartyId: string;
    orderDate: Date;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
    }[];
};

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<ServerActionResult<PurchaseOrder>> {
     try {
        const newPurchaseOrder = await prisma.$transaction(async (tx) => {
            const subtotal = input.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
            const tax = subtotal * 0.20; // 20% VAT
            const total = subtotal + tax;

            const order = await tx.purchaseOrder.create({
                data: {
                    counterpartyId: input.counterpartyId,
                    orderDate: input.orderDate,
                    orderNumber: `PO-${Date.now().toString().slice(-6)}`,
                    status: 'Pending',
                    subtotal,
                    tax,
                    total,
                    items: {
                        create: input.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
            });

            // For now, we assume stock is increased on fulfillment, not on order creation.
            // A separate action `fulfillPurchaseOrder` would handle this.

            return order;
        });

        revalidatePath('/purchases');
        return { success: true, data: newPurchaseOrder };
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return { success: false, error: 'Failed to create purchase order.' };
    }
}

export async function markPurchaseOrderAsReceived(orderId: string): Promise<ServerActionResult<PurchaseOrder>> {
    try {
        const updatedOrder = await prisma.$transaction(async (tx) => {
            // 1. Find the purchase order and its items
            const order = await tx.purchaseOrder.findUnique({
                where: { id: orderId },
                include: { items: true },
            });

            if (!order || order.status !== 'Pending') {
                throw new Error('Order not found or not in a receivable state.');
            }

            // 2. Update product stock levels
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }

            // 3. Find the default bank wallet to create the expense
            const bankWallet = await tx.wallet.findFirst({
                where: { name: 'Main Bank Account' },
            });
            if (!bankWallet) {
                throw new Error('Main Bank Account wallet not found. Cannot record expense.');
            }

            // 4. Create the expense payment record
            await tx.payment.create({
                data: {
                    amount: -order.total, // Negative for an expense
                    type: 'Purchase',
                    status: 'Sent',
                    description: `Payment for Purchase Order ${order.orderNumber}`,
                    date: new Date(),
                    counterpartyId: order.counterpartyId,
                    walletId: bankWallet.id,
                },
            });

            // 5. Update the purchase order status
            const receivedOrder = await tx.purchaseOrder.update({
                where: { id: orderId },
                data: { status: 'Received' },
            });

            return receivedOrder;
        });

        revalidatePath('/purchases');
        revalidatePath('/inventory');
        revalidatePath('/payments');
        return { success: true, data: updatedOrder };
    } catch (error) {
        console.error('Failed to mark purchase order as received:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: errorMessage };
    }
}


// Invoice Actions
export async function getInvoices(): Promise<(Invoice & { counterparty: Counterparty })[]> {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                counterparty: true,
            },
orderBy: {
                issueDate: 'desc',
            },
        });
        return invoices.map(i => ({
            ...i,
            counterparty: {
                ...i.counterparty,
                types: i.counterparty.types.split(',').filter(t => t),
            }
        }));
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
}

export async function getInvoiceById(id: string) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                counterparty: true,
                salesOrder: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });
        if (!invoice) return null;

        return {
            ...invoice,
            counterparty: {
                ...invoice.counterparty,
                types: invoice.counterparty.types.split(',').filter(t => t),
            }
        };

    } catch (error) {
        console.error(`Error fetching invoice ${id}:`, error);
        return null;
    }
}

// Calendar Event Actions
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
    try {
        return await prisma.calendarEvent.findMany({
            orderBy: {
                start: 'asc',
            },
        });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
    }
}

type EventInput = {
    title: string;
    description: string | null;
    start: Date;
    end: Date;
    allDay: boolean;
    counterpartyId?: string | null;
}

export async function createCalendarEvent(data: EventInput): Promise<ServerActionResult<CalendarEvent>> {
    try {
        const newEvent = await prisma.calendarEvent.create({
            data,
        });
        revalidatePath('/calendar');
        return { success: true, data: newEvent };
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return { success: false, error: 'Failed to create event.' };
    }
}

export async function deleteCalendarEvent(id: string): Promise<ServerActionResult<{ id: string }>> {
    try {
        await prisma.calendarEvent.delete({ where: { id } });
        revalidatePath('/calendar');
        return { success: true, data: { id } };
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        return { success: false, error: 'Failed to delete event.' };
    }
}

// Export Actions
export async function exportToCsv(dataType: 'products' | 'counterparties' | 'sales-orders' | 'purchase-orders'): Promise<ServerActionResult<string>> {
  try {
    let data: any[] = [];
    
    switch (dataType) {
        case 'products':
            data = await prisma.product.findMany({ select: { name: true, sku: true, category: true, price: true, stock: true } });
            break;
        case 'counterparties':
            const counterparties = await prisma.counterparty.findMany({ select: { name: true, email: true, phone: true, address: true, types: true } });
            data = counterparties.map(c => ({ ...c, types: c.types })); // Keep as comma-separated string for export
            break;
        case 'sales-orders':
            const salesOrders = await prisma.salesOrder.findMany({ include: { counterparty: true }, orderBy: { orderDate: 'desc' } });
            data = salesOrders.map(o => ({ orderNumber: o.orderNumber, clientName: o.counterparty.name, orderDate: o.orderDate.toLocaleDateString(), status: o.status, subtotal: o.subtotal, tax: o.tax, total: o.total }));
            break;
        case 'purchase-orders':
            const purchaseOrders = await prisma.purchaseOrder.findMany({ include: { counterparty: true }, orderBy: { orderDate: 'desc' } });
            data = purchaseOrders.map(o => ({ orderNumber: o.orderNumber, vendorName: o.counterparty.name, orderDate: o.orderDate.toLocaleDateString(), status: o.status, subtotal: o.subtotal, tax: o.tax, total: o.total }));
            break;
    }

    if (data.length === 0) {
      return { success: false, error: `No ${dataType.replace('-', ' ')} to export.` };
    }

    const csv = await jsonToCsv({ data });
    return { success: true, data: csv };
  } catch (error) {
    console.error(`Error exporting ${dataType}:`, error);
    return { success: false, error: `Failed to export ${dataType} to CSV.` };
  }
}

// Import Actions
export async function importProductsFromCsv(csvString: string): Promise<ServerActionResult<{ count: number }>> {
  try {
    const jsonResult = await csvToJson({
      csv: csvString,
      fields: {
        name: { type: 'string', description: 'The name of the product.' },
        sku: { type: 'string', description: 'The Stock Keeping Unit.' },
        category: { type: 'string', description: 'The product category.', optional: true },
        price: { type: 'number', description: 'The price of the product.' },
        stock: { type: 'number', description: 'The available stock quantity.' },
      },
    });

    if (!jsonResult || !Array.isArray(jsonResult)) {
        return { success: false, error: 'AI parsing failed to return a valid array.' };
    }

    const productsToCreate = jsonResult.map((p: any) => ({
      name: p.name,
      sku: p.sku,
      category: p.category || null,
      price: typeof p.price === 'number' ? p.price : parseFloat(p.price || '0'),
      stock: typeof p.stock === 'number' ? p.stock : parseInt(p.stock || '0', 10),
      imageUrl: 'https://placehold.co/100x100.png', // Default image
    }));
    
    const result = await prisma.product.createMany({
      data: productsToCreate,
      skipDuplicates: true, // Skip if a product with the same SKU already exists
    });

    revalidatePath('/inventory');
    revalidatePath('/setup');
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error('Error importing products:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during import.';
    return { success: false, error: `Failed to import products. ${errorMessage}` };
  }
}

export async function importCounterpartiesFromCsv(csvString: string): Promise<ServerActionResult<{ count: number }>> {
  try {
    const jsonResult = await csvToJson({
        csv: csvString,
        fields: {
            name: { type: 'string', description: 'The name of the person or company.' },
            email: { type: 'string', description: 'The email address.' },
            phone: { type: 'string', description: 'The phone number.', optional: true },
            address: { type: 'string', description: 'The physical address.', optional: true },
            types: { type: 'string', description: "A comma-separated list of types, e.g., 'CLIENT,VENDOR' or 'CLIENT'." },
        },
    });

    if (!jsonResult || !Array.isArray(jsonResult)) {
        return { success: false, error: 'AI parsing failed to return a valid array.' };
    }
    
    const counterpartiesToCreate = jsonResult.map((c: any) => ({
        name: c.name,
        email: c.email,
        phone: c.phone || null,
        address: c.address || null,
        types: c.types.toUpperCase().split(',').map((s:string) => s.trim()).filter((t:string) => t === 'CLIENT' || t === 'VENDOR').join(','),
    }));

    const result = await prisma.counterparty.createMany({
        data: counterpartiesToCreate,
        skipDuplicates: true, // Skip if a counterparty with the same email already exists
    });

    revalidatePath('/clients');
    revalidatePath('/setup');
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error('Error importing counterparties:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during import.';
    return { success: false, error: `Failed to import counterparties. ${errorMessage}` };
  }
}

    