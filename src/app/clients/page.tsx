
"use client";

import React, { useState, useMemo, useTransition } from "react";
import { PlusCircle, Search, File, Upload, MoreHorizontal } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { type Counterparty } from "@prisma/client";
import { createCounterparty, getCounterparties, exportCounterpartiesToCsv, importCounterpartiesFromCsv } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Papa from "papaparse";

type CounterpartyType = "CLIENT" | "VENDOR";

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, startExportTransition] = useTransition();
  const { toast } = useToast();

  const fetchCounterparties = () => {
    getCounterparties().then(setCounterparties);
  };

  React.useEffect(() => {
    fetchCounterparties();
  }, []);

  const filteredCounterparties = counterparties.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const onCounterpartyCreated = (newCounterparty: Counterparty) => {
    setCounterparties(prev => [newCounterparty, ...prev]);
  };

  const handleExport = () => {
    startExportTransition(async () => {
      const result = await exportCounterpartiesToCsv();
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
              <ImportDialog onImportSuccess={fetchCounterparties} />
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                <File className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <AddCounterpartySheet onCounterpartyCreated={onCounterpartyCreated} />
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
                      {((counterparty.types as unknown) as CounterpartyType[]).map(type => (
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
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

function AddCounterpartySheet({ onCounterpartyCreated }: { onCounterpartyCreated: (c: Counterparty) => void }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [types, setTypes] = useState<CounterpartyType[]>(['CLIENT']);
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    
    const { toast } = useToast();

    const isFormValid = useMemo(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return name.trim() !== '' && emailRegex.test(email) && types.length > 0;
    }, [name, email, types]);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setTypes(['CLIENT']);
    };
    
    const handleTypeChange = (type: CounterpartyType, checked: boolean) => {
        setTypes(prev => {
            if (checked) {
                return [...prev, type];
            } else {
                return prev.filter(t => t !== type);
            }
        });
    };

    const handleSave = () => {
        if (!isFormValid) return;

        startTransition(async () => {
          const result = await createCounterparty({ name, email, phone, address, types });
          
          if (result.success && result.data) {
            onCounterpartyCreated(result.data);
            toast({
                title: "Counterparty Saved",
                description: `${result.data.name} has been successfully added.`,
            });
            resetForm();
            setOpen(false);
          } else {
             toast({
                title: "Error",
                description: result.error || "Could not save the counterparty.",
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
                Add New
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Add New Counterparty</SheetTitle>
                    <SheetDescription>
                        A counterparty can be a client, a vendor, or both.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4"/>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Counterparty Type *</Label>
                        <div className="flex gap-4 items-center pt-2">
                           <div className="flex items-center space-x-2">
                                <Checkbox id="type-client" checked={types.includes('CLIENT')} onCheckedChange={(checked) => handleTypeChange('CLIENT', !!checked)} />
                                <Label htmlFor="type-client">Client</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                                <Checkbox id="type-vendor" checked={types.includes('VENDOR')} onCheckedChange={(checked) => handleTypeChange('VENDOR', !!checked)} />
                                <Label htmlFor="type-vendor">Vendor</Label>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name / Company Name *</Label>
                        <Input id="name" placeholder="e.g., Innovate Inc." value={name} onChange={e => setName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input id="email" type="email" placeholder="e.g., contact@innovate.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="e.g., 123-456-7890" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" placeholder="e.g., 123 Main St, Anytown, USA" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!isFormValid || isPending}>
                      {isPending ? "Saving..." : "Save"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function ImportDialog({ onImportSuccess }: { onImportSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [open, setOpen] = useState(false);
    const [isImporting, startImportTransition] = useTransition();
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleImport = () => {
        if (!file) return;

        startImportTransition(() => {
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: async (results) => {
                    const csvString = Papa.unparse(results.data);
                    const response = await importCounterpartiesFromCsv(csvString);

                    if (response.success) {
                        toast({
                            title: "Import Successful",
                            description: `${response.data?.count || 0} counterparties have been imported.`,
                        });
                        onImportSuccess();
                        setOpen(false);
                        setFile(null);
                    } else {
                        toast({
                            title: "Import Failed",
                            description: response.error || "An unknown error occurred.",
                            variant: "destructive",
                        });
                    }
                },
                error: (error) => {
                    toast({
                        title: "Error Parsing File",
                        description: error.message,
                        variant: "destructive",
                    });
                }
            });
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Counterparties from CSV</DialogTitle>
                    <DialogDescription>
                        Select a CSV file to import. The file should have the following columns in order: 
                        `name`, `email`, `phone`, `address`, `types`. The `types` column should contain `CLIENT`, `VENDOR`, or `CLIENT,VENDOR`.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={!file || isImporting}>
                        {isImporting ? "Importing..." : "Run Import"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
