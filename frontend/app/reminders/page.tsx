"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Phone,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateReminderDialog } from "@/components/reminders/create-reminder-dialog";
import { EditReminderDialog } from "@/components/reminders/edit-reminder-dialog";
import { DeleteReminderDialog } from "@/components/reminders/delete-reminder-dialog";
import { useReminders } from "@/hooks/use-reminders";
import { formatInTimezone } from "@/lib/timezone";
import type { Reminder } from "@/lib/api";

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  completed: {
    label: "Completed",
    variant: "secondary" as const,
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
};

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (id: number) => void;
  onDelete: (id: number, title: string) => void;
}

function ReminderCard({ reminder, onEdit, onDelete }: ReminderCardProps) {
  const status = statusConfig[reminder.status];
  const StatusIcon = status.icon;

  const triggerDate = new Date(reminder.trigger_at);
  const isPast = triggerDate < new Date();
  const relativeTime = isPast
    ? `Called ${formatDistanceToNow(triggerDate, { addSuffix: true })}`
    : `Calling ${formatDistanceToNow(triggerDate, { addSuffix: true })}`;

  const formattedDate = formatInTimezone(
    reminder.trigger_at,
    reminder.timezone,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );

  const canEdit = reminder.status === "scheduled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{reminder.title}</h3>
              <Badge className={status.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {reminder.message}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                <span className="font-mono">{reminder.phone_number}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{relativeTime}</p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(reminder.id)}
                title="Edit reminder"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(reminder.id, reminder.title)}
              title="Delete reminder"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="rounded-full bg-primary/10 p-6 mb-4">
        <Phone className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No reminders yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get started by creating your first reminder. We'll call you at the
        scheduled time to make sure you never miss an important call.
      </p>
      <Button onClick={onCreateClick} size="lg">
        <Plus className="mr-2 h-4 w-4" />
        Create Your First Reminder
      </Button>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

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
