"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, Search, Clock, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CreateReminderDialog } from "@/components/reminders/create-reminder-dialog";
import { EditReminderDialog } from "@/components/reminders/edit-reminder-dialog";
import { DeleteReminderDialog } from "@/components/reminders/delete-reminder-dialog";
import { useReminders } from "@/hooks/use-reminders";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { EmptyState } from "./components/EmptyState";
import { ReminderCard } from "./components/ReminderCard";

export const statusConfig = {
  scheduled: {
    label: "Scheduled",
    variant: "secondary" as const,
    icon: Clock,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  completed: {
    label: "Completed",
    variant: "secondary" as const,
    icon: CheckCircle2,
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    icon: XCircle,
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
};

export default function RemindersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "scheduled" | "completed" | "failed"
  >("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<number | null>(
    null
  );
  const [deleteReminderData, setDeleteReminderData] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const { data, isLoading, error } = useReminders({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    per_page: 50,
  });

  const reminders = data?.items || [];

  const handleEdit = (id: number) => {
    setSelectedReminderId(id);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: number, title: string) => {
    setDeleteReminderData({ id, title });
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
          <p className="text-muted-foreground mt-1">
            Manage your scheduled call reminders
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Reminder
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reminders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          {(["scheduled", "completed", "failed"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {statusConfig[status].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Card className="p-6">
          <p className="text-destructive">
            Error loading reminders. Please try again.
          </p>
        </Card>
      ) : reminders.length === 0 ? (
        <EmptyState onCreateClick={() => setCreateDialogOpen(true)} />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-4">
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Dialogs */}
      <CreateReminderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditReminderDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedReminderId(null);
          }
        }}
        reminderId={selectedReminderId}
      />

      {deleteReminderData && (
        <DeleteReminderDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setDeleteReminderData(null);
            }
          }}
          reminderId={deleteReminderData.id}
          reminderTitle={deleteReminderData.title}
        />
      )}
    </div>
  );
}
