"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import {
  ReminderForm,
  reminderSchema,
  type ReminderFormData,
} from "./reminder-form";
import { useCreateReminder } from "@/hooks/use-reminders";
import { localToUTC, getUserTimezone } from "@/lib/timezone";

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReminderDialog({
  open,
  onOpenChange,
}: CreateReminderDialogProps) {
  const createReminder = useCreateReminder();

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      date: new Date(),
      time: "12:00",
    },
  });

  const onSubmit = async (data: ReminderFormData) => {
    if (!data.date) {
      toast.error("Please select a date");
      return;
    }

    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(":").map(Number);
      const localDateTime = new Date(data.date);
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
      form.reset({
        date: new Date(),
        time: "12:00",
      });
      onOpenChange(false);
    } catch {
      // Error is handled by the mutation
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

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ReminderForm
            form={form}
            onSubmit={onSubmit}
            isLoading={createReminder.isPending}
          />

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
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
