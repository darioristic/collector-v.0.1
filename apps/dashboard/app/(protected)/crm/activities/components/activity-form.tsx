"use client";

import type {
  Activity,
  ActivityCreateInput,
  ActivityPriority,
  ActivityStatus,
  ActivityType
} from "@crm/types";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DateTimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  ACTIVITY_PRIORITY_LABEL,
  ACTIVITY_PRIORITY_OPTIONS,
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_STATUS_OPTIONS,
  ACTIVITY_TYPE_LABEL,
  ACTIVITY_TYPE_OPTIONS
} from "../constants";

type Option = {
  id: string;
  name: string;
  email?: string | null;
};

const activityTypeEnum = z.enum([...ACTIVITY_TYPE_OPTIONS.map((option) => option.value)] as [
  ActivityType,
  ...ActivityType[]
]);

const activityStatusEnum = z.enum([...ACTIVITY_STATUS_OPTIONS.map((option) => option.value)] as [
  ActivityStatus,
  ...ActivityStatus[]
]);

const activityPriorityEnum = z.enum([
  ...ACTIVITY_PRIORITY_OPTIONS.map((option) => option.value)
] as [ActivityPriority, ...ActivityPriority[]]);

const activityFormSchema = z.object({
  title: z.string().trim().min(2, "Meeting name is required."),
  description: z
    .string()
    .max(200, "Description should not exceed 200 characters.")
    .optional()
    .or(z.literal("")),
  locationPreference: z.enum(["remote", "onsite"]),
  eventDuration: z.number().min(1, "Event duration is required."),
  durationUnit: z.enum(["minutes", "hours"]),
  timezone: z.string().min(1, "Timezone is required."),
  sendToEmail: z.boolean(),
  clientId: z.string().min(1, "Select a client."),
  assignedTo: z.string().min(1, "Choose a team member."),
  type: activityTypeEnum,
  dueDate: z.date({ required_error: "Select a due date and time." }),
  status: activityStatusEnum,
  priority: activityPriorityEnum,
  notes: z
    .string()
    .max(1000, "Notes should not exceed 1000 characters.")
    .optional()
    .or(z.literal(""))
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export interface ActivityFormProps {
  initialActivity?: Activity;
  clients: Option[];
  assignees: Option[];
  defaultDueDate?: string;
  isSubmitting?: boolean;
  onSubmit: (values: ActivityCreateInput) => Promise<void>;
  onCancel?: () => void;
}

const getTimezones = () => {
  try {
    const timezones = Intl.supportedValuesOf("timeZone");
    return timezones
      .map((tz) => {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          timeZoneName: "longOffset"
        });
        const parts = formatter.formatToParts(date);
        const offsetPart = parts.find((part) => part.type === "timeZoneName");
        const offset = offsetPart?.value || "";

        // Format timezone name nicely
        const tzName = tz
          .split("/")
          .map((part) => part.replace(/_/g, " "))
          .join(" - ");

        return {
          value: tz,
          label: offset ? `(${offset}) ${tzName}` : tzName
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    // Fallback za starije browsere
    return [
      { value: "America/New_York", label: "(UTC-05:00) America - New York" },
      { value: "America/Chicago", label: "(UTC-06:00) America - Chicago" },
      { value: "America/Denver", label: "(UTC-07:00) America - Denver" },
      { value: "America/Los_Angeles", label: "(UTC-08:00) America - Los Angeles" },
      { value: "Europe/London", label: "(UTC+00:00) Europe - London" },
      { value: "Europe/Paris", label: "(UTC+01:00) Europe - Paris" },
      { value: "Asia/Jakarta", label: "(UTC+07:00) Asia - Jakarta" },
      { value: "Asia/Tokyo", label: "(UTC+09:00) Asia - Tokyo" }
    ];
  }
};

export function ActivityForm({
  initialActivity,
  clients,
  assignees,
  defaultDueDate,
  isSubmitting,
  onSubmit,
  onCancel
}: ActivityFormProps) {
  const fallbackDueDate = React.useMemo(() => {
    if (initialActivity) {
      return new Date(initialActivity.dueDate);
    }

    if (defaultDueDate) {
      return new Date(defaultDueDate);
    }

    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  }, [initialActivity, defaultDueDate]);

  const timezones = React.useMemo(() => getTimezones(), []);
  const defaultTimezone = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Asia/Jakarta";
    }
  }, []);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: initialActivity?.title ?? "",
      description: "",
      locationPreference: "onsite",
      eventDuration: 40,
      durationUnit: "minutes",
      timezone: defaultTimezone,
      sendToEmail: true,
      clientId: initialActivity?.clientId ?? clients[0]?.id ?? "",
      assignedTo: initialActivity?.assignedTo ?? assignees[0]?.id ?? "",
      type: initialActivity?.type ?? ACTIVITY_TYPE_OPTIONS[0]?.value ?? "call",
      dueDate: fallbackDueDate,
      status: initialActivity?.status ?? ACTIVITY_STATUS_OPTIONS[0]?.value ?? "scheduled",
      priority: initialActivity?.priority ?? ACTIVITY_PRIORITY_OPTIONS[1]?.value ?? "medium",
      notes: initialActivity?.notes ?? ""
    }
  });

  React.useEffect(() => {
    if (!initialActivity && !form.getValues("assignedTo") && assignees.length > 0) {
      form.setValue("assignedTo", assignees[0]?.id ?? "");
    }
  }, [assignees, form, initialActivity]);

  const descriptionLength = form.watch("description")?.length ?? 0;
  const remoteId = React.useId();
  const onsiteId = React.useId();

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: ActivityCreateInput = {
      title: values.title.trim(),
      clientId: values.clientId,
      assignedTo: values.assignedTo,
      type: values.type,
      dueDate: values.dueDate.toISOString(),
      status: values.status,
      priority: values.priority,
      notes: values.notes?.trim() ? values.notes.trim() : undefined
    };

    await onSubmit(payload);
  });

  const handleSaveDraft = () => {
    // Save as draft logic - for now just close
    onCancel?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting name</FormLabel>
              <FormControl>
                <Input placeholder='e.g., "Socialize Flow Change"' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Add meeting description"
                    className="min-h-[100px] resize-none pr-16"
                    {...field}
                  />
                  <div className="text-muted-foreground absolute right-3 bottom-3 flex items-center gap-1 text-xs">
                    <span>{descriptionLength}/200</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="locationPreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location preference - Meeting</FormLabel>
              <FormDescription>
                Select if required should be onsite or remote meeting.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remote" id={remoteId} />
                    <Label htmlFor={remoteId} className="cursor-pointer">
                      Remote
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="onsite" id={onsiteId} />
                    <Label htmlFor={onsiteId} className="cursor-pointer">
                      Onsite
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Duration</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="flex-1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                  <FormField
                    control={form.control}
                    name="durationUnit"
                    render={({ field: unitField }) => (
                      <Select onValueChange={unitField.onChange} value={unitField.value}>
                        <FormControl>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </FormControl>
              <FormDescription>Set maximum time using each apps for a day</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                Timezone
                <Info className="text-muted-foreground h-3.5 w-3.5" />
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden fields for backend - not shown in UI */}
        <div className="hidden">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={clients.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={assignees.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {ACTIVITY_TYPE_LABEL[option.value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DateTimePicker date={field.value} setDate={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {ACTIVITY_STATUS_LABEL[option.value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {ACTIVITY_PRIORITY_LABEL[option.value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <FormField
            control={form.control}
            name="sendToEmail"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer" style={{ marginTop: 0 }}>
                  Send Also to Email
                </FormLabel>
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}>
              Save as draft
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Send invitation
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
