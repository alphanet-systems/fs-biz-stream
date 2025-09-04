
"use client";

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { PlusCircle, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type Product, type Counterparty } from '@prisma/client';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getCounterparties, getProducts, createSalesOrder } from '@/lib/actions';
import { useDataFetch } from '@/hooks/use-data-fetch';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const lineItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  description: z.string(),
  quantity: z.coerce.number().min(1, "Min 1"),
  unitPrice: z.coerce.number().positive("Price > 0"),
  stock: z.number(),
}).refine(data => data.quantity <= data.stock, {
  message: "Quantity exceeds available stock.",
  path: ["quantity"],
});

const salesOrderSchema = z.object({
  counterpartyId: z.string({ required_error: "Client is required." }).min(1, "Client is required."),
  orderDate: z.date(),
  generateInvoice: z.boolean(),
  items: z.array(lineItemSchema).min(1, "At least one item is required in the order."),
});

type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;


export default function NewSalePage() {
  const { data: clients } = useDataFetch(() => getCounterparties('CLIENT'), []);
  const { data: products } = useDataFetch(getProducts, []);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
        orderDate: new Date(),
        generateInvoice: false,
        items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const subtotal = watchedItems.reduce(
    (acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  const tax = subtotal * 0.20; // 20% VAT
  const total = subtotal + tax;

  const handleAddLineItem = () => {
    append({
        productId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        stock: 0,
    });
  };

  const handleProductSelect = (index: number, product: Product) => {
    form.setValue(`items.${index}.productId`, product.id);
    form.setValue(`items.${index}.description`, product.name);
    form.setValue(`items.${index}.unitPrice`, product.price);
    form.setValue(`items.${index}.stock`, product.stock);
    form.trigger(`items.${index}.quantity`); // Re-validate quantity
  };
  
  const handleCreateOrder = (values: SalesOrderFormValues) => {
    startTransition(async () => {
      const result = await createSalesOrder(values);

      if (result.success && result.data) {
        toast({
          title: 'Sales Order Created',
          description: `Order ${result.data.orderNumber} has been successfully created.`,
        });
        router.push('/sales');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Could not create the sales order.',
          variant: 'destructive',
        });
      }
    });
  };

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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreateOrder)}>
          <Card>
            <CardHeader>
              <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="counterpartyId"
                    render={({ field }) => (
                        <FormItem>
                            <Label>Client *</Label>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                     <FormItem>
                        <Label>Order Date</Label>
                        <FormControl>
                            <Input
                                type="date"
                                value={field.value.toISOString().substring(0, 10)}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )}
                />
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
                  {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={() => (
                                <FormItem>
                                    <ProductSelector
                                        products={products}
                                        onSelect={(product) => handleProductSelect(index, product)}
                                        selectedProductId={watchedItems[index]?.productId}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} min="1" disabled={!watchedItems[index]?.productId} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                               <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} min="0" disabled={!watchedItems[index]?.productId} />
                                    </FormControl>
                                    <FormMessage />
                               </FormItem>
                            )}
                         />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleAddLineItem}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" /> Add Item
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              <div className="mt-6 flex justify-between items-center">
                 <FormField
                    control={form.control}
                    name="generateInvoice"
                    render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                           <FormControl>
                             <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                           </FormControl>
                           <Label htmlFor="generate-invoice" className="!mt-0">Generate Invoice for this Sale</Label>
                        </FormItem>
                    )}
                />
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT (20%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
                 {form.formState.errors.items && !form.formState.errors.items.root && (
                    <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.items.message}</p>
                 )}
                 {Array.isArray(form.formState.errors.items) && form.formState.errors.items.map((itemError, index) => {
                    if (itemError?.quantity) {
                        return <p key={index} className="text-sm font-medium text-destructive mt-2">Item {index + 1}: {itemError.quantity.message}</p>
                    }
                    return null;
                })}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !form.formState.isValid}
              >
                {isPending ? 'Creating...' : 'Create Sales Order'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

function ProductSelector({
  products,
  onSelect,
  selectedProductId,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
  selectedProductId?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const handleSelect = (product: Product) => {
    onSelect(product);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduct ? selectedProduct.name : 'Select product...'}
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
            <p className="p-4 text-center text-sm text-muted-foreground">
              No product found.
            </p>
          ) : (
            <div className="space-y-1 p-1">
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="ghost"
                  type="button"
                  className={cn(
                    'w-full justify-start font-normal group hover:bg-accent/80 hover:text-accent-foreground',
                    selectedProductId === product.id &&
                      'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSelect(product)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedProductId === product.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex justify-between w-full">
                    <span
                      className={cn(
                        'group-hover:text-accent-foreground',
                        selectedProductId === product.id
                          ? 'text-accent-foreground'
                          : ''
                      )}
                    >
                      {product.name}
                    </span>
                    <span
                      className={cn(
                        'text-xs group-hover:text-accent-foreground',
                        selectedProductId === product.id
                          ? 'text-accent-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
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
