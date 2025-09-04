
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Banknote,
  ShoppingCart,
  Boxes,
  Settings,
  UserCircle,
  LogOut,
  ChevronDown,
  Truck,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";

const allMenuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'USER'] },
  { href: "/calendar", label: "Calendar", icon: Calendar, roles: ['ADMIN', 'USER'] },
  { href: "/clients", label: "Counterparties", icon: Users, roles: ['ADMIN', 'USER'] },
  { href: "/sales", label: "Sales", icon: FileText, roles: ['ADMIN', 'USER'] },
  { href: "/invoices", label: "Invoices", icon: Receipt, roles: ['ADMIN', 'USER'] },
  { href: "/purchases", label: "Purchases", icon: Truck, roles: ['ADMIN'] },
  { href: "/payments", label: "Payments", icon: Banknote, roles: ['ADMIN'] },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart, roles: ['ADMIN', 'USER'] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ['ADMIN', 'USER'] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const menuItems = allMenuItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              B
            </div>
            <h1 className="text-xl font-semibold">BizStream</h1>
          </div>
        </SidebarHeader>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                href={item.href}
                isActive={pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true) }
              >
                <item.icon />
                {item.label}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarFooter>
          <SidebarMenu>
             <SidebarMenuItem>
               <SidebarMenuButton>
                  <Settings />
                  Settings
               </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <SidebarTrigger className="md:hidden"/>
          <div className="flex-1"></div>
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 flex items-center justify-between gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image ?? "https://placehold.co/40x40"} alt="User avatar" />
                    <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                     <span className="text-sm font-medium">{session.user.name}</span>
                     <span className="text-xs text-muted-foreground">{session.user.role}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Button variant="outline" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          )}
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
