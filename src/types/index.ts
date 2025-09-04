
import { z } from 'zod';
import { type Payment as PrismaPayment, type Counterparty as PrismaCounterparty, type Product as PrismaProduct, type SalesOrder as PrismaSalesOrder, type Invoice as PrismaInvoice, type SalesOrderItem as PrismaSalesOrderItem } from "@prisma/client";

export type Product = PrismaProduct;
export type SalesOrder = PrismaSalesOrder;
export type Invoice = PrismaInvoice;
export type SalesOrderItem = PrismaSalesOrderItem;


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


// Schema for CSV import flow
const FieldDefinitionSchema = z.object({
  type: z.enum(['string', 'number', 'boolean']).describe('The data type of the field.'),
  description: z.string().describe('A description of what the field represents.'),
  optional: z.boolean().optional().describe('Whether the field is optional.'),
});
export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;

export const CsvToJsonInputSchema = z.object({
  csv: z.string().describe('The full CSV content as a single string.'),
  fields: z.record(FieldDefinitionSchema).describe('An object where keys are the desired JSON field names and values are their definitions.'),
});
export type CsvToJsonInput = z.infer<typeof CsvToJsonInputSchema>;
