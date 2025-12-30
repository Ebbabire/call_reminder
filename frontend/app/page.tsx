"use client";

import { motion } from "motion/react";
import { Phone, Clock, Bell, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Phone,
    title: "Smart Scheduling",
    description:
      "Schedule reminders for any time zone with automatic conversion.",
  },
  {
    icon: Clock,
    title: "Precise Timing",
    description:
      "Get notified exactly when you need to make that important call.",
  },
  {
    icon: Bell,
    title: "Multiple Channels",
    description: "Receive reminders via SMS, push notifications, or email.",
  },
  {
    icon: CheckCircle,
    title: "Track History",
    description:
      "Keep a complete history of all your scheduled and completed calls.",
  },
];

export default function Page() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Never Miss an <span className="text-primary">Important Call</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Schedule phone call reminders and stay on top of your most important
            conversations. Professional-grade reminder service for busy
            professionals.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/reminders">Get Started</a>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need
          </h2>
          <p className="mt-2 text-muted-foreground">
            Powerful features to keep you organized and on schedule.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-2xl bg-primary/5 p-8 text-center sm:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Join thousands of professionals who never miss an important call.
            Start your free trial today.
          </p>
          <Button size="lg" className="mt-4" asChild>
            <a href="/reminders">Start Free Trial</a>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
