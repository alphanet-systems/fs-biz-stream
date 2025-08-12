
import { type Client, type Product, type SalesOrder, type CalendarEvent, type Payment, type ChartData } from "@/types";
import { type Payment as PrismaPayment } from "@prisma/client";

export const clients: Client[] = [
  { id: "1", name: "Innovate Inc.", email: "contact@innovate.com", phone: "123-456-7890", address: "123 Tech Ave, Silicon Valley, CA", createdAt: "2023-01-15" },
  { id: "2", name: "Solutions Co.", email: "support@solutions.co", phone: "234-567-8901", address: "456 Business Blvd, New York, NY", createdAt: "2023-02-20" },
  { id: "3", name: "Creative LLC", email: "hello@creative.llc", phone: "345-678-9012", address: "789 Art St, Los Angeles, CA", createdAt: "2023-03-10" },
  { id: "4", name: "Synergy Group", email: "info@synergy.group", phone: "456-789-0123", address: "101 Synergy Way, Chicago, IL", createdAt: "2023-04-05" },
  { id: "5", name: "Dynamic Corp.", email: "admin@dynamic.corp", phone: "567-890-1234", address: "212 Dynamic Dr, Houston, TX", createdAt: "2023-05-25" },
];

export const products: Product[] = [
  { id: "p1", name: "Ergo-Comfort Keyboard", sku: "KB-4532", category: "Electronics", stock: 120, price: 79.99, imageUrl: "https://placehold.co/100x100.png" },
  { id: "p2", name: "HD Webcam 1080p", sku: "WC-1080", category: "Electronics", stock: 85, price: 49.99, imageUrl: "https://placehold.co/100x100.png" },
  { id: "p3", name: "Wireless Optical Mouse", sku: "MS-9876", category: "Electronics", stock: 15, price: 25.50, imageUrl: "https://placehold.co/100x100.png" },
  { id: "p4", name: "Leather Office Chair", sku: "CH-3321", category: "Furniture", stock: 30, price: 249.99, imageUrl: "https://placehold.co/100x100.png" },
  { id: "p5", name: "Adjustable Standing Desk", sku: "DK-7890", category: "Furniture", stock: 5, price: 399.00, imageUrl: "https://placehold.co/100x100.png" },
  { id: "p6", name: "Premium Coffee Beans (1kg)", sku: "CF-001", category: "Office Supplies", stock: 300, price: 22.00, imageUrl: "https://placehold.co/100x100.png" },
];

export const salesOrders: SalesOrder[] = [
  {
    id: "so1",
    orderNumber: "SO-2024-001",
    client: clients[0],
    orderDate: "2024-07-01",
    items: [
      { id: "item1", productId: "p1", description: "Web Development Services", quantity: 1, unitPrice: 2500 },
    ],
    subtotal: 2500, tax: 250, total: 2750,
    status: "Fulfilled",
    invoiceGenerated: true,
  },
  {
    id: "so2",
    orderNumber: "SO-2024-002",
    client: clients[1],
    orderDate: "2024-07-05",
    items: [{ id: "item3", productId: "p4", description: "Leather Office Chair", quantity: 2, unitPrice: 249.99 }],
    subtotal: 499.98, tax: 50, total: 549.98,
    status: "Pending",
    invoiceGenerated: false,
  },
  {
    id: "so3",
    orderNumber: "SO-2024-003",
    client: clients[2],
    orderDate: "2024-06-10",
    items: [{ id: "item4", productId: "p5", description: "Adjustable Standing Desk", quantity: 1, unitPrice: 399.00 }],
    subtotal: 399.00, tax: 39.90, total: 438.90,
    status: "Cancelled",
    invoiceGenerated: false,
  },
  {
    id: "so4",
    orderNumber: "SO-2024-004",
    client: clients[0],
    orderDate: "2024-07-15",
    items: [
      { id: "item5", productId: "p1", description: "Ergo-Comfort Keyboard", quantity: 5, unitPrice: 79.99 },
      { id: "item6", productId: "p3", description: "Wireless Optical Mouse", quantity: 5, unitPrice: 25.50 },
    ],
    subtotal: 527.45, tax: 52.75, total: 580.20,
    status: "Pending",
    invoiceGenerated: false,
  },
];


export const calendarEvents: CalendarEvent[] = [
    { id: '1', date: new Date(2024, new Date().getMonth(), 8, 10, 0), title: 'Team Sync', client: clients[0] },
    { id: '2', date: new Date(2024, new Date().getMonth(), 8, 14, 0), title: 'Project Kick-off', client: clients[1] },
    { id: '3', date: new Date(2024, new Date().getMonth(), 15, 11, 30), title: 'Design Review', client: clients[2] },
    { id: '4', date: new Date(2024, new Date().getMonth(), 22, 16, 0), title: 'Quarterly Planning', client: clients[3] },
];

export const payments: (Omit<PrismaPayment, 'clientId' | 'date'> & { client: Client, date: string })[] = [
  { id: 'pay1', date: '2024-07-20', client: clients[0], description: 'Payment for INV-2024-001', amount: 3080, type: 'Bank Transfer', status: 'Received' },
  { id: 'pay2', date: '2024-07-18', client: clients[4], description: 'Office Supplies Purchase', amount: -150.75, type: 'Cash', status: 'Sent' },
  { id: 'pay3', date: '2024-07-15', client: clients[3], description: 'Consulting Fee', amount: 500, type: 'Bank Transfer', status: 'Received' },
];

export const chartData: ChartData[] = [
  { month: "Jan", profit: 1860, expenses: 800 },
  { month: "Feb", profit: 3050, expenses: 1200 },
  { month: "Mar", profit: 2370, expenses: 980 },
  { month: "Apr", profit: 730, expenses: 1100 },
  { month: "May", profit: 2090, expenses: 1300 },
  { month: "Jun", profit: 2140, expenses: 1400 },
];
