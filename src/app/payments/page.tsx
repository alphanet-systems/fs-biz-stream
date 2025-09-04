
"use client";

import React, { useState, useMemo, useTransition } from "react";
import { PlusCircle, Search, File, ArrowUpCircle, ArrowDownCircle, Wallet as WalletIcon, Plus } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { type Payment, type Counterparty, type Wallet } from "@prisma/client";
import { createPayment, getPayments, getCounterparties, getWallets, createWallet } from "@/lib/actions";
import { useDataFetch } from "@/hooks/use-data-fetch";

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

function AddPaymentSheet({ type, wallets, onPaymentAdded }: { type: 'Received' | 'Sent', wallets: Wallet[], onPaymentAdded: () => void }) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<string | undefined>();
    const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>();
    const [description, setDescription] = useState('');
    const [paymentType, setPaymentType] = useState<'Cash' | 'Bank Transfer'>('Bank Transfer');
    const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    React.useEffect(() => {
        if (open) {
            getCounterparties().then(setCounterparties);
        }
    }, [open]);

    const isFormValid = useMemo(() => {
        return amount && Number(amount) > 0 && selectedCounterpartyId && selectedWalletId && description.trim() !== '';
    }, [amount, selectedCounterpartyId, selectedWalletId, description]);

    const title = type === 'Received' ? 'Add Income' : 'Add Expense';
    const counterpartyLabel = type === 'Received' ? 'From Client' : 'To Vendor';

    const resetForm = () => {
        setAmount('');
        setSelectedCounterpartyId(undefined);
        setSelectedWalletId(undefined);
        setDescription('');
        setPaymentType('Bank Transfer');
    };

    const handleSave = () => {
        if (!isFormValid) return;
        
        startTransition(async () => {
            const result = await createPayment({
                amount: type === 'Received' ? Number(amount) : -Number(amount),
                type: paymentType,
                status: type,
                description,
                counterpartyId: selectedCounterpartyId!,
                walletId: selectedWalletId!,
            });

            if (result.success) {
                onPaymentAdded();
                toast({
                    title: `Payment ${type}`,
                    description: `The ${type.toLowerCase()} of $${Number(amount).toFixed(2)} has been recorded.`,
                });
                resetForm();
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
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="wallet">Wallet *</Label>
                        <Select onValueChange={setSelectedWalletId} value={selectedWalletId}>
                            <SelectTrigger id="wallet">
                                <SelectValue placeholder="Select a wallet" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map(w => (
                                    <SelectItem key={w.id} value={w.id}>{w.name} (${w.balance.toFixed(2)})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                           <Label htmlFor="amount">Amount *</Label>
                           <Input id="amount" type="number" placeholder="e.g., 500.00" value={amount} onChange={e => setAmount(e.target.value)} />
                       </div>
                       <div className="space-y-2">
                           <Label htmlFor="type">Payment Method *</Label>
                            <Select onValueChange={(value: 'Cash' | 'Bank Transfer') => setPaymentType(value)} value={paymentType}>
                               <SelectTrigger id="type">
                                   <SelectValue placeholder="Select a type" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                   <SelectItem value="Cash">Cash</SelectItem>
                               </SelectContent>
                           </Select>
                       </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="counterparty">{counterpartyLabel} *</Label>
                        <Select onValueChange={setSelectedCounterpartyId} value={selectedCounterpartyId}>
                            <SelectTrigger id="counterparty">
                                <SelectValue placeholder={`Select a counterparty`} />
                            </SelectTrigger>
                            <SelectContent>
                                {counterparties.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="description">Description *</Label>
                       <Input id="description" placeholder="e.g., Payment for invoice #123" value={description} onChange={e => setDescription(e.target.value)} />
                   </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!isFormValid || isPending}>
                        {isPending ? 'Saving...' : 'Save Payment'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function AddWalletSheet({ onWalletCreated }: { onWalletCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const isFormValid = useMemo(() => {
        return name.trim() !== '' && balance.trim() !== '' && !isNaN(Number(balance));
    }, [name, balance]);

    const resetForm = () => {
        setName('');
        setBalance('');
    };

    const handleSave = () => {
        if (!isFormValid) return;

        startTransition(async () => {
            const result = await createWallet({
                name,
                balance: Number(balance)
            });

            if (result.success) {
                onWalletCreated();
                toast({
                    title: "Wallet Created",
                    description: `${result.data?.name} has been created successfully.`,
                });
                resetForm();
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
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Wallet Name *</Label>
                        <Input id="name" placeholder="e.g., Main Bank Account" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="balance">Starting Balance *</Label>
                        <Input id="balance" type="number" placeholder="e.g., 1000.00" value={balance} onChange={e => setBalance(e.target.value)} />
                    </div>
                </div>
                 <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!isFormValid || isPending}>
                        {isPending ? "Creating..." : "Create Wallet"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
