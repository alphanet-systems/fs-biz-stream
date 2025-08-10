export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  imageUrl?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  client: Client;
  issueDate: string;
  dueDate: string;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Paid" | "Pending" | "Overdue";
};

export type Payment = {
  id: string;
  date: string;
  client: Client;
  description: string;
  amount: number;
  type: "Cash" | "Bank Transfer";
  status: "Received" | "Sent";
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
