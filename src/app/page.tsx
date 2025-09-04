
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartData } from "@/types";
import { getSalesOrders, getPayments } from "@/lib/actions";
import { type SalesOrder, type Counterparty, type Payment } from "@prisma/client";

const chartConfig = {
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

type SalesOrderWithCounterparty = SalesOrder & { counterparty: Counterparty };

const chartData: ChartData[] = [
  { month: "Jan", profit: 1860, expenses: 800 },
  { month: "Feb", profit: 3050, expenses: 1200 },
  { month: "Mar", profit: 2370, expenses: 980 },
  { month: "Apr", profit: 730, expenses: 1100 },
  { month: "May", profit: 2090, expenses: 1300 },
  { month: "Jun", profit: 2140, expenses: 1400 },
];

export default function DashboardPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrderWithCounterparty[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    getSalesOrders().then(setSalesOrders);
    getPayments().then(setPayments);
  }, []);

  const totalRevenue = salesOrders.reduce(
    (acc, inv) =>
      inv.status === "Fulfilled" ? acc + inv.total : acc,
    0
  );
  const totalPending = salesOrders.reduce(
    (acc, inv) =>
      inv.status === "Pending" ? acc + inv.total : acc,
    0
  );
  
  const totalExpenses = payments
    .filter(p => p.status === 'Sent')
    .reduce((acc, p) => acc + Math.abs(p.amount), 0);

  const profit = totalRevenue - totalExpenses;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Here's a quick overview of your business performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Based on fulfilled sales orders.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Based on recorded expense payments.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${profit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total Revenue - Total Expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {salesOrders.filter(inv => inv.status === 'Pending').length} orders
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Profit vs. Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
                <Bar
                  dataKey="expenses"
                  fill="var(--color-expenses)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              The most recent sales from your counterparties.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {salesOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.slice(0, 5).map((order: SalesOrderWithCounterparty) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.counterparty.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.counterparty.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "Fulfilled"
                                ? "default"
                                : order.status === "Pending"
                                ? "secondary"
                                : "outline"
                            }
                            className={order.status === 'Fulfilled' ? 'bg-green-500/20 text-green-700' : ''}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${order.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                    No sales yet.
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
