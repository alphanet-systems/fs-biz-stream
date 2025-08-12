
"use client";

import React, { useState, useMemo, useTransition } from "react";
import { PlusCircle, Search, File, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { type Product } from "@prisma/client";
import { createProduct, getProducts, exportProductsToCsv } from "@/lib/actions";

export default function InventoryPage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, startExportTransition] = useTransition();
  const { toast } = useToast();

  React.useEffect(() => {
    getProducts().then(setProductList);
  }, []);

  const onProductCreated = (newProduct: Product) => {
    setProductList(prevList => [newProduct, ...prevList]);
  };
  
  const filteredProducts = productList.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleExport = () => {
    startExportTransition(async () => {
      const result = await exportProductsToCsv();
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
                     <Badge variant={product.stock > 20 ? 'default' : 'destructive'} className={product.stock > 20 ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}>
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
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [stock, setStock] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [isNameValid, setIsNameValid] = useState<boolean | null>(null);
    const [isSkuValid, setIsSkuValid] = useState<boolean | null>(null);
    const [isStockValid, setIsStockValid] = useState<boolean | null>(null);
    const [isPriceValid, setIsPriceValid] = useState<boolean | null>(null);
    
    const { toast } = useToast();

    const isFormValid = useMemo(() => {
        return isNameValid === true && isSkuValid === true && isStockValid === true && isPriceValid === true;
    }, [isNameValid, isSkuValid, isStockValid, isPriceValid]);

    const validateField = (field: 'name' | 'sku' | 'stock' | 'price', value: string) => {
        const isNotEmpty = value.trim() !== '';
        switch (field) {
            case 'name':
                setIsNameValid(isNotEmpty);
                break;
            case 'sku':
                setIsSkuValid(isNotEmpty);
                break;
            case 'stock':
                setIsStockValid(isNotEmpty && !isNaN(Number(value)) && Number(value) >= 0);
                break;
            case 'price':
                setIsPriceValid(isNotEmpty && !isNaN(Number(value)) && Number(value) > 0);
                break;
        }
    };
    
    const resetForm = () => {
        setName('');
        setSku('');
        setStock('');
        setPrice('');
        setCategory('');
        setIsNameValid(null);
        setIsSkuValid(null);
        setIsStockValid(null);
        setIsPriceValid(null);
    };

    const handleSaveProduct = () => {
        if (!isFormValid) return;

        startTransition(async () => {
            const result = await createProduct({
                name,
                sku,
                stock: Number(stock),
                price: Number(price),
                category: category || null,
                imageUrl: "https://placehold.co/100x100.png",
            });

            if (result.success && result.data) {
                onProductCreated(result.data);
                toast({
                    title: "Product Saved",
                    description: `${result.data.name} has been successfully added.`,
                });
                resetForm();
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
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input id="name" placeholder="e.g., Ergo-Comfort Keyboard" value={name} onChange={e => { setName(e.target.value); validateField('name', e.target.value); }} onBlur={e => validateField('name', e.target.value)}/>
                        {isNameValid === false && <ValidationMessage isValid={false} message="Name is required." />}
                        {isNameValid === true && <ValidationMessage isValid={true} message="Name is valid." />}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input id="sku" placeholder="e.g., KB-4532" value={sku} onChange={e => { setSku(e.target.value); validateField('sku', e.target.value); }} onBlur={e => validateField('sku', e.target.value)}/>
                        {isSkuValid === false && <ValidationMessage isValid={false} message="SKU is required." />}
                        {isSkuValid === true && <ValidationMessage isValid={true} message="SKU is valid." />}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock Quantity *</Label>
                            <Input id="stock" type="number" placeholder="e.g., 120" value={stock} onChange={e => { setStock(e.target.value); validateField('stock', e.target.value); }} onBlur={e => validateField('stock', e.target.value)} />
                            {isStockValid === false && <ValidationMessage isValid={false} message="Must be a valid number." />}
                            {isStockValid === true && <ValidationMessage isValid={true} message="Stock is valid." />}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price *</Label>
                            <Input id="price" type="number" placeholder="e.g., 79.99" value={price} onChange={e => { setPrice(e.target.value); validateField('price', e.target.value); }} onBlur={e => validateField('price', e.target.value)} />
                            {isPriceValid === false && <ValidationMessage isValid={false} message="Must be a valid positive price." />}
                            {isPriceValid === true && <ValidationMessage isValid={true} message="Price is valid." />}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" placeholder="e.g., Electronics" value={category} onChange={e => setCategory(e.target.value)} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveProduct} disabled={!isFormValid || isPending}>
                      {isPending ? "Saving..." : "Save Product"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function ValidationMessage({ isValid, message }: { isValid: boolean; message: string }) {
    return (
        <div className={cn("flex items-center gap-2 text-sm", isValid ? "text-green-600" : "text-red-600")}>
            {isValid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <p>{message}</p>
        </div>
    );
}

    