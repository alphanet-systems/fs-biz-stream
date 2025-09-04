
"use client";

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Plus, Minus, Trash2, Search, CreditCard, Landmark, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getProducts, createSalesOrder } from '@/lib/actions';
import { type Product } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { useDataFetch } from '@/hooks/use-data-fetch';

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
};

export default function PosPage() {
    const { data: products, refetch: fetchProducts } = useDataFetch(getProducts, []);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                // Prevent adding more than available in stock
                if (existingItem.quantity >= product.stock) return prevCart;
                return prevCart.map(item => 
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            if (product.stock > 0) {
              return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }];
            }
            return prevCart;
        });
    };

    const updateQuantity = (id: string, newQuantity: number) => {
        const itemInCart = cart.find(item => item.id === id);
        if (!itemInCart) return;

        if (newQuantity <= 0) {
            setCart(cart.filter(item => item.id !== id));
        } else if (newQuantity > itemInCart.stock) {
            // Do not allow quantity to exceed stock
            setCart(cart.map(item => item.id === id ? { ...item, quantity: itemInCart.stock } : item));
        } else {
            setCart(cart.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
        }
    };
    
    const onSuccessfulCheckout = () => {
        setCart([]);
        // Refetch products to get updated stock levels
        fetchProducts();
    }

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.20;
    const total = subtotal + tax;
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-65px)] flex">
            <div className="w-2/3 p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search products..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-[calc(100%-60px)]">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(product => (
                            <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow relative" onClick={() => addToCart(product)}>
                                {product.stock === 0 && (
                                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                                        <span className="font-bold text-destructive">Out of Stock</span>
                                    </div>
                                )}
                                <CardContent className="p-2">
                                    <Image src={product.imageUrl ?? 'https://placehold.co/150x150.png'} alt={product.name} width={150} height={150} className="w-full rounded-md object-cover" data-ai-hint="product image"/>
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
                                <span className="text-muted-foreground">VAT (20%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <Separator/>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                        <CheckoutDialog total={total} cart={cart} onSuccessfulCheckout={onSuccessfulCheckout} />
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

function CheckoutDialog({ total, cart, onSuccessfulCheckout }: { total: number; cart: CartItem[]; onSuccessfulCheckout: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    // This is a placeholder. In a real app, you'd have a way to select or create a 'POS Customer'.
    // We assume a 'Walk-in Customer' with ID "1" exists in the seed data.
    // The specific ID can be fragile. A better approach is to fetch it.
    // For this implementation, we hardcode it based on our seed script.
    const POS_COUNTERPARTY_ID = "1"; 

    const handleConfirmPayment = () => {
        if (cart.length === 0) return;

        startTransition(async () => {
            const orderInput = {
                // Using a default counterparty ID for POS sales.
                counterpartyId: POS_COUNTERPARTY_ID, 
                orderDate: new Date(),
                generateInvoice: false, // POS sales usually don't generate formal invoices
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    unitPrice: item.price,
                })),
            };

            const result = await createSalesOrder(orderInput);

            if (result.success && result.data) {
                toast({
                    title: "Sale Complete",
                    description: `Order ${result.data.orderNumber} has been created.`,
                });
                onSuccessfulCheckout();
                setOpen(false); // Close the dialog on success
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Could not complete the sale.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                <Tabs defaultValue="cash">
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
                <div className="flex justify-end gap-2 mt-4">
                   <DialogClose asChild>
                       <Button variant="outline" disabled={isPending}>Cancel</Button>
                   </DialogClose>
                   <Button size="lg" onClick={handleConfirmPayment} disabled={isPending}>
                       {isPending ? "Processing..." : "Confirm Payment"}
                   </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
