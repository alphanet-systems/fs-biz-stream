
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { clients, products } from '@/lib/mock-data';
import { PlusCircle, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type Product } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type LineItem = {
    id: string;
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    stock: number;
};


export default function NewSalePage() {
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    const handleAddLineItem = () => {
        setLineItems([...lineItems, { id: Date.now().toString(), productId: '', description: '', quantity: 1, unitPrice: 0, stock: 0 }]);
    };
    
    const handleRemoveLineItem = (id: string) => {
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    const handleLineItemChange = (id: string, field: keyof LineItem, value: any) => {
        setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleProductSelect = (id: string, product: Product) => {
        setLineItems(lineItems.map(item => item.id === id ? { 
            ...item,
            productId: product.id,
            description: product.name,
            unitPrice: product.price,
            stock: product.stock,
            quantity: 1,
        } : item));
    };

    const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return (
        <div className="flex-1 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Sale</h1>
                    <p className="text-muted-foreground">
                        Fill out the form below to create a new sales order.
                    </p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="client">Client</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="orderDate">Order Date</Label>
                            <Input id="orderDate" type="date" defaultValue={new Date().toISOString().substring(0, 10)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product / Service</TableHead>
                                <TableHead className="w-[100px]">Quantity</TableHead>
                                <TableHead className="w-[150px]">Unit Price</TableHead>
                                <TableHead className="w-[150px] text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <ProductSelector 
                                            onSelect={(product) => handleProductSelect(item.id, product)}
                                            selectedProductId={item.productId}
                                        />
                                        {item.productId && item.quantity > item.stock && (
                                            <p className='text-xs text-red-500 mt-1'>Warning: Quantity exceeds available stock ({item.stock})</p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            value={item.quantity}
                                            onChange={e => handleLineItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            min="1"
                                            className={item.quantity > item.stock ? 'border-red-500' : ''}
                                            disabled={!item.productId}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={e => handleLineItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            disabled={!item.productId}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${(item.quantity * item.unitPrice).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveLineItem(item.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                           <TableRow>
                             <TableCell colSpan={5}>
                                <Button variant="outline" size="sm" onClick={handleAddLineItem}>
                                    <PlusCircle className="h-4 w-4 mr-2" /> Add Item
                                </Button>
                             </TableCell>
                           </TableRow>
                        </TableFooter>
                    </Table>
                    <div className="mt-6 flex justify-end">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax (10%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="generate-invoice" />
                        <Label htmlFor="generate-invoice">Generate Invoice</Label>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/sales" passHref>
                           <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button variant="outline">Save as Draft</Button>
                        <Button>Create Sales Order</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

function ProductSelector({ onSelect, selectedProductId }: { onSelect: (product: Product) => void, selectedProductId?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const filteredProducts = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const handleSelect = (product: Product) => {
    onSelect(product);
    setOpen(false);
    setSearch('');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduct ? selectedProduct.name : "Select product..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <div className="p-2">
            <Input 
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
            />
        </div>
        <ScrollArea className="h-[200px]">
            {filteredProducts.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No product found.</p>
            ) : (
                <div className="space-y-1 p-1">
                    {filteredProducts.map((product) => (
                        <Button
                            key={product.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start font-normal",
                                selectedProductId === product.id && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => handleSelect(product)}
                        >
                             <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <div className='flex justify-between w-full'>
                                <span>{product.name}</span>
                                <span className={cn('text-xs text-muted-foreground', selectedProductId === product.id && 'text-accent-foreground')}>
                                  Stock: {product.stock}
                                </span>
                            </div>
                        </Button>
                    ))}
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
