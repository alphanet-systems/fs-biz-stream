
'use server';

import { revalidatePath } from 'next/cache';
import prisma from './prisma';
import { type Client, type Product, type Payment } from '@prisma/client';

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
  } catch (error) {
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
