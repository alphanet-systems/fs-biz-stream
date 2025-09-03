
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getInvoiceById } from '@/lib/actions';
import { type Invoice, type SalesOrder, type SalesOrderItem, type Product, type Counterparty } from '@prisma/client';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useSession } from 'next-auth/react';

type InvoiceDetails = Invoice & {
  salesOrder: SalesOrder & {
    items: (SalesOrderItem & { product: Product })[];
  };
  counterparty: Counterparty;
};

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    getInvoiceById(params.id)
      .then((data) => {
        if (data) {
          setInvoice(data);
        } else {
          notFound();
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        notFound();
      });
  }, [params.id]);

  const handleDownloadPdf = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    setIsDownloading(true);

    // Temporarily remove box-shadow for cleaner capture
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        logging: false, // Disabling logging for cleaner console
    });

    // Restore box-shadow
    element.style.boxShadow = originalShadow;
    
    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in points (pt): 595.28 x 841.89
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    const pdfAspectRatio = pdfWidth / pdfHeight;

    let finalWidth, finalHeight;

    if (canvasAspectRatio > pdfAspectRatio) {
        // Wider than PDF page
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / canvasAspectRatio;
    } else {
        // Taller than PDF page
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * canvasAspectRatio;
    }
    
    // Center the image on the page
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    pdf.save(`invoice-${invoice?.invoiceNumber}.pdf`);
    setIsDownloading(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!invoice) {
    return notFound();
  }
  
  const { counterparty, salesOrder } = invoice;
  const companyName = session?.user?.companyName || "Your Company";

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6 bg-muted/40">
       <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">
              From sale {invoice.salesOrder.orderNumber}
            </p>
          </div>
          <Button onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card ref={invoiceRef} className="w-full p-8 shadow-lg">
            <CardHeader className="p-0">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                        <p className="font-semibold text-lg">{companyName}</p>
                        <p className="text-sm text-muted-foreground">123 Business Rd, Suite 100</p>
                        <p className="text-sm text-muted-foreground">Businesstown, USA 12345</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold">Invoice #{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">Status: {invoice.status}</p>
                        <p className="text-sm text-muted-foreground">Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold text-muted-foreground">Bill To:</p>
                        <p className="font-medium">{counterparty.name}</p>
                        <p className="text-sm">{counterparty.address}</p>
                        <p className="text-sm">{counterparty.email}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 mt-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="w-[100px]">Quantity</TableHead>
                            <TableHead className="w-[150px] text-right">Unit Price</TableHead>
                            <TableHead className="w-[150px] text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {salesOrder.items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.product.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <Separator className="my-8" />
                 <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${salesOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">VAT (20%)</span>
                            <span>${salesOrder.tax.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg pt-2">
                            <span>Total Due</span>
                            <span>${salesOrder.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-0 mt-12 flex-col items-start gap-2 text-xs text-muted-foreground">
                <p className="font-semibold text-sm">Payment Terms</p>
                <p>Please pay within 30 days of the issue date. Late payments are subject to a 1.5% monthly fee.</p>
                <p>Thank you for your business!</p>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
