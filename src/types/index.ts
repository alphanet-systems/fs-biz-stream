

import { type Payment as PrismaPayment, type Client as PrismaClient, type Product as PrismaProduct, type SalesOrder as PrismaSalesOrder } from "@prisma/client";

export type Client = PrismaClient;
export type Product = PrismaProduct;
export type SalesOrder = PrismaSalesOrder;


export type Payment = Omit<PrismaPayment, 'clientId' | 'date'> & {
  client: Client;
  date: string;
};

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  description?: string;
  client?: Client;
};

export type ChartData = {
  month: string;
  profit: number;
  expenses: number;
};

// Remove this if it's not used
export type User = {
    id: string;
    name: string;
    email: string;
};
