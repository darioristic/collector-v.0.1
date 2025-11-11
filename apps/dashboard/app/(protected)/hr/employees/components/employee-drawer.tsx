"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarIcon, Mail, Phone, Trash2, UserCircle, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { generateAvatarFallback } from "@/lib/utils";
import type { Employee } from "../types";

interface EmployeeDrawerProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const salaryFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const RECENT_ACTIVITY = [
  {
    title: "Salary update",
    description: "Adjusted annual salary to reflect new compensation band.",
    timestamp: "2 days ago"
  },
  {
    title: "Performance review",
    description: "Completed mid-year performance review with HR.",
    timestamp: "1 week ago"
  },
  {
    title: "Document upload",
    description: "Uploaded signed NDA and compliance forms.",
    timestamp: "3 weeks ago"
  }
];

const getAvatarUrl = (employee: Employee) =>
  `https://avatar.vercel.sh/${encodeURIComponent(employee.email)}.svg?size=128&text=${encodeURIComponent(employee.firstName.charAt(0))}`;

export default function EmployeeDrawer({ open, employee, onClose, onEdit, onDelete }: EmployeeDrawerProps) {
  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
    return undefined;
  }, [open]);

  return (
    <AnimatePresence>
      {open && employee ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-xl bg-background shadow-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="flex h-full flex-col">
              <div className="border-b px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16 border border-border">
                      <AvatarImage src={getAvatarUrl(employee)} alt={employee.fullName} />
                      <AvatarFallback className="text-lg font-semibold">
                        {generateAvatarFallback(employee.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-semibold leading-tight">{employee.fullName}</h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {employee.role ?? "Role not set"} · {employee.department ?? "No department"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge>{employee.employmentType}</Badge>
                        <Badge
                          variant={
                            employee.status === "Active"
                              ? "success"
                              : employee.status === "On Leave"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground rounded-full border border-transparent p-2 transition hover:border-border focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Close drawer"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <CalendarIcon className="size-4" aria-hidden="true" />
                    {`Joined ${dateFormatter.format(new Date(employee.startDate))}`}
                  </div>
                  {employee.endDate ? (
                    <div className="inline-flex items-center gap-2">
                      <CalendarIcon className="size-4" aria-hidden="true" />
                      {`Ends ${dateFormatter.format(new Date(employee.endDate))}`}
                    </div>
                  ) : null}
                </div>
              </div>

              <ScrollArea className="flex-1 px-6 py-6">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-lg font-semibold">Contact</h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="text-muted-foreground size-4" aria-hidden="true" />
                        <a
                          href={`mailto:${employee.email}`}
                          className="hover:text-primary transition"
                        >
                          {employee.email}
                        </a>
                      </div>
                      {employee.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="text-muted-foreground size-4" aria-hidden="true" />
                          <a href={`tel:${employee.phone}`} className="hover:text-primary transition">
                            {employee.phone}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold">Employment details</h3>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase">Department</p>
                        <p className="font-medium">{employee.department ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase">Position</p>
                        <p className="font-medium">{employee.role ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase">Employment type</p>
                        <p className="font-medium">{employee.employmentType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase">Salary</p>
                        <p className="font-medium">
                          {employee.salary !== null && employee.salary !== undefined
                            ? salaryFormatter.format(employee.salary)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase">Start date</p>
                        <p className="font-medium">{dateFormatter.format(new Date(employee.startDate))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase">End date</p>
                        <p className="font-medium">
                          {employee.endDate ? dateFormatter.format(new Date(employee.endDate)) : "—"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold">Notes</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {employee.fullName} is a valued team member contributing to {employee.department ?? "the team"}.
                      Schedule regular check-ins to ensure alignment on goals, career development, and overall wellbeing.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-semibold">Recent activity</h3>
                    <div className="mt-3 space-y-4">
                      {RECENT_ACTIVITY.map((item) => (
                        <div key={item.title} className="rounded-lg border border-border/60 p-4 transition hover:border-primary/40">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium leading-tight">{item.title}</p>
                            <span className="text-muted-foreground text-xs">{item.timestamp}</span>
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="border-t bg-card px-6 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => onEdit(employee)}>
                    <UserCircle className="mr-2 size-4" aria-hidden="true" />
                    Edit Employee
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(employee)}
                    className="sm:justify-end"
                  >
                    <Trash2 className="mr-2 size-4" aria-hidden="true" />
                    Delete Employee
                  </Button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

