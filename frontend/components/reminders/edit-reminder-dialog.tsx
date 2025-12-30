"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ReminderForm,
  reminderSchema,
  type ReminderFormData,
} from "./reminder-form";
import { useUpdateReminder, useReminder } from "@/hooks/use-reminders";
import { localToUTC, getUserTimezone, utcToLocal } from "@/lib/timezone";

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
  const { data: reminder, isLoading } = useReminder(reminderId || 0);
  const updateReminder = useUpdateReminder();

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
  });

  // Populate form when reminder data loads
  useEffect(() => {
    if (reminder && open) {
      // Convert UTC trigger_at to local time
      const localDate = utcToLocal(reminder.trigger_at, reminder.timezone);
      const timeStr = `${String(localDate.getHours()).padStart(
        2,
        "0"
      )}:${String(localDate.getMinutes()).padStart(2, "0")}`;

      form.reset({
        title: reminder.title,
        message: reminder.message,
        phone_number: reminder.phone_number,
        date: localDate,
        time: timeStr,
      });
    }
  }, [reminder, open, form]);

  const onSubmit = async (data: ReminderFormData) => {
    if (!data.date || !reminderId) {
      return;
    }

    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(":").map(Number);
      const localDateTime = new Date(data.date);
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
    } catch {
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

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ReminderForm
            form={form}
            onSubmit={onSubmit}
            isLoading={updateReminder.isPending}
            fieldPrefix="edit"
          />

          <DialogFooter className="mt-6">
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
