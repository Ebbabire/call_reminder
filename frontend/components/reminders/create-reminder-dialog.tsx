"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Phone } from "lucide-react";
import { format } from "date-fns";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReminder } from "@/hooks/use-reminders";
import { localToUTC, getUserTimezone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

// import InputMask from 'react-input-mask';

const reminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message is too long"),
  phone_number: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must be in E.164 format (e.g., +14155551234)"
    ),
  date: z.date({
    message: "Date is required",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time"),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReminderDialog({
  open,
  onOpenChange,
}: CreateReminderDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [timeValue, setTimeValue] = useState("12:00");
  const [showCalendar, setShowCalendar] = useState(false);

  const createReminder = useCreateReminder();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    // watch,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      date: new Date(),
      time: "12:00",
    },
  });

  const onSubmit = async (data: ReminderFormData) => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(":").map(Number);
      const localDateTime = new Date(selectedDate);
      localDateTime.setHours(hours, minutes, 0, 0);

      // Convert to UTC
      const timezone = getUserTimezone();
      const triggerAtUTC = localToUTC(localDateTime, timezone);

      await createReminder.mutateAsync({
        title: data.title,
        message: data.message,
        phone_number: data.phone_number,
        trigger_at: triggerAtUTC,
        timezone: timezone,
      });

      // Reset form
      reset();
      setSelectedDate(new Date());
      setTimeValue("12:00");
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
      console.log(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Reminder</DialogTitle>
          <DialogDescription>
            Schedule a phone call reminder. We&apos;ll call you at the specified
            time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Call John about project"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Discuss the Q4 roadmap and budget allocation..."
              rows={4}
              {...register("message")}
              aria-invalid={!!errors.message}
            />
            {errors.message && (
              <p className="text-sm text-destructive">
                {errors.message.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              {/* <InputMask
                mask="+1 (999) 999-9999"
                value={watch("phone_number") || ""}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  const formattedValue = rawValue ? `+${rawValue}` : "";
                  setValue("phone_number", formattedValue, {
                    shouldValidate: true,
                  });
                }}
              > */}
              {/* {(inputProps: any) => ( */}
              <Input
                {...register("phone_number", {
                  onChange: (e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    const formattedValue = rawValue ? `+${rawValue}` : "";
                    setValue("phone_number", formattedValue, {
                      shouldValidate: true,
                    });
                  },
                })}
                id="phone_number"
                placeholder="+1 (555) 123-4567"
                className="pl-9"
                aria-invalid={!!errors.phone_number}
              />
              {/* )} */}
              {/* </InputMask> */}
            </div>
            {errors.phone_number && (
              <p className="text-sm text-destructive">
                {errors.phone_number.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: +1 (555) 123-4567
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
                {showCalendar && (
                  <div className="absolute z-10 mt-1 rounded-md border bg-background p-3 shadow-md">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setValue("date", date || new Date());
                        setShowCalendar(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const checkDate = new Date(date);
                        checkDate.setHours(0, 0, 0, 0);
                        return checkDate < today;
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={timeValue}
                {...register("time", {
                  onChange: (e) => {
                    setTimeValue(e.target.value);
                  },
                })}
                aria-invalid={!!errors.time}
              />
              {errors.time && (
                <p className="text-sm text-destructive">
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createReminder.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createReminder.isPending}>
              {createReminder.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Reminder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
