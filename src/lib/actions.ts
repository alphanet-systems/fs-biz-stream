
'use server';

import { revalidatePath } from 'next/cache';
import prisma from './prisma';
import { type Counterparty, type Product, type Payment, type SalesOrder, type PurchaseOrder, type Wallet } from '@prisma/client';
import { jsonToCsv } from '@/ai/flows/export-flow';

type ServerActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Counterparty Actions
export async function getCounterparties(type?: 'CLIENT' | 'VENDOR'): Promise<Counterparty[]> {
  try {
    return await prisma.counterparty.findMany({
      where: type ? {
        types: {
          has: type,
        }
      } : {},
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching counterparties:', error);
    return [];
  }
}

export async function createCounterparty(data: Omit<Counterparty, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServerActionResult<Counterparty>> {
  try {
    const newCounterparty = await prisma.counterparty.create({
      data: {
        ...data,
      },
    });
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
    return await prisma.payment.findMany({
      include: {
        counterparty: true,
        wallet: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
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
        return await prisma.salesOrder.findMany({
            include: {
                counterparty: true,
            },
            orderBy: {
                orderDate: 'desc',
            },
        });
    } catch (error) {
        console.error('Error fetching sales orders:', error);
        return [];
    }
}

type SalesOrderInput = {
    counterpartyId: string;
    orderDate: Date;
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

            return order;
        });

        revalidatePath('/sales');
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
        return await prisma.purchaseOrder.findMany({
            include: {
                counterparty: true,
            },
            orderBy: {
                orderDate: 'desc',
            },
        });
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

    