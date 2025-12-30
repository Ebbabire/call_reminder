import { Reminder } from "@/lib/api";
import { statusConfig } from "../page";
import { formatDistanceToNow } from "date-fns";
import { formatInTimezone } from "@/lib/timezone";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Pencil, Phone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (id: number) => void;
  onDelete: (id: number, title: string) => void;
}

export function ReminderCard({
  reminder,
  onEdit,
  onDelete,
}: ReminderCardProps) {
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
                className="bg-green-100 hover:bg-green-200"
                size="icon"
                onClick={() => onEdit(reminder.id)}
                title="Edit reminder"
              >
                <Pencil className="h-4 w-4 text-green-600" />
              </Button>
            )}
            <Button
              className="bg-red-100 hover:bg-red-200"
              size="icon"
              onClick={() => onDelete(reminder.id, reminder.title)}
              title="Delete reminder"
            >
              <XCircle className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
