
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { PlusCircle, Search, File, MoreHorizontal } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { type Product } from "@prisma/client";
import { createProduct, getProducts, exportToCsv } from "@/lib/actions";
import { ImportDialog } from "@/components/ImportDialog";
import { useDataFetch } from "@/hooks/use-data-fetch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  sku: z.string().min(1, "SKU is required."),
  stock: z.coerce.number().int().nonnegative("Stock must be a non-negative number."),
  price: z.coerce.number().positive("Price must be a positive number."),
  category: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function InventoryPage() {
  const { data: productList, setData: setProductList, refetch: fetchProducts } = useDataFetch(getProducts, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, startExportTransition] = useTransition();
  const { toast } = useToast();

  const onProductCreated = (newProduct: Product) => {
    setProductList(prevList => [newProduct, ...prevList]);
  };
  
  const filteredProducts = productList.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleExport = () => {
    startExportTransition(async () => {
      const result = await exportToCsv('products');
      if (result.success && result.data) {
        // Create a blob from the CSV string
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        // Create a link and trigger the download
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'products-export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Export Complete",
          description: "Your product data has been downloaded.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Could not export product data.",
          variant: "destructive",
        });
      }
    });
  };


  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Manage your products and their stock levels.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ImportDialog importType="products" onImportSuccess={fetchProducts} />
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                <File className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <AddProductSheet onProductCreated={onProductCreated}/>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search products..." 
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={product.imageUrl ?? "https://placehold.co/100x100.png"}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="rounded-md"
                      data-ai-hint="product image"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.category}</div>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>
                     <Badge variant={product.stock > 20 ? 'default' : 'destructive'} className={cn(product.stock > 20 ? 'bg-green-500/20 text-green-700' : product.stock > 0 ? 'bg-yellow-500/20 text-yellow-700' : 'bg-red-500/20 text-red-700')}>
                      {product.stock} in stock
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View Analytics</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

function AddProductSheet({ onProductCreated }: { onProductCreated: (product: Product) => void }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const form = useForm<ProductFormValues>({
      resolver: zodResolver(productSchema),
      defaultValues: {
        name: "",
        sku: "",
        stock: 0,
        price: 0,
        category: "",
      },
    });

    const handleSaveProduct = (values: ProductFormValues) => {
        startTransition(async () => {
            const result = await createProduct({
                ...values,
                category: values.category || null,
                imageUrl: "https://placehold.co/100x100.png",
            });

            if (result.success && result.data) {
                onProductCreated(result.data);
                toast({
                    title: "Product Saved",
                    description: `${result.data.name} has been successfully added.`,
                });
                form.reset();
                setOpen(false);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Could not save the product.",
                    variant: "destructive",
                });
            }
        });
    };

    // Reset form when sheet is closed
    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Add New Product</SheetTitle>
                    <SheetDescription>
                        Fill in the details below to add a new product to your inventory.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4"/>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSaveProduct)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Ergo-Comfort Keyboard" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SKU *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., KB-4532" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Quantity *</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 120" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price *</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 79.99" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Electronics" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="mt-6 flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                              {isPending ? "Saving..." : "Save Product"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
