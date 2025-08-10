"use client";

import React from "react";
import { PlusCircle, Search, File, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
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
import { payments } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getStatusVariant = (status: "Received" | "Sent") => {
  return status === "Received" 
    ? "bg-green-500/20 text-green-700 hover:bg-green-500/30"
    : "bg-red-500/20 text-red-700 hover:bg-red-500/30";
};

export default function PaymentsPage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track your income and expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Add Income
            </Button>
            <Button>
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Add Expense
            </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="cash">Cash</TabsTrigger>
            <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
             <Button variant="outline" size="sm">
                <File className="h-4 w-4 mr-2" />
                Export
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-8" />
            </div>
          </div>
        </div>
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client/Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="font-medium">{payment.client.name}</TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${payment.status === 'Received' ? 'text-green-600' : 'text-red-600'}`}>
                      {payment.status === 'Received' ? '+' : '-'}${Math.abs(payment.amount).toFixed(2)}
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
