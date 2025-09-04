
"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type CalendarEvent, type Counterparty } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCounterparties } from "@/lib/actions";

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

function AddEventDialog() {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [allClients, setAllClients] = useState<Counterparty[]>([]);
  
  React.useEffect(() => {
    getCounterparties('CLIENT').then(setAllClients);
  }, []);

  const suggestedClients = eventTitle ? allClients.filter(c => c.name.toLowerCase().includes(eventTitle.toLowerCase())) : [];

  const isFormValid = useMemo(() => {
    return eventTitle.trim() !== '' && eventDate.trim() !== '';
  }, [eventTitle, eventDate]);


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="col-span-3" placeholder="e.g., Meeting with Innovate Inc." />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date & Time
            </Label>
            <Input id="date" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea id="description" className="col-span-3" placeholder="Optional notes about the event."/>
          </div>
        </div>
        {eventTitle.length > 2 && (
        <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> AI: Suggested Clients</Label>
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
        <div className="flex justify-end gap-2">
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={!isFormValid}>Save Event</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
