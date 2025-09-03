
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getInvoiceById } from '@/lib/actions';
import { type Invoice, type SalesOrder, type SalesOrderItem, type Product, type Counterparty } from '@prisma/client';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type InvoiceDetails = Invoice & {
  salesOrder: SalesOrder & {
    items: (SalesOrderItem & { product: Product })[];
  };
  counterparty: Counterparty;
};

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

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
    const input = invoiceRef.current;
    if (!input) return;

    // Scale up the element for better resolution
    const scale = 2;
    const canvas = await html2canvas(input, {
        scale: scale,
        useCORS: true,
        logging: true,
        width: input.offsetWidth,
        height: input.offsetHeight,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
    });
    
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height],
        hotfixes: ['px_scaling']
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`invoice-${invoice?.invoiceNumber}.pdf`);
  };

  if (loading) {
    return <div>Loading invoice...</div>;
  }

  if (!invoice) {
    return notFound();
  }
  
  const { counterparty, salesOrder } = invoice;

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">
              From sale {invoice.salesOrder.orderNumber}
            </p>
          </div>
          <Button onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
      </div>

      <div ref={invoiceRef} className="p-8">
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                        <p className="text-muted-foreground">BizStream Inc.</p>
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
                <Separator className="my-6" />
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold">Bill To:</p>
                        <p>{counterparty.name}</p>
                        <p>{counterparty.address}</p>
                        <p>{counterparty.email}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
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
                                <TableCell>{item.product.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <Separator className="my-6" />
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
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total Due</span>
                            <span>${salesOrder.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-xs text-muted-foreground">
                <p className="font-semibold">Payment Terms</p>
                <p>Please pay within 30 days of the issue date. Late payments are subject to a 1.5% monthly fee.</p>
                <p>Thank you for your business!</p>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
