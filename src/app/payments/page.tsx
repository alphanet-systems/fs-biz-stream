
"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import { PlusCircle, Search, File, ArrowUpCircle, ArrowDownCircle, Wallet as WalletIcon, Plus, Replace } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { type Payment, type Counterparty, type Wallet } from "@prisma/client";
import { createPayment, getPayments, getCounterparties, getWallets, createWallet, transferBetweenWallets } from "@/lib/actions";
import { useDataFetch } from "@/hooks/use-data-fetch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const getStatusVariant = (status: "Received" | "Sent") => {
  return status === "Received" 
    ? "bg-green-500/20 text-green-700 hover:bg-green-500/30"
    : "bg-red-500/20 text-red-700 hover:bg-red-500/30";
};

type PaymentWithRelations = Payment & { counterparty: Counterparty, wallet: Wallet };

export default function PaymentsPage() {
  const { data: paymentList, refetch: refetchPayments } = useDataFetch(getPayments, []);
  const { data: wallets, refetch: refetchWallets } = useDataFetch(getWallets, []);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = () => {
    refetchPayments();
    refetchWallets();
  }
  
  const filteredPayments = paymentList.filter(payment =>
    payment.counterparty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.description && payment.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track your income, expenses, and manage your wallets.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <TransferFundsSheet wallets={wallets} onTransferSuccess={fetchData} />
            <AddPaymentSheet type="Received" wallets={wallets} onPaymentAdded={fetchData} />
            <AddPaymentSheet type="Sent" wallets={wallets} onPaymentAdded={fetchData} />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map(wallet => (
          <Card key={wallet.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
              <WalletIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${wallet.balance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Current balance</p>
            </CardContent>
          </Card>
        ))}
        <AddWalletSheet onWalletCreated={fetchData} />
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
             <Button variant="outline" size="sm">
                <File className="h-4 w-4 mr-2" />
                Export
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{payment.counterparty.name}</TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.wallet.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusVariant(payment.status as "Received" | "Sent")}>
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

const paymentSchema = z.object({
    walletId: z.string().min(1, "A wallet must be selected."),
    amount: z.coerce.number().positive("Amount must be a positive number."),
    type: z.string().min(1, "Payment method is required."),
    counterpartyId: z.string().min(1, "A counterparty must be selected."),
    description: z.string().min(1, "Description is required."),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

function AddPaymentSheet({ type, wallets, onPaymentAdded }: { type: 'Received' | 'Sent', wallets: Wallet[], onPaymentAdded: () => void }) {
    const [open, setOpen] = useState(false);
    const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            walletId: undefined,
            amount: 0,
            type: "Bank Transfer",
            counterpartyId: undefined,
            description: "",
        },
    });

    useEffect(() => {
        if (open) {
            getCounterparties().then(setCounterparties);
        }
    }, [open]);
    
    // Reset form when sheet is closed
    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    const title = type === 'Received' ? 'Add Income' : 'Add Expense';
    const counterpartyLabel = type === 'Received' ? 'From Client' : 'To Vendor';

    const handleSave = (values: PaymentFormValues) => {
        startTransition(async () => {
            const result = await createPayment({
                amount: type === 'Received' ? values.amount : -values.amount,
                type: values.type,
                status: type,
                description: values.description,
                counterpartyId: values.counterpartyId,
                walletId: values.walletId,
            });

            if (result.success) {
                onPaymentAdded();
                toast({
                    title: `Payment ${type}`,
                    description: `The ${type.toLowerCase()} of $${values.amount.toFixed(2)} has been recorded.`,
                });
                form.reset();
                setOpen(false);
            } else {
                 toast({
                    title: "Error",
                    description: result.error || "Could not save the payment.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)} variant={type === 'Received' ? 'default' : 'outline'}>
                    {type === 'Received' ? <ArrowUpCircle className="h-4 w-4 mr-2" /> : <ArrowDownCircle className="h-4 w-4 mr-2" />}
                    {title}
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>
                        Fill in the details below to record a new transaction.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4"/>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="walletId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Wallet *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a wallet" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name} (${w.balance.toFixed(2)})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount *</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 500.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Method *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="Cash">Cash</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="counterpartyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{counterpartyLabel} *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a counterparty" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {counterparties.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Payment for invoice #123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="mt-6 flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Saving...' : 'Save Payment'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}

const walletSchema = z.object({
    name: z.string().min(1, "Wallet name is required."),
    balance: z.coerce.number({ invalid_type_error: "Balance must be a number." }),
});

type WalletFormValues = z.infer<typeof walletSchema>;

function AddWalletSheet({ onWalletCreated }: { onWalletCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<WalletFormValues>({
        resolver: zodResolver(walletSchema),
        defaultValues: {
            name: "",
            balance: 0,
        },
    });

    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    const handleSave = (values: WalletFormValues) => {
        startTransition(async () => {
            const result = await createWallet(values);

            if (result.success) {
                onWalletCreated();
                toast({
                    title: "Wallet Created",
                    description: `${result.data?.name} has been created successfully.`,
                });
                form.reset();
                setOpen(false);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Could not create the wallet.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full h-full" onClick={() => setOpen(true)}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PlusCircle className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Add New Wallet</span>
                    </div>
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Create New Wallet</SheetTitle>
                    <SheetDescription>
                        A wallet represents a real-world account like a bank account or cash drawer.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4"/>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Wallet Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Main Bank Account" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="balance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Starting Balance *</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 1000.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="mt-6 flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Creating..." : "Create Wallet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}

const transferSchema = z.object({
    fromWalletId: z.string().min(1, "Source wallet is required."),
    toWalletId: z.string().min(1, "Destination wallet is required."),
    amount: z.coerce.number().positive("Amount must be a positive number."),
}).refine(data => data.fromWalletId !== data.toWalletId, {
    message: "Source and destination wallets cannot be the same.",
    path: ["toWalletId"],
});

type TransferFormValues = z.infer<typeof transferSchema>;

function TransferFundsSheet({ wallets, onTransferSuccess }: { wallets: Wallet[], onTransferSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            fromWalletId: undefined,
            toWalletId: undefined,
            amount: 0,
        },
    });

    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    const handleTransfer = (values: TransferFormValues) => {
        startTransition(async () => {
            const result = await transferBetweenWallets(values);
            if (result.success) {
                toast({ title: "Transfer Successful", description: `Successfully transferred $${values.amount.toFixed(2)}.` });
                onTransferSuccess();
                setOpen(false);
            } else {
                toast({ title: "Transfer Failed", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(true)}>
                    <Replace className="mr-2 h-4 w-4" /> Transfer Funds
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Transfer Between Wallets</SheetTitle>
                    <SheetDescription>Move funds from one wallet to another.</SheetDescription>
                </SheetHeader>
                <Separator className="my-4"/>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleTransfer)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fromWalletId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>From Wallet *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select source wallet" /></SelectTrigger></FormControl>
                                        <SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name} (${w.balance.toFixed(2)})</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="toWalletId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>To Wallet *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select destination wallet" /></SelectTrigger></FormControl>
                                        <SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name} (${w.balance.toFixed(2)})</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount *</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 100.00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="mt-6 flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Transferring..." : "Confirm Transfer"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
