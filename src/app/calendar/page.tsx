
"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type CalendarEvent, type Counterparty } from "@prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCounterparties, createCalendarEvent, getCalendarEvents, deleteCalendarEvent, type Counterparty as AppCounterparty } from "@/lib/actions";
import { useDataFetch } from "@/hooks/use-data-fetch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
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


const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: calendarEvents, refetch: refetchEvents } = useDataFetch(getCalendarEvents, []);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  }

  const handleDeletePrompt = (event: React.MouseEvent, eventId: string) => {
      event.stopPropagation();
      const eventToDelete = calendarEvents.find(e => e.id === eventId);
      if (eventToDelete) {
        setSelectedEvent(eventToDelete);
        setIsDeleteAlertOpen(true);
      }
  }
  
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    startDeleteTransition(async () => {
        const result = await deleteCalendarEvent(selectedEvent.id);
        if (result.success) {
            toast({ title: "Event Deleted", description: "The event has been successfully removed." });
            refetchEvents();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsDeleteAlertOpen(false);
        setSelectedEvent(null);
    });
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-muted-foreground">
                {format(currentDate, "MMMM yyyy")}
            </h2>
        </div>
        <AddEventDialog onEventAdded={refetchEvents} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center font-medium text-muted-foreground hidden md:block">
                {day}
              </div>
            ))}
             {dayNames.map((day) => (
              <div key={day} className="p-3 text-center font-medium text-muted-foreground md:hidden">
                {day.charAt(0)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-5">
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="border-r border-b h-32" />
            ))}
            {daysInMonth.map((day) => {
              const eventsForDay = calendarEvents.filter(
                (event) => format(parseISO(event.start as any), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
              );
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "border-r border-b p-2 h-32 flex flex-col",
                    isSameMonth(day, currentDate) ? "" : "bg-muted/50 text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "font-semibold flex items-center justify-center h-8 w-8",
                      isToday(day) && "bg-primary text-primary-foreground rounded-full",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex-1 overflow-y-auto text-xs mt-1 space-y-1">
                    {eventsForDay.map(event => (
                      <div key={event.id} onClick={() => handleEventClick(event)} className="bg-primary/20 text-primary-foreground p-1 rounded-md truncate cursor-pointer hover:bg-primary/30 relative group">
                        <span className="font-bold">{format(parseISO(event.start as any), 'h:mm a')}</span> {event.title}
                         <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => handleDeletePrompt(e, event.id)}>
                            <X className="h-3 w-3" />
                         </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
             {Array.from({ length: 42 - daysInMonth.length - startingDayIndex }).map((_, index) => (
              <div key={`empty-end-${index}`} className="border-r border-b h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedEvent?.title}</DialogTitle>
                <DialogDescription>
                    {selectedEvent && format(parseISO(selectedEvent.start as any), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <p>{selectedEvent?.description}</p>
            </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the event: "{selectedEvent?.title}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteEvent} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                    {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const eventSchema = z.object({
    title: z.string().min(1, "Title is required."),
    start: z.string().min(1, "Start date and time are required."),
    end: z.string().min(1, "End date and time are required."),
    description: z.string().optional(),
    allDay: z.boolean(),
    counterpartyId: z.string().optional(),
}).refine(data => new Date(data.end) > new Date(data.start), {
    message: "End date must be after start date.",
    path: ["end"],
});

type EventFormValues = z.infer<typeof eventSchema>;

function AddEventDialog({ onEventAdded }: { onEventAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: allClients } = useDataFetch(() => getCounterparties('CLIENT'), []);
  const { toast } = useToast();
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      start: "",
      end: "",
      description: "",
      allDay: false,
      counterpartyId: undefined,
    },
  });

  const handleSave = (values: EventFormValues) => {
    startTransition(async () => {
        const result = await createCalendarEvent({
            ...values,
            description: values.description || null,
            counterpartyId: values.counterpartyId || null,
            start: new Date(values.start),
            end: new Date(values.end),
        });

        if (result.success) {
            toast({ title: "Event Created", description: "Your new event has been added to the calendar." });
            onEventAdded();
            setOpen(false);
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    });
  };

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Meeting with Innovate Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                        <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                        <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="counterpartyId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Link to Client (Optional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                               <Button variant="outline" role="combobox" className="w-full justify-between">
                                    {field.value ? allClients.find(c => c.id === field.value)?.name : "Select a client"}
                               </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            {allClients.map(client => (
                                <Button key={client.id} variant="ghost" className="w-full justify-start" onClick={() => field.onChange(client.id)}>
                                    {client.name}
                                </Button>
                            ))}
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes about the event." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Event"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
