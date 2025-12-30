import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Phone, Plus } from "lucide-react";

export function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
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
        Get started by creating your first reminder. We&apos;ll call you at the
        scheduled time to make sure you never miss an important call.
      </p>
      <Button onClick={onCreateClick} size="lg">
        <Plus className="mr-2 h-4 w-4" />
        Create Your First Reminder
      </Button>
    </motion.div>
  );
}
