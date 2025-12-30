import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  type Reminder,
  type ReminderCreate,
  type ReminderUpdate,
  type ListRemindersParams,
} from "@/lib/api";

export function useReminders(params: ListRemindersParams = {}) {
  return useQuery({
    queryKey: ["reminders", params],
    queryFn: () => listReminders(params),
  });
}

export function useReminder(id: number) {
  return useQuery({
    queryKey: ["reminders", id],
    queryFn: () => getReminder(id),
    enabled: !!id,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReminderCreate) => createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create reminder");
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReminderUpdate }) =>
      updateReminder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["reminders", variables.id] });
      toast.success("Reminder updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update reminder");
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete reminder");
    },
  });
}
