"use client";

import * as React from "react";
import type { Deal } from "@/lib/db/schema/deals";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEAL_STAGES, type DealStage } from "../constants";
import { dealFormSchema, type DealFormInput, type DealFormValues } from "../schemas";
import type { ModalMode } from "../store";

interface DealModalProps {
  isOpen: boolean;
  mode: ModalMode;
  deal: Deal | null;
  owners: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: DealFormValues) => void;
}

const toDateInputValue = (value?: Date | string | null) => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0] ?? "";
};

const getDefaultValues = (deal: Deal | null, owners: string[]): DealFormInput => ({
  title: deal?.title ?? "",
  company: deal?.company ?? "",
  owner: deal?.owner ?? owners[0] ?? "",
  stage: (deal?.stage as DealStage) ?? DEAL_STAGES[0],
  value: deal?.value ?? 0,
  closeDate: toDateInputValue(deal?.closeDate),
  notes: deal?.notes ?? "",
});

export default function DealModal({
  isOpen,
  mode,
  deal,
  owners,
  isSubmitting,
  onClose,
  onSubmit,
}: DealModalProps) {
  const form = useForm<DealFormInput>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: getDefaultValues(deal, owners),
  });

  React.useEffect(() => {
    form.reset(getDefaultValues(deal, owners));
  }, [deal, owners, form]);

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = dealFormSchema.parse(values);
    onSubmit(parsed);
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Deal" : "Edit Deal"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Capture deal details to add it to your sales pipeline."
              : "Update the deal information below and save your changes."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Deal name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enterprise CRM roll-out" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-label="Owner">
                          <SelectValue placeholder="Assign owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {owners.length === 0 ? (
                            <SelectItem value="">No owners available</SelectItem>
                          ) : null}
                          {owners.map((owner) => (
                            <SelectItem key={owner} value={owner}>
                              {owner}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-label="Stage">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEAL_STAGES.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              {stage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="100"
                        placeholder="50000"
                        {...field}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Close date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={toDateInputValue(field.value)}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add context, next steps, or notes about this opportunity."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={onClose} className="sm:order-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="sm:order-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : mode === "create" ? (
                  "Create deal"
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

