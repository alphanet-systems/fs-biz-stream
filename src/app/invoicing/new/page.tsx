"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { clients } from '@/lib/mock-data';
import { PlusCircle, Trash2, Download } from 'lucide-react';

export default function NewInvoicePage() {
    const [lineItems, setLineItems] = useState([{ id: 1, description: '', quantity: 1, unitPrice: 0 }]);

    const handleAddLineItem = () => {
        setLineItems([...lineItems, { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }]);
    };
    
    const handleRemoveLineItem = (id: number) => {
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    const handleLineItemChange = (id: number, field: string, value: any) => {
        setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return (
        <div className="flex-1 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
                    <p className="text-muted-foreground">
                        Fill out the form below to generate a new invoice.
                    </p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="grid md:grid-cols-3 gap-6">
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
                            <Label htmlFor="issueDate">Issue Date</Label>
                            <Input id="issueDate" type="date" defaultValue={new Date().toISOString().substring(0, 10)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input id="dueDate" type="date" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
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
                                        <Input 
                                            placeholder="Item description" 
                                            value={item.description}
                                            onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            value={item.quantity}
                                            onChange={e => handleLineItemChange(item.id, 'quantity', parseInt(e.target.value))}
                                            min="1"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            value={item.unitPrice}
                                            onChange={e => handleLineItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                                            min="0"
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
                             <TableCell colSpan={4}>
                                <Button variant="outline" size="sm" onClick={handleAddLineItem}>
                                    <PlusCircle className="h-4 w-4 mr-2" /> Add Line Item
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
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Save as Draft</Button>
                    <Button variant="secondary">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                    <Button>Create & Send Invoice</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
