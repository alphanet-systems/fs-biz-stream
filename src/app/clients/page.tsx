
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, File, CheckCircle, XCircle } from "lucide-react";
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
import { MoreHorizontal } from "lucide-react";
import { clients } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function ClientsPage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>Manage your clients and view their details.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <File className="h-4 w-4 mr-2" />
                Export
              </Button>
              <AddClientSheet />
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clients..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead className="hidden sm:table-cell">Created At</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">{client.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{client.phone}</TableCell>
                  <TableCell className="hidden md:table-cell">{client.address}</TableCell>
                  <TableCell className="hidden sm:table-cell">{client.createdAt}</TableCell>
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
                        <DropdownMenuItem>View Invoices</DropdownMenuItem>
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

function AddClientSheet() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const [isNameValid, setIsNameValid] = useState<boolean | null>(null);
    const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);

    const isFormValid = isNameValid && isEmailValid;

    const validateName = (currentName: string) => {
        setIsNameValid(currentName.trim() !== '');
    };

    const validateEmail = (currentEmail: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsEmailValid(emailRegex.test(currentEmail));
    };


    return (
        <Sheet>
            <SheetTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Add New Client</SheetTitle>
                    <SheetDescription>
                        Fill in the details below to add a new client to your system.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4"/>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input 
                          id="name" 
                          placeholder="e.g., John Doe" 
                          value={name} 
                          onChange={e => {
                            setName(e.target.value);
                            validateName(e.target.value);
                          }}
                          onBlur={() => validateName(name)}
                        />
                         {isNameValid === false && <ValidationMessage isValid={false} message="Name is required." />}
                         {isNameValid === true && <ValidationMessage isValid={true} message="Name is valid." />}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="e.g., john.doe@example.com" 
                          value={email} 
                          onChange={e => {
                            setEmail(e.target.value);
                            validateEmail(e.target.value);
                          }}
                          onBlur={() => validateEmail(email)}
                        />
                        {isEmailValid === false && <ValidationMessage isValid={false} message="Please enter a valid email." />}
                        {isEmailValid === true && <ValidationMessage isValid={true} message="Email is valid." />}
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
                    <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button disabled={!isFormValid}>Save Client</Button>
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
