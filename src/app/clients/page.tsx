
"use client";

import React, { useState, useTransition, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { createCounterparty, updateCounterparty, getCounterparties, exportToCsv, deleteCounterparty, type Counterparty } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ImportDialog } from "@/components/ImportDialog";
import { useDataFetch } from "@/hooks/use-data-fetch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const counterpartySchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  address: z.string().optional(),
  types: z.array(z.string()).refine(value => value.length > 0, {
    message: "At least one type (Client or Vendor) must be selected.",
  }),
});

type CounterpartyFormValues = z.infer<typeof counterpartySchema>;


export default function CounterpartiesPage() {
  const { data: counterparties, setData: setCounterparties, refetch: fetchCounterparties } = useDataFetch(getCounterparties, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, startExportTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCounterparty, setEditingCounterparty] = useState<Counterparty | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingCounterparty, setDeletingCounterparty] = useState<Counterparty | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  const filteredCounterparties = counterparties.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const onFormSubmit = (updatedCounterparty: Counterparty) => {
    if (editingCounterparty) {
        setCounterparties(prev => prev.map(c => c.id === updatedCounterparty.id ? updatedCounterparty : c));
    } else {
        setCounterparties(prev => [updatedCounterparty, ...prev]);
    }
  };

  const handleAddNew = () => {
    setEditingCounterparty(null);
    setIsSheetOpen(true);
  }

  const handleEdit = (counterparty: Counterparty) => {
    setEditingCounterparty(counterparty);
    setIsSheetOpen(true);
  }
  
  const openDeleteDialog = (counterparty: Counterparty) => {
    setDeletingCounterparty(counterparty);
    setIsDeleteAlertOpen(true);
  }
  
  const handleDelete = () => {
    if (!deletingCounterparty) return;
    
    startDeleteTransition(async () => {
        const result = await deleteCounterparty(deletingCounterparty.id);
        if (result.success) {
            setCounterparties(prev => prev.filter(c => c.id !== deletingCounterparty.id));
            toast({
                title: "Counterparty Deleted",
                description: `${deletingCounterparty.name} has been successfully deleted.`,
            });
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        }
        setIsDeleteAlertOpen(false);
        setDeletingCounterparty(null);
    });
  }

  const handleExport = () => {
    startExportTransition(async () => {
      const result = await exportToCsv('counterparties');
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'counterparties-export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Export Complete",
          description: "Your counterparty data has been downloaded.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Could not export data.",
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
              <CardTitle>Counterparties</CardTitle>
              <CardDescription>Manage your clients and vendors.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ImportDialog importType="counterparties" onImportSuccess={fetchCounterparties} />
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                <File className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
               <Button onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-8" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Search counterparties"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Created At</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCounterparties.map((counterparty) => (
                <TableRow key={counterparty.id}>
                  <TableCell>
                    <div className="font-medium">{counterparty.name}</div>
                    <div className="text-sm text-muted-foreground">{counterparty.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {counterparty.types.map(type => (
                        <Badge key={type} variant={type === 'CLIENT' ? 'default' : 'secondary'}>{type}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{counterparty.phone}</TableCell>
                  <TableCell className="hidden sm:table-cell">{new Date(counterparty.createdAt).toLocaleDateString()}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEdit(counterparty)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(counterparty)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddCounterpartySheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onFormSubmit={onFormSubmit}
        counterparty={editingCounterparty}
      />
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the counterparty
                    "{deletingCounterparty?.name}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                    {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AddCounterpartySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFormSubmit: (c: Counterparty) => void;
    counterparty: Counterparty | null;
}

function AddCounterpartySheet({ open, onOpenChange, onFormSubmit, counterparty }: AddCounterpartySheetProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const form = useForm<CounterpartyFormValues>({
        resolver: zodResolver(counterpartySchema),
    });

    useEffect(() => {
        if (open) {
            form.reset(counterparty ? {
                name: counterparty.name,
                email: counterparty.email,
                phone: counterparty.phone || '',
                address: counterparty.address || '',
                types: counterparty.types
            } : {
                name: "",
                email: "",
                phone: "",
                address: "",
                types: ["CLIENT"],
            });
        }
    }, [open, counterparty, form]);

    const handleSave = (values: CounterpartyFormValues) => {
        startTransition(async () => {
          const action = counterparty ? updateCounterparty : createCounterparty;
          const result = await action({ ...values, id: counterparty?.id });
          
          if (result.success && result.data) {
            onFormSubmit(result.data);
            toast({
                title: `Counterparty ${counterparty ? 'Updated' : 'Saved'}`,
                description: `${result.data.name} has been successfully ${counterparty ? 'updated' : 'added'}.`,
            });
            onOpenChange(false);
          } else {
             toast({
                title: "Error",
                description: result.error || "An unknown error occurred.",
                variant: "destructive",
            });
          }
        });
    };
    
    const title = counterparty ? "Edit Counterparty" : "Add New Counterparty";
    const description = counterparty ? "Update the details of the existing counterparty." : "A counterparty can be a client, a vendor, or both.";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>
                <Separator className="my-4"/>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="types"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Counterparty Type *</FormLabel>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                    {(['CLIENT', 'VENDOR'] as const).map((item) => (
                                        <FormField
                                            key={item}
                                            control={form.control}
                                            name="types"
                                            render={({ field }) => {
                                                return (
                                                <FormItem
                                                    key={item}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(item)}
                                                        onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...field.value, item])
                                                            : field.onChange(
                                                                field.value?.filter(
                                                                (value) => value !== item
                                                                )
                                                            )
                                                        }}
                                                    />
                                                    </FormControl>
                                                    <FormLabel className="font-normal capitalize">
                                                        {item.toLowerCase()}
                                                    </FormLabel>
                                                </FormItem>
                                                )
                                            }}
                                        />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name / Company Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Innovate Inc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address *</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="e.g., contact@innovate.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input type="tel" placeholder="e.g., 123-456-7890" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="mt-6 flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                              {isPending ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
