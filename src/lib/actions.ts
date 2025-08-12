
'use server';

import { revalidatePath } from 'next/cache';
import prisma from './prisma';
import { type Client, type Product, type Payment, type SalesOrder, type SalesOrderItem } from '@prisma/client';

type ServerActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Client Actions
export async function getClients(): Promise<Client[]> {
  try {
    return await prisma.client.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
}

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServerActionResult<Client>> {
  try {
    const newClient = await prisma.client.create({
      data: {
        ...data,
      },
    });
    revalidatePath('/clients');
    return { success: true, data: newClient };
  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, error: 'Failed to create client.' };
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

// Payment Actions
export async function getPayments(): Promise<(Payment & { client: Client })[]> {
  try {
    return await prisma.payment.findMany({
      include: {
        client: true,
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

export async function createPayment(data: {
    amount: number;
    type: string;
    status: string;
    description: string;
    clientId: string;
}): Promise<ServerActionResult<Payment>> {
    try {
        const newPayment = await prisma.payment.create({
            data: {
                ...data,
                date: new Date(),
            },
        });
        revalidatePath('/payments');
        return { success: true, data: newPayment };
    } catch (error) {
        console.error('Error creating payment:', error);
        return { success: false, error: 'Failed to create payment.' };
    }
}

// Sales Order Actions
export async function getSalesOrders(): Promise<(SalesOrder & { client: Client })[]> {
    try {
        return await prisma.salesOrder.findMany({
            include: {
                client: true,
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
    clientId: string;
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
                    clientId: input.clientId,
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
        return { success: true, data: newSalesOrder };
    } catch (error) {
        console.error('Error creating sales order:', error);
        return { success: false, error: 'Failed to create sales order.' };
    }
}
