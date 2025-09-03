
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MoreHorizontal, FileText } from "lucide-react";
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
import { type Invoice, type Counterparty } from "@prisma/client";
import { getInvoices } from "@/lib/actions";

type InvoiceWithCounterparty = Invoice & { counterparty: Counterparty };

const getStatusVariant = (status: Invoice['status']) => {
  switch (status) {
    case "Paid":
      return "bg-green-500/20 text-green-700 hover:bg-green-500/30";
    case "Sent":
      return "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30";
    case "Draft":
      return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/30";
    case "Overdue":
      return "bg-red-500/20 text-red-700 hover:bg-red-500/30";
    default:
      return "secondary";
  }
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithCounterparty[]>([]);

  useEffect(() => {
    getInvoices().then(setInvoices);
  }, []);

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your customer invoices.
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-end">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.counterparty.name}</TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                     <Link href={`/invoices/${invoice.id}`} passHref>
                        <Button variant="ghost" size="icon">
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">View Invoice</span>
                        </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
