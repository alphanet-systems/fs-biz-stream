"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { products } from '@/lib/mock-data';
import Image from 'next/image';
import { Plus, Minus, Trash2, Search, CreditCard, Landmark, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

export default function PosPage() {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (product: typeof products[0]) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item => 
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(cart.filter(item => item.id !== id));
        } else {
            setCart(cart.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
        }
    };

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return (
        <div className="h-[calc(100vh-65px)] flex">
            <div className="w-2/3 p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-8" />
                </div>
                <ScrollArea className="h-[calc(100%-60px)]">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map(product => (
                            <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => addToCart(product)}>
                                <CardContent className="p-2">
                                    <Image src={product.imageUrl ?? 'https://placehold.co/150x150'} alt={product.name} width={150} height={150} className="w-full rounded-md object-cover" data-ai-hint="product image"/>
                                </CardContent>
                                <CardFooter className="p-2 flex flex-col items-start">
                                    <p className="font-semibold text-sm truncate w-full">{product.name}</p>
                                    <p className="text-muted-foreground text-sm">${product.price.toFixed(2)}</p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <div className="w-1/3 bg-background border-l">
                <Card className="flex flex-col h-full rounded-none border-none">
                    <CardHeader>
                        <CardTitle>Current Sale</CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <CardContent className="space-y-4">
                            {cart.length === 0 ? (
                                <p className="text-muted-foreground text-center py-10">Your cart is empty.</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                <Minus className="h-4 w-4"/>
                                            </Button>
                                            <span>{item.quantity}</span>
                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                <Plus className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                        <div className="w-20 text-right font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-2" onClick={() => updateQuantity(item.id, 0)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </ScrollArea>
                    <CardFooter className="flex-col mt-auto border-t pt-4">
                         <div className="w-full space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax (10%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <Separator/>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                        <CheckoutDialog total={total} />
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

function CheckoutDialog({ total }: { total: number }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full mt-4" size="lg" disabled={total <= 0}>Checkout</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Complete Payment</DialogTitle>
                </DialogHeader>
                <div className="text-center my-4">
                    <p className="text-muted-foreground">Total Amount Due</p>
                    <p className="text-4xl font-bold">${total.toFixed(2)}</p>
                </div>
                <Tabs defaultValue="card">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="card"><CreditCard className="mr-2 h-4 w-4"/>Card</TabsTrigger>
                        <TabsTrigger value="cash"><DollarSign className="mr-2 h-4 w-4"/>Cash</TabsTrigger>
                        <TabsTrigger value="bank"><Landmark className="mr-2 h-4 w-4"/>Bank</TabsTrigger>
                    </TabsList>
                    <TabsContent value="card" className="mt-4">
                        <p className="text-center text-muted-foreground">Card payment functionality coming soon.</p>
                    </TabsContent>
                    <TabsContent value="cash" className="mt-4">
                        <p className="text-center text-muted-foreground">Please collect cash from customer.</p>
                    </TabsContent>
                    <TabsContent value="bank" className="mt-4">
                         <p className="text-center text-muted-foreground">Bank transfer details would be shown here.</p>
                    </TabsContent>
                </Tabs>
                <Button className="w-full mt-4" size="lg">Confirm Payment</Button>
            </DialogContent>
        </Dialog>
    )
}
