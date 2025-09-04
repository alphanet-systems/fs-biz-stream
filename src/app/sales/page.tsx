
"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { PlusCircle, Search, File, FileText, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type SalesOrder, type Counterparty } from "@prisma/client";
import { getSalesOrders, exportToCsv, fulfillSalesOrder } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useDataFetch } from "@/hooks/use-data-fetch";

type SalesOrderWithCounterparty = SalesOrder & { counterparty: Counterparty };

const getStatusVariant = (status: SalesOrder['status']) => {
  switch (status) {
    case "Fulfilled":
      return "bg-green-500/20 text-green-700 hover:bg-green-500/30";
    case "Pending":
      return "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30";
    case "Cancelled":
      return "bg-red-500/20 text-red-700 hover:bg-red-500/30";
    default:
      return "secondary";
  }
};

export default function SalesPage() {
  const { data: salesOrders, refetch: refetchSalesOrders } = useDataFetch(getSalesOrders, []);
  const [isExporting, startExportTransition] = useTransition();
  const [isFulfilling, startFulfillTransition] = useTransition();
  const { toast } = useToast();

  const handleExport = () => {
    startExportTransition(async () => {
      const result = await exportToCsv('sales-orders');
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sales-orders-export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Export Complete",
          description: "Your sales order data has been downloaded.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Could not export data.",
          variant: "destructive",
        });
      }
    });
  };

  const handleFulfillOrder = (orderId: string) => {
    startFulfillTransition(async () => {
      const result = await fulfillSalesOrder(orderId);
      if (result.success) {
        toast({
          title: "Order Fulfilled",
          description: `Order ${result.data?.orderNumber} has been fulfilled and payment recorded.`,
        });
        refetchSalesOrders();
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not fulfill the order.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">
            Manage your sales orders and generate invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                <File className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            <Link href="/sales/new" passHref>
                <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Sale
                </Button>
            </Link>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-8" />
            </div>
          </div>
        </div>
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.counterparty.name}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          {order.status === 'Pending' && (
                             <DropdownMenuItem onClick={() => handleFulfillOrder(order.id)} disabled={isFulfilling}>
                              Fulfill Order
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4"/> Generate Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Cancel Order</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
