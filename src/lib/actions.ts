
'use server';

import { revalidatePath } from 'next/cache';
import prisma from './prisma';
import { type Counterparty, type Product, type Payment, type SalesOrder, type PurchaseOrder, type Wallet, type Invoice } from '@prisma/client';
import { jsonToCsv } from '@/ai/flows/export-flow';

type ServerActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

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
    // Manually convert the types string to an array for the client
    return counterparties.map(c => ({...c, types: c.types.split(',') as ('CLIENT'|'VENDOR')[]}));
  } catch (error) {
    console.error('Error fetching counterparties:', error);
    return [];
  }
}

type CounterpartyInput = Omit<Counterparty, 'id' | 'createdAt' | 'updatedAt' | 'types'> & {
    types: ('CLIENT' | 'VENDOR')[];
};

export async function createCounterparty(data: CounterpartyInput): Promise<ServerActionResult<Counterparty>> {
  try {
    const newCounterpartyData = await prisma.counterparty.create({
      data: {
        ...data,
        types: data.types.join(','), // Join array into a comma-separated string
      },
    });
    // Convert the string back to an array for the return value
    const newCounterparty = {
        ...newCounterpartyData,
        types: newCounterpartyData.types.split(',') as ('CLIENT'|'VENDOR')[],
    };
    revalidatePath('/clients');
    return { success: true, data: newCounterparty };
  } catch (error) {
    console.error('Error creating counterparty:', error);
    return { success: false, error: 'Failed to create counterparty.' };
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

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServerActionResult<Product>> {
  try {
    const newProduct = await prisma.product.create({
      data,
    });
    revalidatePath('/inventory');
    return { success: true, data: newProduct };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'Failed to create product.' };
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

    // Manually adjust counterparty types from string to array
    return payments.map(p => ({
        ...p,
        counterparty: {
            ...p.counterparty,
            types: p.counterparty.types.split(',') as ('CLIENT'|'VENDOR')[]
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
                types: o.counterparty.types.split(',') as ('CLIENT'|'VENDOR')[]
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
            const tax = subtotal * 0.10; // 10% tax
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
                types: o.counterparty.types.split(',') as ('CLIENT'|'VENDOR')[]
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
            const tax = subtotal * 0.10; // 10% tax
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
                types: i.counterparty.types.split(',') as ('CLIENT'|'VENDOR')[]
            }
        }));
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
}

export async function getInvoiceById(id: string): Promise<(Invoice & { salesOrder: SalesOrder & { items: (SalesOrderItem & { product: Product })[] }, counterparty: Counterparty }) | null> {
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
                types: invoice.counterparty.types.split(',') as ('CLIENT'|'VENDOR')[]
            }
        };

    } catch (error) {
        console.error(`Error fetching invoice ${id}:`, error);
        return null;
    }
}

// Export Actions
export async function exportProductsToCsv(): Promise<ServerActionResult<string>> {
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        sku: true,
        category: true,
        price: true,
        stock: true,
      },
    });

    if (products.length === 0) {
      return { success: false, error: "No products to export." };
    }

    const csv = await jsonToCsv({ data: products });
    return { success: true, data: csv };
  } catch (error) {
    console.error('Error exporting products:', error);
    return { success: false, error: 'Failed to export products to CSV.' };
  }
}

export async function exportCounterpartiesToCsv(): Promise<ServerActionResult<string>> {
  try {
    const counterparties = await prisma.counterparty.findMany({
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        types: true,
      },
    });

    if (counterparties.length === 0) {
      return { success: false, error: "No counterparties to export." };
    }
    // The AI flow expects a simple array of objects. We need to format the `types` string.
    const dataForCsv = counterparties.map(c => ({...c, types: c.types.replace(',', ', ')}));
    const csv = await jsonToCsv({ data: dataForCsv });
    return { success: true, data: csv };
  } catch (error) {
    console.error('Error exporting counterparties:', error);
    return { success: false, error: 'Failed to export counterparties to CSV.' };
  }
}

export async function exportSalesOrdersToCsv(): Promise<ServerActionResult<string>> {
  try {
    const orders = await prisma.salesOrder.findMany({
        include: { counterparty: true },
        orderBy: { orderDate: 'desc' },
    });

    if (orders.length === 0) {
      return { success: false, error: "No sales orders to export." };
    }
    
    const dataForCsv = orders.map(o => ({
        orderNumber: o.orderNumber,
        clientName: o.counterparty.name,
        orderDate: o.orderDate.toLocaleDateString(),
        status: o.status,
        subtotal: o.subtotal,
        tax: o.tax,
        total: o.total,
    }));

    const csv = await jsonToCsv({ data: dataForCsv });
    return { success: true, data: csv };
  } catch (error) {
    console.error('Error exporting sales orders:', error);
    return { success: false, error: 'Failed to export sales orders to CSV.' };
  }
}

export async function exportPurchaseOrdersToCsv(): Promise<ServerActionResult<string>> {
  try {
    const orders = await prisma.purchaseOrder.findMany({
        include: { counterparty: true },
        orderBy: { orderDate: 'desc' },
    });

    if (orders.length === 0) {
      return { success: false, error: "No purchase orders to export." };
    }
    
    const dataForCsv = orders.map(o => ({
        orderNumber: o.orderNumber,
        vendorName: o.counterparty.name,
        orderDate: o.orderDate.toLocaleDateString(),
        status: o.status,
        subtotal: o.subtotal,
        tax: o.tax,
        total: o.total,
    }));

    const csv = await jsonToCsv({ data: dataForCsv });
    return { success: true, data: csv };
  } catch (error) {
    console.error('Error exporting purchase orders:', error);
    return { success: false, error: 'Failed to export purchase orders to CSV.' };
  }
}
