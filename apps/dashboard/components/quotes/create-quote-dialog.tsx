"use client";

import { useEffect, useId, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import type { QuoteItemCreateInput } from "@crm/types";
import { QUOTE_STATUSES } from "@crm/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useContacts } from "@/src/hooks/useContacts";
import { useCreateQuote } from "@/src/hooks/useQuotes";
import { CompanyAutocomplete } from "@/components/forms/CompanyAutocomplete";
import { QuoteItemsTable } from "./QuoteItemsTable";
import { QuoteTotals } from "./QuoteTotals";

type CreateQuoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  contactId?: string;
};

type QuoteFormData = {
  quoteNumber: string;
  companyId: string;
  contactId: string;
  issueDate: string;
  expiryDate: string;
  currency: string;
  status: string;
  notes: string;
  items: QuoteItemCreateInput[];
};

export function CreateQuoteDialog({
  open,
  onOpenChange,
  companyId = "",
  contactId = ""
}: CreateQuoteDialogProps) {
  const quoteNumberId = useId();
  const currencyId = useId();
  const statusId = useId();
  const contactIdFieldId = useId();
  const notesId = useId();

  const [quoteNumber] = useState(() => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `QUO-${year}-${random}`;
  });

  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [expiryDateOpen, setExpiryDateOpen] = useState(false);

  const methods = useForm<QuoteFormData>({
    defaultValues: {
      quoteNumber,
      companyId,
      contactId,
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      currency: "EUR",
      status: "draft",
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }]
    }
  });

  const { register, handleSubmit, control, watch, reset, setValue } = methods;

  useEffect(() => {
    setValue("quoteNumber", quoteNumber);
  }, [quoteNumber, setValue]);

  const createQuoteMutation = useCreateQuote();
  const { toast } = useToast();
  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts();

  useEffect(() => {
    if (!open) {
      reset({
        quoteNumber: "",
        companyId,
        contactId,
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
        currency: "EUR",
        status: "draft",
        notes: "",
        items: [{ description: "", quantity: 1, unitPrice: 0 }]
      });
    }
  }, [open, reset, companyId, contactId]);

  const onSubmit = async (data: QuoteFormData) => {
    const validItems = data.items.filter(
      (item) => item.description || item.productId || item.unitPrice > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the quote",
        variant: "destructive"
      });
      return;
    }

    try {
      await createQuoteMutation.mutateAsync({
        quoteNumber: data.quoteNumber,
        companyId: data.companyId || undefined,
        contactId: data.contactId || undefined,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate || undefined,
        currency: data.currency,
        status: data.status,
        notes: data.notes || undefined,
        items: validItems
      });

      toast({
        title: "Success",
        description: "Quote created successfully!"
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create quote",
        variant: "destructive"
      });
    }
  };

  const selectedCompanyId = watch("companyId");
  const filteredContacts = contacts.filter(
    (contact) => !selectedCompanyId || contact.accountId === selectedCompanyId
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 md:w-[calc(50vw)] md:max-w-[900px] [&>button]:hidden">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader className="shrink-0 px-6 py-4">
              <SheetTitle>Create New Quote</SheetTitle>
              <SheetDescription>
                Create a new quote with line items. Totals will be calculated automatically.
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <div className="grid gap-6 py-6 lg:grid-cols-2">
                {/* Left Column: Quote Info & Client */}
                <div className="space-y-6">
                  {/* Quote Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quote Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor={quoteNumberId}>
                          Quote Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={quoteNumberId}
                          value={quoteNumber}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor={currencyId}>Currency</Label>
                          <Select
                            defaultValue="EUR"
                            onValueChange={(value) => {
                              setValue("currency", value);
                            }}>
                            <SelectTrigger id={currencyId}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={statusId}>Status</Label>
                          <Select
                            defaultValue="draft"
                            onValueChange={(value) => {
                              setValue("status", value);
                            }}>
                            <SelectTrigger id={statusId}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUOTE_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="issueDate">Issue Date</Label>
                          <Popover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !watch("issueDate") && "text-muted-foreground"
                                )}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {watch("issueDate") ? (
                                  format(new Date(watch("issueDate")), "dd.MM.yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={
                                  watch("issueDate") ? new Date(watch("issueDate")) : undefined
                                }
                                onSelect={(date) => {
                                  if (date) {
                                    setValue("issueDate", date.toISOString().split("T")[0]);
                                    setIssueDateOpen(false);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Popover open={expiryDateOpen} onOpenChange={setExpiryDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !watch("expiryDate") && "text-muted-foreground"
                                )}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {watch("expiryDate") ? (
                                  format(new Date(watch("expiryDate")), "dd.MM.yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={
                                  watch("expiryDate") ? new Date(watch("expiryDate")) : undefined
                                }
                                onSelect={(date) => {
                                  if (date) {
                                    setValue("expiryDate", date.toISOString().split("T")[0]);
                                    setExpiryDateOpen(false);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Company</Label>
                        <CompanyAutocomplete
                          control={control}
                          name="companyId"
                          onChange={(value) => {
                            setValue("companyId", value);
                            setValue("contactId", "");
                          }}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={contactIdFieldId}>Contact</Label>
                        <Select
                          value={watch("contactId") || undefined}
                          onValueChange={(value) => {
                            setValue("contactId", value);
                          }}
                          disabled={!selectedCompanyId}>
                          <SelectTrigger id={contactIdFieldId}>
                            <SelectValue
                              placeholder={
                                selectedCompanyId
                                  ? "Select contact (optional)"
                                  : "Select company first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingContacts ? (
                              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                                Loading...
                              </div>
                            ) : (
                              filteredContacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.name}{" "}
                                  {contact.accountName ? `(${contact.accountName})` : ""}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Items, Totals, Notes */}
                <div className="space-y-6">
                  {/* Items Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Items <span className="text-destructive">*</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <QuoteItemsTable control={control} />
                    </CardContent>
                  </Card>

                  {/* Totals Card - Sticky */}
                  <div className="sticky top-6">
                    <QuoteTotals control={control} />
                  </div>

                  {/* Notes Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <Textarea
                          id={notesId}
                          placeholder="Add any additional notes..."
                          rows={4}
                          {...register("notes")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <Separator className="shrink-0" />

            <SheetFooter className="flex shrink-0 justify-end gap-2 px-6 py-4">
              <SheetClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={createQuoteMutation.isPending}>
                {createQuoteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Quote"
                )}
              </Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
