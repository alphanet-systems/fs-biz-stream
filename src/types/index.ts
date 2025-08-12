
import { z } from 'zod';
import { type Payment as PrismaPayment, type Counterparty as PrismaCounterparty, type Product as PrismaProduct, type SalesOrder as PrismaSalesOrder } from "@prisma/client";

export type Counterparty = PrismaCounterparty;
export type Product = PrismaProduct;
export type SalesOrder = PrismaSalesOrder;


export type Payment = Omit<PrismaPayment, 'date'> & {
  counterparty: Counterparty;
  date: string;
};

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  description?: string;
  counterparty?: Counterparty;
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

// Schema for CSV export flow
export const CsvInputSchema = z.object({
    data: z.array(z.record(z.any())).describe('An array of JSON objects to convert to CSV.'),
});
export type CsvInput = z.infer<typeof CsvInputSchema>;
