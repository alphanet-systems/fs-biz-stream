
"use client";

import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { importCounterpartiesFromCsv, importProductsFromCsv } from "@/lib/actions";
import Papa from "papaparse";

type ImportType = "products" | "counterparties";

const TEMPLATES: Record<ImportType, { name: string, headers: string[] }> = {
    products: {
        name: "products-template.csv",
        headers: ["name", "sku", "category", "price", "stock"],
    },
    counterparties: {
        name: "counterparties-template.csv",
        headers: ["name", "email", "phone", "address", "types"],
    }
}

export function ImportDialog({ importType, onImportSuccess }: { importType: ImportType, onImportSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [open, setOpen] = useState(false);
    const [isImporting, startImportTransition] = useTransition();
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const { name, headers } = TEMPLATES[importType];
        const csv = Papa.unparse([headers]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', name);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleImport = () => {
        if (!file) return;

        startImportTransition(() => {
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: async (results) => {
                    // Pass the raw CSV string to the backend
                    const csvString = Papa.unparse(results.data);
                    const importAction = importType === 'products' ? importProductsFromCsv : importCounterpartiesFromCsv;
                    const response = await importAction(csvString);

                    if (response.success) {
                        toast({
                            title: "Import Successful",
                            description: `${response.data?.count || 0} ${importType} have been imported.`,
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
                    <DialogTitle>Import {importType === 'products' ? 'Products' : 'Counterparties'} from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to bulk-import your data. Download the template to ensure your data is in the correct format.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Button onClick={handleDownloadTemplate} variant="secondary" className="w-full">
                        <FileDown className="h-4 w-4 mr-2"/>
                        Download CSV Template
                    </Button>
                    <div className="grid gap-2">
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleImport} disabled={!file || isImporting}>
                        {isImporting ? "Importing..." : "Run Import"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
