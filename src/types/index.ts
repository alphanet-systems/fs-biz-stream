
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

export type SalesOrder = {
  id: string;
  orderNumber: string;
  client: Client;
  orderDate: string;
  dueDate?: string;
  items: {
    id: string;
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Pending" | "Fulfilled" | "Cancelled";
  invoiceGenerated: boolean;
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
