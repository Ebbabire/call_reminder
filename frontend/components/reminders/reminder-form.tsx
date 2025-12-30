"use client";

import { useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Phone } from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const reminderSchema = z.object({
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

export type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  form: UseFormReturn<ReminderFormData>;
  onSubmit: (data: ReminderFormData) => void | Promise<void>;
  isLoading?: boolean;
  initialValues?: Partial<ReminderFormData>;
  fieldPrefix?: string;
}

export function ReminderForm({
  form,
  onSubmit,
  isLoading = false,
  initialValues,
  fieldPrefix = "",
}: ReminderFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialValues?.date || new Date()
  );
  const [timeValue, setTimeValue] = useState(
    initialValues?.time || "12:00"
  );
  const [showCalendar, setShowCalendar] = useState(false);

  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  // Watch form date value to keep selectedDate in sync
  const formDate = watch("date");
  useEffect(() => {
    if (formDate) {
      setSelectedDate(formDate);
    }
  }, [formDate]);

  // Update form when initial values change (for edit mode)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.date) {
        setSelectedDate(initialValues.date);
        setValue("date", initialValues.date);
      }
      if (initialValues.time) {
        setTimeValue(initialValues.time);
        setValue("time", initialValues.time);
      }
      if (initialValues.title) {
        setValue("title", initialValues.title);
      }
      if (initialValues.message) {
        setValue("message", initialValues.message);
      }
      if (initialValues.phone_number) {
        setValue("phone_number", initialValues.phone_number);
      }
    }
  }, [initialValues, setValue]);

  const titleId = fieldPrefix ? `${fieldPrefix}-title` : "title";
  const messageId = fieldPrefix ? `${fieldPrefix}-message` : "message";
  const phoneId = fieldPrefix ? `${fieldPrefix}-phone_number` : "phone_number";
  const timeId = fieldPrefix ? `${fieldPrefix}-time` : "time";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={titleId}>Title</Label>
        <Input
          id={titleId}
          placeholder="Call John about project"
          {...register("title")}
          aria-invalid={!!errors.title}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={messageId}>Message</Label>
        <Textarea
          id={messageId}
          placeholder="Discuss the Q4 roadmap and budget allocation..."
          rows={4}
          {...register("message")}
          aria-invalid={!!errors.message}
          disabled={isLoading}
        />
        {errors.message && (
          <p className="text-sm text-destructive">
            {errors.message.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={phoneId}>Phone Number</Label>
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
            id={phoneId}
            placeholder="+1 (555) 123-4567"
            className="pl-9"
            aria-invalid={!!errors.phone_number}
            disabled={isLoading}
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
              disabled={isLoading}
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
          <Label htmlFor={timeId}>Time</Label>
          <Input
            id={timeId}
            type="time"
            value={timeValue}
            {...register("time", {
              onChange: (e) => {
                setTimeValue(e.target.value);
              },
            })}
            aria-invalid={!!errors.time}
            disabled={isLoading}
          />
          {errors.time && (
            <p className="text-sm text-destructive">{errors.time.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
