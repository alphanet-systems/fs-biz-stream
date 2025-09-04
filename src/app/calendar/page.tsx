
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type CalendarEvent, type Counterparty } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCounterparties } from "@/lib/actions";
import { useDataFetch } from "@/hooks/use-data-fetch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  // In a real app, you'd fetch these from a database
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };

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
        <AddEventDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-5">
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="border-r border-b h-32" />
            ))}
            {daysInMonth.map((day) => {
              const eventsForDay = calendarEvents.filter(
                (event) => format(event.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
              );
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "border-r border-b p-2 h-32 flex flex-col",
                    isSameMonth(day, currentDate) ? "" : "bg-muted/50 text-muted-foreground",
                    isToday(day) ? "bg-accent/50 relative" : ""
                  )}
                >
                  <span
                    className={cn(
                      "font-semibold",
                      isToday(day)
                        ? "bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center"
                        : "flex items-center justify-center h-8 w-8"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex-1 overflow-y-auto text-xs mt-1 space-y-1">
                    {eventsForDay.map(event => (
                      <div key={event.id} className="bg-primary/20 text-primary-foreground p-1 rounded-md truncate">
                        <span className="font-bold">{format(event.date, 'h:mm a')}</span> {event.title}
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
    </div>
  );
}

const eventSchema = z.object({
    title: z.string().min(1, "Title is required."),
    dateTime: z.string().min(1, "Date and time are required."),
    description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

function AddEventDialog() {
  const [open, setOpen] = useState(false);
  const { data: allClients } = useDataFetch(() => getCounterparties('CLIENT'), []);
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      dateTime: "",
      description: "",
    },
  });

  const eventTitle = form.watch("title");
  const suggestedClients = eventTitle ? allClients.filter(c => c.name.toLowerCase().includes(eventTitle.toLowerCase())) : [];

  const handleSave = (values: EventFormValues) => {
    // In a real app, you would save this to the database.
    console.log("Saving event:", values);
    form.reset();
    setOpen(false);
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
      <DialogContent className="sm:max-w-[425px]">
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Meeting with Innovate Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
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
            
            {eventTitle && eventTitle.length > 2 && (
              <div className="space-y-2 pt-4">
                  <FormLabel className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> AI: Suggested Clients</FormLabel>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  {suggestedClients.length > 0 ? (
                      suggestedClients.map(client => (
                          <div key={client.id} className="text-sm p-2 bg-background rounded-md flex justify-between items-center">
                              <span>{client.name}</span>
                              <Button variant="ghost" size="sm">Link</Button>
                          </div>
                      ))
                  ) : (
                      <p className="text-sm text-muted-foreground text-center p-2">No clients match '{eventTitle}'.</p>
                  )}
                  </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Event</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
