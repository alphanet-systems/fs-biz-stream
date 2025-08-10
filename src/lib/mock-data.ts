import { type Client, type Product, type Invoice, type CalendarEvent, type Payment, type ChartData } from "@/types";

export const clients: Client[] = [
  { id: "1", name: "Innovate Inc.", email: "contact@innovate.com", phone: "123-456-7890", address: "123 Tech Ave, Silicon Valley, CA", createdAt: "2023-01-15" },
  { id: "2", name: "Solutions Co.", email: "support@solutions.co", phone: "234-567-8901", address: "456 Business Blvd, New York, NY", createdAt: "2023-02-20" },
  { id: "3", name: "Creative LLC", email: "hello@creative.llc", phone: "345-678-9012", address: "789 Art St, Los Angeles, CA", createdAt: "2023-03-10" },
  { id: "4", name: "Synergy Group", email: "info@synergy.group", phone: "456-789-0123", address: "101 Synergy Way, Chicago, IL", createdAt: "2023-04-05" },
  { id: "5", name: "Dynamic Corp.", email: "admin@dynamic.corp", phone: "567-890-1234", address: "212 Dynamic Dr, Houston, TX", createdAt: "2023-05-25" },
];

export const products: Product[] = [
  { id: "p1", name: "Ergo-Comfort Keyboard", sku: "KB-4532", category: "Electronics", stock: 120, price: 79.99, imageUrl: "https://placehold.co/64x64.png" },
  { id: "p2", name: "HD Webcam 1080p", sku: "WC-1080", category: "Electronics", stock: 85, price: 49.99, imageUrl: "https://placehold.co/64x64.png" },
  { id: "p3", name: "Wireless Optical Mouse", sku: "MS-9876", category: "Electronics", stock: 200, price: 25.50, imageUrl: "https://placehold.co/64x64.png" },
  { id: "p4", name: "Leather Office Chair", sku: "CH-3321", category: "Furniture", stock: 30, price: 249.99, imageUrl: "https://placehold.co/64x64.png" },
  { id: "p5", name: "Adjustable Standing Desk", sku: "DK-7890", category: "Furniture", stock: 45, price: 399.00, imageUrl: "https://placehold.co/64x64.png" },
  { id: "p6", name: "Premium Coffee Beans (1kg)", sku: "CF-001", category: "Office Supplies", stock: 300, price: 22.00, imageUrl: "https://placehold.co/64x64.png" },
];

export const invoices: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "INV-2024-001",
    client: clients[0],
    issueDate: "2024-07-01",
    dueDate: "2024-07-31",
    items: [
      { id: "item1", description: "Web Development Services", quantity: 1, unitPrice: 2500 },
      { id: "item2", description: "Hosting (1 year)", quantity: 1, unitPrice: 300 },
    ],
    subtotal: 2800, tax: 280, total: 3080,
    status: "Paid",
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2024-002",
    client: clients[1],
    issueDate: "2024-07-05",
    dueDate: "2024-08-04",
    items: [{ id: "item3", description: "Graphic Design Package", quantity: 1, unitPrice: 1500 }],
    subtotal: 1500, tax: 150, total: 1650,
    status: "Pending",
  },
  {
    id: "inv3",
    invoiceNumber: "INV-2024-003",
    client: clients[2],
    issueDate: "2024-06-10",
    dueDate: "2024-07-10",
    items: [{ id: "item4", description: "3D Modeling", quantity: 10, unitPrice: 120 }],
    subtotal: 1200, tax: 120, total: 1320,
    status: "Overdue",
  },
  {
    id: "inv4",
    invoiceNumber: "INV-2024-004",
    client: clients[0],
    issueDate: "2024-07-15",
    dueDate: "2024-08-14",
    items: [
      { id: "item5", description: "Ergo-Comfort Keyboard", quantity: 5, unitPrice: 79.99 },
      { id: "item6", description: "Wireless Optical Mouse", quantity: 5, unitPrice: 25.50 },
    ],
    subtotal: 527.45, tax: 52.75, total: 580.20,
    status: "Pending",
  },
];

export const calendarEvents: CalendarEvent[] = [
    { id: '1', date: new Date(2024, new Date().getMonth(), 8, 10, 0), title: 'Team Sync', client: clients[0] },
    { id: '2', date: new Date(2024, new Date().getMonth(), 8, 14, 0), title: 'Project Kick-off', client: clients[1] },
    { id: '3', date: new Date(2024, new Date().getMonth(), 15, 11, 30), title: 'Design Review', client: clients[2] },
    { id: '4', date: new Date(2024, new Date().getMonth(), 22, 16, 0), title: 'Quarterly Planning', client: clients[3] },
];

export const payments: Payment[] = [
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
