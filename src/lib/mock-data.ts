
import { type Counterparty, type Product, type SalesOrder, type CalendarEvent, type Payment, type ChartData } from "@/types";

export const clients: Counterparty[] = [
  { id: "1", name: "Innovate Inc.", email: "contact@innovate.com", phone: "123-456-7890", address: "123 Tech Ave, Silicon Valley, CA", types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "Solutions Co.", email: "support@solutions.co", phone: "234-567-8901", address: "456 Business Blvd, New York, NY", types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
  { id: "3", name: "Creative LLC", email: "hello@creative.llc", phone: "345-678-9012", address: "789 Art St, Los Angeles, CA", types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
  { id: "4", name: "Synergy Group", email: "info@synergy.group", phone: "456-789-0123", address: "101 Synergy Way, Chicago, IL", types: ['CLIENT'], createdAt: new Date(), updatedAt: new Date() },
  { id: "5", name: "Dynamic Corp.", email: "admin@dynamic.corp", phone: "567-890-1234", address: "212 Dynamic Dr, Houston, TX", types: ['VENDOR'], createdAt: new Date(), updatedAt: new Date() },
];

export const products: Product[] = [
  { id: "p1", name: "Ergo-Comfort Keyboard", sku: "KB-4532", category: "Electronics", stock: 120, price: 79.99, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() },
  { id: "p2", name: "HD Webcam 1080p", sku: "WC-1080", category: "Electronics", stock: 85, price: 49.99, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() },
  { id: "p3", name: "Wireless Optical Mouse", sku: "MS-9876", category: "Electronics", stock: 15, price: 25.50, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() },
  { id: "p4", name: "Leather Office Chair", sku: "CH-3321", category: "Furniture", stock: 30, price: 249.99, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() },
  { id: "p5", name: "Adjustable Standing Desk", sku: "DK-7890", category: "Furniture", stock: 5, price: 399.00, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() },
  { id: "p6", name: "Premium Coffee Beans (1kg)", sku: "CF-001", category: "Office Supplies", stock: 300, price: 22.00, imageUrl: "https://placehold.co/100x100.png", createdAt: new Date(), updatedAt: new Date() },
];

export const salesOrders: any[] = [];

export const calendarEvents: any[] = [];

export const payments: any[] = [];

export const chartData: ChartData[] = [
  { month: "Jan", profit: 1860, expenses: 800 },
  { month: "Feb", profit: 3050, expenses: 1200 },
  { month: "Mar", profit: 2370, expenses: 980 },
  { month: "Apr", profit: 730, expenses: 1100 },
  { month: "May", profit: 2090, expenses: 1300 },
  { month: "Jun", profit: 2140, expenses: 1400 },
];
