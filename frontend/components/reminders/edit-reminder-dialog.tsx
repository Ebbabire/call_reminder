"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Phone } from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

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
import { useUpdateReminder, useReminder } from "@/hooks/use-reminders";
import { localToUTC, getUserTimezone, utcToLocal } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/lib/api";

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
    required_error: "Date is required",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time"),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface EditReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminderId: number | null;
}

export function EditReminderDialog({
  open,
  onOpenChange,
  reminderId,
}: EditReminderDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeValue, setTimeValue] = useState("12:00");
  const [showCalendar, setShowCalendar] = useState(false);

  const { data: reminder, isLoading } = useReminder(reminderId || 0);
  const updateReminder = useUpdateReminder();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
  });

  // Populate form when reminder data loads
  useEffect(() => {
    if (reminder && open) {
      // Convert UTC trigger_at to local time
      const localDate = utcToLocal(reminder.trigger_at, reminder.timezone);
      
      setSelectedDate(localDate);
      setTimeValue(
        `${String(localDate.getHours()).padStart(2, "0")}:${String(
          localDate.getMinutes()
        ).padStart(2, "0")}`
      );

      setValue("title", reminder.title);
      setValue("message", reminder.message);
      setValue("phone_number", reminder.phone_number);
      setValue("date", localDate);
      setValue("time", `${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}`);
    }
  }, [reminder, open, setValue]);

  const onSubmit = async (data: ReminderFormData) => {
    if (!selectedDate || !reminderId) {
      return;
    }

    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(":").map(Number);
      const localDateTime = new Date(selectedDate);
      localDateTime.setHours(hours, minutes, 0, 0);

      // Convert to UTC
      const timezone = reminder?.timezone || getUserTimezone();
      const triggerAtUTC = localToUTC(localDateTime, timezone);

      await updateReminder.mutateAsync({
        id: reminderId,
        data: {
          title: data.title,
          message: data.message,
          phone_number: data.phone_number,
          trigger_at: triggerAtUTC,
          timezone: timezone,
        },
      });

      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!reminder) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Reminder</DialogTitle>
          <DialogDescription>
            Update the reminder details. We&apos;ll call you at the specified
            time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              placeholder="Call John about project"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-message">Message</Label>
            <Textarea
              id="edit-message"
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
            <Label htmlFor="edit-phone_number">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                id="edit-phone_number"
                placeholder="+1 (555) 123-4567"
                className="pl-9"
                aria-invalid={!!errors.phone_number}
              />
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
              <Label htmlFor="edit-time">Time</Label>
              <Input
                id="edit-time"
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
                <p className="text-sm text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateReminder.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateReminder.isPending}>
              {updateReminder.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
