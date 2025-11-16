"use client";

import type { Account, AccountAddress, InvoiceCreateInput } from "@crm/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Package,
  Loader2,
  Search,
  Pencil
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CompanyAutocomplete } from "@/components/forms/CompanyAutocomplete";
import { CompanyEditModal } from "@/components/forms/CompanyEditModal";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap/minimal-tiptap";
import type { Content } from "@tiptap/react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useCreateInvoice } from "@/src/hooks/useInvoices";
import { ensureResponse } from "@/src/lib/fetch-utils";

const invoiceItemSchema = z.object({
  description: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.string().optional(),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  discountRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional()
});

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  billingAddress: z.string().optional(),
  issuedAt: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  status: z.string().min(1, "Status is required"),
  notes: z.any().optional(), // JSON content from Tiptap editor
  items: z.array(invoiceItemSchema).min(1, "At least one item is required")
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price?: number | string | null;
  currency?: string | null;
  description?: string | null;
};

async function searchProducts(query: string): Promise<Product[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Clean query string - remove any SQL wildcards that might cause issues
  // The backend will add wildcards appropriately
  const cleanedQuery = trimmed.replace(/[%_]/g, "").slice(0, 255);

  const params = new URLSearchParams({
    search: cleanedQuery,
    limit: "10"
  });

  try {
    const response = await ensureResponse(
      fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      })
    );

    const data = (await response.json()) as { data: unknown };
    const rawData = (data as { data?: unknown }).data;
    const rawList: unknown[] = Array.isArray(rawData) ? rawData : [];

    return rawList.map((item) => {
      const p = item as Partial<Product>;
      return {
        id: String(p.id ?? ""),
        name: String(p.name ?? ""),
        sku: p.sku ?? null,
        price: p.price ?? null,
        currency: p.currency ?? null,
        description: p.description ?? null
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function createProduct(data: {
  name: string;
  sku: string;
  price: number;
  currency: string;
  description?: string;
}): Promise<Product> {
  const response = await ensureResponse(
    fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        sku: data.sku,
        price: data.price,
        currency: data.currency,
        description: data.description || null,
        active: true
      })
    })
  );

  const result = (await response.json()) as { data: unknown };
  const p = (result.data || {}) as Partial<Product>;

  return {
    id: String(p.id ?? ""),
    name: String(p.name ?? ""),
    sku: p.sku ?? null,
    price: typeof p.price === "number" ? p.price : Number.parseFloat(String(p.price ?? 0)) || 0,
    currency: p.currency ?? data.currency,
    description: p.description ?? null
  };
}

// Intelligent parser for pasted text in description field
function parsePastedDescription(text: string): string {
  if (!text) return "";

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return "";

  // If single line, return as is
  if (lines.length === 1) return lines[0];

  // Meta-information patterns to ignore
  const metaPatterns = [
    /^(SLA|End Customer|Contract number|Validity|Service dates|Account number|User|TBD)[:]/i,
    /^(\d{3}-\d{6,})$/i, // Standalone numbers like "874-007951"
    /^TBD$/i,
    /^\d+\s*(Year|Years|Month|Months|Day|Days)$/i,
    /^(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)\s*\(\d+\)/i,
    /^.*\s*from the manufacturer\.?$/i // "One (1) year, Priority level of support from the manufacturer."
  ];

  // Filter out meta-information lines
  const contentLines = lines.filter((line) => {
    return !metaPatterns.some((pattern) => pattern.test(line));
  });

  // If no content lines after filtering, use first non-empty line
  if (contentLines.length === 0) {
    return lines[0];
  }

  // Find short title line (like "IT support services") - this is usually the main product name
  const titleLine = contentLines.find(
    (line) =>
      line.length <= 80 &&
      line.length >= 3 &&
      !/^(SLA|End Customer|Contract|Validity|Service|Account|User|TBD|SUSE|Linux|Enterprise|Server|Application)/i.test(
        line
      ) &&
      !/(x86|Sockets|Priority|Virtual|SAP Applications)/i.test(line)
  );

  // Find lines that look like detailed product descriptions (contain technical terms, longer lines)
  const productLines = contentLines.filter((line) => {
    const hasTechnicalTerms =
      /(Server|Application|Enterprise|Support|Service|Priority|Virtual|Sockets|x86|Linux|SAP)/i.test(
        line
      );
    const isLongEnough = line.length > 40;
    return hasTechnicalTerms || isLongEnough;
  });

  // If we found a title line, use it (it's the main product name)
  if (titleLine) {
    return titleLine;
  }

  // If we found product-like lines, extract just the product name part (before technical details)
  if (productLines.length > 0) {
    const longestProductLine = productLines.reduce((longest, current) => {
      return current.length > longest.length ? current : longest;
    }, productLines[0]);

    // Try to extract main product name (before commas with technical details)
    // Example: "SUSE Linux Enterprise Server for SAP Applications" instead of full line
    const mainProductMatch = longestProductLine.match(/^([^,]+(?:\s+for\s+[^,]+)?)/i);
    if (
      mainProductMatch &&
      mainProductMatch[1].trim().length > 10 &&
      mainProductMatch[1].trim().length < 100
    ) {
      return mainProductMatch[1].trim();
    }

    // If no good match, use first 80 characters of the longest line
    return longestProductLine.length > 80
      ? longestProductLine.substring(0, 77) + "..."
      : longestProductLine;
  }

  // Find the longest meaningful line (likely the main description)
  const longestLine = contentLines.reduce((longest, current) => {
    return current.length > longest.length ? current : longest;
  }, contentLines[0]);

  // If longest line is too long, truncate it
  if (longestLine.length > 100) {
    return longestLine.substring(0, 97) + "...";
  }

  // Otherwise, use first meaningful line (up to 2 lines combined, but prefer first)
  if (contentLines.length > 1 && contentLines[0].length < 60) {
    const combined = contentLines.slice(0, 2).join(" - ");
    return combined.length > 100 ? combined.substring(0, 97) + "..." : combined;
  }

  return longestLine;
}

function DescriptionAutocomplete({
  value,
  onChange,
  onBlur,
  index,
  currency,
  onProductSelect
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  index: number;
  currency?: string;
  onProductSelect?: (product: Product) => void;
}) {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "description", query, index],
    queryFn: () => searchProducts(query),
    enabled: query.trim().length >= 2 && isOpen,
    staleTime: 1000 * 60 * 5
  });

  const handleSelect = (product: Product | string) => {
    if (typeof product === "string") {
      setQuery(product);
      onChange(product);
    } else {
      setQuery(product.name);
      onChange(product.name);
      onProductSelect?.(product);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Removed automatic product creation - products will be created only when
  // all required fields (name, price, VAT) are filled

  const suggestions = useMemo(() => {
    return products.map((p) => p.name);
  }, [products]);

  const trimmedQuery = query.trim();

  // Sort and prioritize results based on relevance
  const sortedProducts = useMemo(() => {
    if (!products.length || !trimmedQuery) return products;

    const queryLower = trimmedQuery.toLowerCase();

    return [...products].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact match gets highest priority
      if (aName === queryLower) return -1;
      if (bName === queryLower) return 1;

      // Starts with query gets second priority
      const aStarts = aName.startsWith(queryLower);
      const bStarts = bName.startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Contains query gets third priority
      const aContains = aName.includes(queryLower);
      const bContains = bName.includes(queryLower);
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;

      // Then sort by name length (shorter first)
      return aName.length - bName.length;
    });
  }, [products, trimmedQuery]);

  const hasResults = sortedProducts.length > 0;

  // Should show create option only if:
  // 1. User has typed at least 3 characters
  // 2. No results found
  // 3. Not currently loading
  const shouldShowCreateProduct = trimmedQuery.length >= 3 && !hasResults && !isLoading;

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setIsOpen(newValue.trim().length > 0);
    setSelectedIndex(-1);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Preserve pasted content including newlines
    // Let browser insert it, then sync value in next tick
    setTimeout(() => {
      const value = e.currentTarget.value;
      setQuery(value);
      onChange(value);
      setIsOpen(value.trim().length > 0);
      setSelectedIndex(-1);
    }, 0);
  };

  const handleInputFocus = () => {
    if (query.trim().length > 0) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen) {
      // Allow Enter to create new line in textarea when suggestions are closed
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="text-muted-foreground/60 absolute top-2 left-3 h-3.5 w-3.5" />
        <textarea
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onFocus={handleInputFocus}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              onBlur?.();
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Item description"
          rows={2}
          className="border-border/60 bg-background resize-none rounded-md border py-1.5 pr-3 pl-9 font-mono text-sm leading-4 whitespace-pre-wrap"
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = `${t.scrollHeight}px`;
          }}
          autoComplete="off"
        />
      </div>
      {isOpen && (
        <div
          className="border-border/80 bg-popover absolute left-0 z-50 mt-1.5 rounded-lg border shadow-2xl backdrop-blur-md"
          style={{ width: "68%", minWidth: "550px", maxWidth: "calc(100vw - 4rem)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-8">
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              <span className="text-muted-foreground ml-2.5 text-sm">Searching...</span>
            </div>
          ) : hasResults ? (
            <div className="max-h-64 overflow-y-auto py-1.5">
              <div className="px-2 pt-1 pb-1.5">
                <span className="text-foreground/90 text-xs font-semibold">
                  Found {sortedProducts.length}{" "}
                  {sortedProducts.length === 1 ? "product" : "products"}
                </span>
              </div>
              {sortedProducts.map((product, idx) => {
                const price =
                  typeof product.price === "number"
                    ? product.price
                    : product.price
                      ? Number.parseFloat(String(product.price)) || 0
                      : 0;
                const displayCurrency = product.currency || currency || "EUR";

                // Highlight matching text
                const highlightMatch = (text: string, query: string) => {
                  if (!query || !text) return text;
                  const parts = text.split(
                    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
                  );
                  return parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                      <mark
                        key={`${part}-${i}`}
                        className="bg-primary/20 text-primary rounded px-0.5 font-medium">
                        {part}
                      </mark>
                    ) : (
                      <span key={`${part}-${i}`}>{part}</span>
                    )
                  );
                };

                return (
                  <button
                    key={product.id || product.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(product);
                    }}
                    className={cn(
                      "mx-1 w-full rounded-lg px-4 py-3 text-left transition-all duration-150",
                      "hover:bg-accent hover:shadow-sm",
                      "focus:bg-accent focus:ring-primary/20 focus:ring-2 focus:outline-none",
                      selectedIndex === idx && "bg-accent ring-primary/20 shadow-sm ring-2"
                    )}
                    onMouseEnter={() => setSelectedIndex(idx)}>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="text-foreground line-clamp-1 truncate text-sm leading-snug font-semibold">
                        {highlightMatch(product.name, trimmedQuery)}
                      </div>
                      {(product.sku || product.description || price > 0) && (
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {price > 0 && (
                              <div className="text-foreground text-xs font-bold whitespace-nowrap">
                                {formatCurrency(price, displayCurrency)}
                              </div>
                            )}
                            {product.sku && (
                              <div className="text-foreground/80 font-mono text-xs font-medium">
                                SKU: {product.sku}
                              </div>
                            )}
                          </div>
                          {product.description && (
                            <div className="text-foreground/70 line-clamp-2 text-xs leading-relaxed">
                              {product.description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : shouldShowCreateProduct ? (
            <div className="px-3 py-3">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(trimmedQuery);
                  setIsOpen(false);
                }}
                className="border-primary/40 from-primary/5 to-primary/10 hover:border-primary/60 hover:from-primary/10 hover:to-primary/15 focus:ring-primary/30 active:from-primary/15 active:to-primary/20 w-full rounded-lg border-2 border-dashed bg-linear-to-r p-4 text-left transition-all duration-200 hover:shadow-md focus:ring-2 focus:outline-none">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 ring-primary/30 mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg ring-2">
                    <Plus className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
                    <div className="text-primary line-clamp-2 text-sm leading-tight font-bold wrap-break-word">
                      Create "{trimmedQuery}"
                    </div>
                    <span className="text-muted-foreground/80 text-xs leading-relaxed">
                      Add new product to database • Product will be saved when invoice is created
                    </span>
                  </div>
                </div>
              </button>
            </div>
          ) : trimmedQuery.length > 0 && trimmedQuery.length < 3 ? (
            <div className="px-4 py-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                  <Search className="text-muted-foreground/60 h-5 w-5" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">
                  Type at least 3 characters
                </p>
                <p className="text-muted-foreground/70 text-xs">to search for products</p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                  <Package className="text-muted-foreground/60 h-5 w-5" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">No products found</p>
                <p className="text-muted-foreground/70 text-xs">
                  Try a different search term or create a new product
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const getCountryName = (code: string | null | undefined): string => {
  if (!code) return "—";

  const countryMap: Record<string, string> = {
    RS: "Serbia",
    US: "United States",
    GB: "United Kingdom",
    DE: "Germany",
    FR: "France",
    IT: "Italy",
    ES: "Spain",
    NL: "Netherlands",
    BE: "Belgium",
    CH: "Switzerland",
    AT: "Austria",
    PL: "Poland",
    HR: "Croatia",
    BA: "Bosnia and Herzegovina",
    ME: "Montenegro",
    MK: "North Macedonia",
    SI: "Slovenia",
    HU: "Hungary",
    RO: "Romania",
    BG: "Bulgaria",
    GR: "Greece",
    TR: "Turkey"
  };

  return countryMap[code.toUpperCase()] || code;
};

type AccountWithDetails = {
  account: Account;
  addresses: AccountAddress[];
  contacts: unknown[];
  executives: unknown[];
  milestones: unknown[];
};

async function fetchAccount(id: string): Promise<AccountWithDetails> {
  const response = await ensureResponse(
    fetch(`/api/accounts/${id}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    })
  );
  const payload = (await response.json()) as AccountWithDetails;
  return payload;
}

type CreateInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  context?: "invoice" | "offer";
};

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess, context = "invoice" }: CreateInvoiceDialogProps) {
  const { toast } = useToast();
  const createInvoiceMutation = useCreateInvoice();

  const [invoiceNumber] = useState(() => {
    const year = new Date().getFullYear();
    return `INV-${year}-000`;
  });

  const [issuedDateOpen, setIssuedDateOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine default currency based on browser locale
  const getDefaultCurrency = () => {
    if (typeof window === "undefined") return "EUR";
    const browserLocale = navigator.language || navigator.languages?.[0] || "en-US";
    const localeCountry = browserLocale.split("-")[1]?.toUpperCase();

    if (
      browserLocale.toLowerCase().includes("rs") ||
      browserLocale.toLowerCase().includes("sr") ||
      localeCountry === "RS"
    ) {
      return "RSD";
    }
    return "EUR";
  };

  const methods = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber,
      customerId: "",
      customerName: "",
      customerEmail: "",
      billingAddress: "",
      issuedAt: new Date().toISOString().split("T")[0],
      dueDate: (() => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        return dueDate.toISOString().split("T")[0];
      })(),
      currency: "EUR",
      status: "draft",
      notes: undefined,
      items: [
        {
          description: "",
          quantity: 1,
          unit: "",
          unitPrice: 0,
          discountRate: 0,
          vatRate: 0
        }
      ]
    }
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = methods;

  const selectedCustomerId = watch("customerId");
  const selectedCurrency = watch("currency");
  const selectedStatus = watch("status");
  const issuedAt = watch("issuedAt");
  // Use useWatch to ensure real-time updates trigger recalculation
  const items = useWatch({ control, name: "items" });

  // Get badge variant based on invoice status
  const getStatusBadgeVariant = (status: string): BadgeProps["variant"] => {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
        return "info";
      case "paid":
        return "success";
      case "overdue":
        return "warning";
      case "void":
        return "destructive";
      case "unpaid":
        return "warning";
      default:
        return "outline";
    }
  };

  // Automatically set due date to 30 days after issued date
  useEffect(() => {
    if (issuedAt) {
      const issuedDate = new Date(issuedAt);
      const dueDateValue = new Date(issuedDate);
      dueDateValue.setDate(issuedDate.getDate() + 30);
      const dueDateString = dueDateValue.toISOString().split("T")[0];
      setValue("dueDate", dueDateString);
    }
  }, [issuedAt, setValue]);

  const { fields, append } = useFieldArray({
    control,
    name: "items"
  });

  const { data: customerData, isLoading: isCustomerLoading } = useQuery({
    queryKey: ["account", selectedCustomerId],
    queryFn: () => fetchAccount(selectedCustomerId),
    enabled: !!selectedCustomerId
  });

  const customer = customerData?.account;
  const primaryAddress =
    customerData?.addresses?.find((addr) => addr.label === "primary" || addr.label === "billing") ||
    customerData?.addresses?.[0];

  const queryClient = useQueryClient();

  const handleCompanyUpdated = (updatedCompany: Account) => {
    // Invalidate query to refresh customer data
    queryClient.invalidateQueries({ queryKey: ["account", selectedCustomerId] });
    // Update form values with new data
    setValue("customerName", updatedCompany.name);
    setValue("customerEmail", updatedCompany.email || "");
  };

  // Debug logging
  useEffect(() => {
    if (customerData) {
      console.log("Customer Data:", {
        account: customerData.account,
        addresses: customerData.addresses,
        registrationNumber: customerData.account?.registrationNumber,
        primaryAddress: primaryAddress
      });
    }
  }, [customerData, primaryAddress]);

  // Auto-detect currency based on customer country or browser locale
  useEffect(() => {
    if (customer && primaryAddress?.country) {
      setValue("customerName", customer.name);
      setValue("customerEmail", customer.email || "");

      // Format address from account addresses
      const addressParts = [
        primaryAddress.street,
        primaryAddress.city,
        primaryAddress.state,
        primaryAddress.postalCode
      ].filter(Boolean);
      if (addressParts.length > 0) {
        setValue("billingAddress", addressParts.join(", "));
      }

      // Auto-set currency based on customer country
      if (primaryAddress.country === "RS" || primaryAddress.country === "rs") {
        setValue("currency", "RSD");
      }
    } else if (customer) {
      setValue("customerName", customer.name);
      setValue("customerEmail", customer.email || "");

      if (primaryAddress) {
        const addressParts = [
          primaryAddress.street,
          primaryAddress.city,
          primaryAddress.state,
          primaryAddress.postalCode
        ].filter(Boolean);
        if (addressParts.length > 0) {
          setValue("billingAddress", addressParts.join(", "));
        }
      }
    }
  }, [customer, primaryAddress, setValue]);

  useEffect(() => {
    if (open) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const newInvoiceNumber = `INV-${year}-${random}`;
      const initialCurrency = getDefaultCurrency();

      reset({
        invoiceNumber: newInvoiceNumber,
        customerId: "",
        customerName: "",
        customerEmail: "",
        billingAddress: "",
        issuedAt: new Date().toISOString().split("T")[0],
        dueDate: (() => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);
          return dueDate.toISOString().split("T")[0];
        })(),
        currency: initialCurrency,
        status: "draft",
        notes: undefined,
        items: [
          {
            description: "",
            quantity: 1,
            unit: "",
            unitPrice: 0,
            discountRate: 0,
            vatRate: 0
          }
        ]
      });
    }
  }, [open, reset]);

  const totals = useMemo(() => {
    // Use items from useWatch which automatically triggers recalculation
    const currentItems = items;
    if (!currentItems || !Array.isArray(currentItems) || currentItems.length === 0) {
      return {
        amountBeforeDiscount: 0,
        discountTotal: 0,
        subtotal: 0,
        totalVat: 0,
        total: 0,
        averageVatRate: 0
      };
    }

    const amountBeforeDiscount = currentItems.reduce((sum, item) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      return sum + qty * price;
    }, 0);

    const discountTotal = currentItems.reduce((sum, item) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      const discountRate = Number(item?.discountRate) || 0;
      const itemTotal = qty * price;
      const discount = itemTotal * (discountRate / 100);
      return sum + discount;
    }, 0);

    const subtotal = amountBeforeDiscount - discountTotal;

    const totalVat = currentItems.reduce((sum, item) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      const discountRate = Number(item?.discountRate) || 0;
      const vatRate = Number(item?.vatRate) || 0;
      const itemTotal = qty * price;
      const discount = itemTotal * (discountRate / 100);
      const itemSubtotal = itemTotal - discount;
      const vat = itemSubtotal * (vatRate / 100);
      return sum + vat;
    }, 0);

    const total = subtotal + totalVat;

    // Calculate average VAT rate (weighted by subtotal amount)
    const itemsWithSubtotal = currentItems.filter((item) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      const vatRate = Number(item?.vatRate) || 0;
      return qty > 0 && price > 0 && vatRate > 0;
    });
    let averageVatRate = 0;
    if (itemsWithSubtotal.length > 0 && subtotal > 0) {
      const weightedSum = itemsWithSubtotal.reduce((sum, item) => {
        const qty = Number(item?.quantity) || 0;
        const price = Number(item?.unitPrice) || 0;
        const discountRate = Number(item?.discountRate) || 0;
        const vatRate = Number(item?.vatRate) || 0;
        const itemTotal = qty * price;
        const discount = itemTotal * (discountRate / 100);
        const itemSubtotal = itemTotal - discount;
        return sum + vatRate * itemSubtotal;
      }, 0);
      averageVatRate = weightedSum / subtotal;
    }

    return {
      amountBeforeDiscount: Math.round(amountBeforeDiscount * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      totalVat: Math.round(totalVat * 100) / 100,
      total: Math.round(total * 100) / 100,
      averageVatRate: Math.round(averageVatRate * 100) / 100
    };
  }, [items]);

  const onSubmit = async (data: InvoiceFormData) => {
    const validItems = data.items.filter(
      (item) => (item.description && item.description.trim()) || item.unitPrice > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item with description or unit price.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create products for items that have all required fields: name, price > 0, and VAT > 0
      const productCreationPromises = validItems
        .filter((item) => {
          const hasName = item.description && item.description.trim().length > 0;
          const hasPrice = Number(item.unitPrice) > 0;
          const hasVat = Number(item.vatRate) > 0;
          return hasName && hasPrice && hasVat;
        })
        .map(async (item) => {
          try {
            // Check if product already exists
            const existingProducts = await searchProducts(item.description!.trim());
            const exists = existingProducts.some(
              (p) => p.name.toLowerCase() === item.description!.toLowerCase().trim()
            );

            if (!exists) {
              const sku = `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
              await createProduct({
                name: item.description!.trim(),
                sku,
                price: Number(item.unitPrice),
                currency: data.currency,
                description: undefined
              });
            }
          } catch (error) {
            // Silently fail - don't prevent invoice creation if product creation fails
            console.error("Failed to create product:", error);
          }
        });

      // Wait for all product creations (but don't fail invoice creation if they fail)
      await Promise.allSettled(productCreationPromises);

      // Invalidate products cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["products"] });

      const invoiceData: InvoiceCreateInput = {
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        customerName: (data.customerName && data.customerName.trim()) || customer?.name || "—",
        customerEmail:
          data.customerEmail && data.customerEmail.trim() ? data.customerEmail.trim() : undefined,
        billingAddress:
          data.billingAddress && data.billingAddress.trim()
            ? data.billingAddress.trim()
            : undefined,
        issuedAt: data.issuedAt ? new Date(data.issuedAt).toISOString() : new Date().toISOString(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        currency: data.currency || "EUR",
        status: (data.status as InvoiceCreateInput["status"]) || "draft",
        notes: data.notes
          ? typeof data.notes === "string"
            ? data.notes.trim() || undefined
            : data.notes
          : undefined,
        items: validItems.map((item) => ({
          description:
            item.description && item.description.trim() ? item.description.trim() : undefined,
          quantity: item.quantity,
          unit: item.unit && item.unit.trim() ? item.unit.trim() : undefined,
          unitPrice: Number(item.unitPrice),
          discountRate:
            item.discountRate && item.discountRate > 0 ? Number(item.discountRate) : undefined,
          vatRate: item.vatRate && item.vatRate > 0 ? Number(item.vatRate) : undefined
        }))
      };

      console.log("Creating invoice with data:", JSON.stringify(invoiceData, null, 2));

      await createInvoiceMutation.mutateAsync(invoiceData);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error in onSubmit:", error);
      // Error handling is done in the mutation, but log it here for debugging
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Failed to create invoice",
          description: error.message || "An unexpected error occurred"
        });
      }
    }
  };

  const handleAddItem = () => {
    append({
      description: "",
      quantity: 1,
      unit: "",
      unitPrice: 0,
      discountRate: 0,
      vatRate: 0
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 md:w-[calc(50vw)] md:max-w-[900px] [&>button]:hidden"
          style={{ top: 15, right: 15, bottom: 15 }}>
          <VisuallyHidden>
            <SheetTitle>{context === "offer" ? "Create New Offer" : "Create New Invoice"}</SheetTitle>
            <SheetDescription>
              {context === "offer"
                ? "Fill in the details below to create a new offer."
                : "Fill in the details below to create a new invoice."}
            </SheetDescription>
          </VisuallyHidden>

          <div className="flex h-full flex-col">
            <header className="bg-background sticky top-0 z-10"></header>

            <div className="flex-1 overflow-y-auto px-3 py-3 pb-20">
              <FormProvider {...methods}>
                <form
                  onSubmit={handleSubmit(
                    (data) => {
                      console.log("Form submitted with data:", data);
                      onSubmit(data as InvoiceFormData);
                    },
                    (errors) => {
                      const collect = (obj: unknown): string[] => {
                        const out: string[] = [];
                        const walk = (o: unknown) => {
                          if (!o || typeof o !== "object") return;
                          const objRecord = o as Record<string, unknown>;
                          for (const k of Object.keys(objRecord)) {
                            const v = objRecord[k] as unknown;
                            if (!v) continue;
                            const maybeMessage = (v as { message?: unknown }).message;
                            if (typeof maybeMessage === "string") out.push(maybeMessage);
                            else if (Array.isArray(v)) v.forEach((item) => walk(item));
                            else if (typeof v === "object") walk(v);
                          }
                        };
                        walk(obj);
                        return out;
                      };
                      const messages = collect(errors);
                      if (messages.length > 0) {
                        console.error("Form validation errors:", messages);
                        toast({
                          variant: "destructive",
                          title: "Validation Error",
                          description:
                            messages[0] ?? "Please check all required fields and fix any errors."
                        });
                      }
                    }
                  )}>
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <div className="border-border/60 bg-muted/40 rounded-lg border p-3">
                        <div className="mb-4 space-y-4 pb-4">
                          <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl leading-tight font-semibold">
                              {watch("invoiceNumber")}
                            </h2>
                            <Badge
                              variant={getStatusBadgeVariant(selectedStatus)}
                              className="text-sm font-medium">
                              {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                            <Popover open={issuedDateOpen} onOpenChange={setIssuedDateOpen}>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground text-sm">
                                  {context === "offer" ? "Offered on" : "Issued on"} {formatDate(new Date(issuedAt))}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={issuedAt ? new Date(issuedAt) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      setValue("issuedAt", date.toISOString().split("T")[0]);
                                      setIssuedDateOpen(false);
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <span className="text-muted-foreground text-sm">•</span>
                            {issuedAt && (
                              <span className="text-muted-foreground text-sm">
                                {context === "offer" ? "Valid until" : "Due on"}{" "}
                                {formatDate(
                                  (() => {
                                    const issuedDate = new Date(issuedAt);
                                    const dueDateValue = new Date(issuedDate);
                                    dueDateValue.setDate(issuedDate.getDate() + 30);
                                    return dueDateValue;
                                  })()
                                )}
                              </span>
                            )}
                            <span className="text-muted-foreground text-sm">•</span>
                            <span
                              className="text-muted-foreground text-sm"
                              suppressHydrationWarning>
                              {mounted ? `Updated: ${formatDate(new Date())}` : "Updated:"}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
                                <Building2 className="h-4 w-4" aria-hidden="true" />
                                Customer
                              </div>
                              {!selectedCustomerId ? (
                                <div className="w-full">
                                  <CompanyAutocomplete
                                    control={control}
                                    name="customerId"
                                    onChange={(value) => {
                                      setValue("customerId", value);
                                    }}
                                    placeholder="Search or add company…"
                                  />
                                </div>
                              ) : isCustomerLoading ? (
                                <p className="text-muted-foreground text-sm">
                                  Loading customer information…
                                </p>
                              ) : customer ? (
                                <div className="relative space-y-3 text-sm">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground hover:bg-muted absolute -top-2 right-0 h-8 w-8"
                                    onClick={() => setIsEditCompanyModalOpen(true)}
                                    title="Edit company">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <div>
                                    <p className="text-foreground pr-10 text-base font-semibold">
                                      {customer.name}
                                    </p>
                                    {(() => {
                                      const addr = primaryAddress || customerData?.addresses?.[0];
                                      if (!addr) return null;

                                      const hasStreet = addr.street && addr.street.trim();
                                      const hasCity = addr.city && addr.city.trim();
                                      const hasPostalCode =
                                        addr.postalCode && addr.postalCode.trim();

                                      if (!hasStreet && !hasCity && !hasPostalCode) return null;

                                      const addressParts = [];
                                      if (hasStreet) {
                                        addressParts.push(addr.street);
                                      }
                                      if (hasPostalCode || hasCity) {
                                        const cityPart = [];
                                        if (hasPostalCode) {
                                          cityPart.push(addr.postalCode);
                                        }
                                        if (hasCity) {
                                          cityPart.push(addr.city);
                                        }
                                        if (cityPart.length > 0 && hasStreet) {
                                          addressParts.push(cityPart.join(" "));
                                        } else if (cityPart.length > 0) {
                                          addressParts.push(...cityPart);
                                        }
                                      }

                                      if (addressParts.length === 0) return null;

                                      return (
                                        <p className="text-muted-foreground mt-2 text-sm">
                                          {addressParts.join(" - ")}
                                        </p>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 border-t pt-2">
                                    {customer.taxId && (
                                      <div className="text-muted-foreground flex items-center gap-2">
                                        <span className="font-medium">TAX ID:</span>
                                        <span>{customer.taxId}</span>
                                      </div>
                                    )}
                                    {(() => {
                                      const companyId =
                                        customer?.registrationNumber ||
                                        customerData?.account?.registrationNumber;
                                      return companyId && companyId.trim() ? (
                                        <div className="text-muted-foreground flex items-center gap-2">
                                          <span className="font-medium">Company ID:</span>
                                          <span>{companyId}</span>
                                        </div>
                                      ) : null;
                                    })()}
                                    {customer.country && (
                                      <div className="text-muted-foreground inline-flex items-center gap-2">
                                        <MapPin className="h-4 w-4" aria-hidden="true" />
                                        <span>{getCountryName(customer.country)}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 border-t pt-2">
                                    <div className="text-muted-foreground inline-flex items-center gap-2">
                                      <Mail className="h-4 w-4" aria-hidden="true" />
                                      <span>{customer.email}</span>
                                    </div>
                                    {customer.phone && (
                                      <div className="text-muted-foreground inline-flex items-center gap-2">
                                        <Phone className="h-4 w-4" aria-hidden="true" />
                                        <span>{customer.phone}</span>
                                      </div>
                                    )}
                                    {customer.website && (
                                      <div className="text-muted-foreground inline-flex items-center gap-2">
                                        <Globe className="h-4 w-4" aria-hidden="true" />
                                        <span className="font-medium">web</span>
                                        <span className="truncate">{customer.website}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-sm">
                                  This invoice is not linked to a customer.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="border-t pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                            <div className="space-y-4">
                              <div>
                                <p className="text-muted-foreground mb-1 text-sm font-medium">
                                  Totals
                                </p>
                                <p className="text-foreground text-2xl font-semibold">
                                  {formatCurrency(totals.total, selectedCurrency)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-2 text-sm font-medium">
                                  Currency:
                                </p>
                                <Select
                                  value={selectedCurrency}
                                  onValueChange={(value) => setValue("currency", value)}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                    <SelectItem value="RSD">RSD</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="border-border/60 bg-muted/40 rounded-lg border p-4">
                        <div className="mb-4 flex items-center justify-between border-b pb-4">
                          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            Items
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        </div>

                        <div className="overflow-hidden rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead
                                  className="px-3 py-2 text-xs font-semibold"
                                  style={{ width: "45%" }}>
                                  Description
                                </TableHead>
                                <TableHead
                                  className="px-3 py-2 text-xs font-semibold"
                                  style={{ width: "4%" }}>
                                  Qty
                                </TableHead>
                                <TableHead
                                  className="px-3 py-2 text-xs font-semibold"
                                  style={{ width: "7%" }}>
                                  Unit
                                </TableHead>
                                <TableHead
                                  className="px-3 py-2 text-right text-xs font-semibold"
                                  style={{ width: "12%" }}>
                                  Unit Price
                                </TableHead>
                                <TableHead className="w-[8%] px-3 py-2 text-right text-xs font-semibold">
                                  Disc %
                                </TableHead>
                                <TableHead className="w-[8%] px-3 py-2 text-right text-xs font-semibold">
                                  VAT %
                                </TableHead>
                                <TableHead className="w-[16%] px-3 py-2 text-right text-xs font-semibold">
                                  Amount
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fields.map((field, index) => {
                                // Use items from useWatch which automatically triggers recalculation
                                const currentItems = items || [];
                                const qty = Number(currentItems[index]?.quantity) || 0;
                                const price = Number(currentItems[index]?.unitPrice) || 0;
                                const discountRate = Number(currentItems[index]?.discountRate) || 0;
                                const vatRate = Number(currentItems[index]?.vatRate) || 0;

                                const itemTotalBeforeDiscount = qty * price;
                                const discount = itemTotalBeforeDiscount * (discountRate / 100);
                                const itemTotal = itemTotalBeforeDiscount - discount;
                                const itemVat = itemTotal * (vatRate / 100);
                                const itemTotalWithVat = itemTotal + itemVat;

                                return (
                                  <TableRow key={field.id} className="hover:bg-muted/50">
                                    <TableCell className="px-3 py-2 text-sm">
                                      <DescriptionAutocomplete
                                        value={methods.watch(`items.${index}.description`) || ""}
                                        onChange={(value) =>
                                          methods.setValue(`items.${index}.description`, value)
                                        }
                                        index={index}
                                        currency={methods.watch("currency")}
                                        onProductSelect={(product) => {
                                          const price =
                                            typeof product.price === "number"
                                              ? product.price
                                              : product.price
                                                ? Number.parseFloat(String(product.price)) || 0
                                                : 0;

                                          if (price > 0) {
                                            methods.setValue(`items.${index}.unitPrice`, price, {
                                              shouldValidate: true,
                                              shouldDirty: true
                                            });
                                          }

                                          const description = product.description || product.name;
                                          if (description) {
                                            methods.setValue(
                                              `items.${index}.description`,
                                              description,
                                              { shouldValidate: true, shouldDirty: true }
                                            );
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-sm">
                                      <Input
                                        type="number"
                                        min="1"
                                        step="1"
                                        {...methods.register(`items.${index}.quantity` as const, {
                                          valueAsNumber: true
                                        })}
                                        className="h-8 w-14 text-sm"
                                      />
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-sm">
                                      <Input
                                        {...methods.register(`items.${index}.unit` as const)}
                                        placeholder="pcs"
                                        className="h-8 w-16 text-sm"
                                      />
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-right text-sm">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        {...methods.register(`items.${index}.unitPrice` as const, {
                                          valueAsNumber: true,
                                          onChange: (e) => {
                                            const value = e.target.value.replace(/[^\d.,]/g, "");

                                            // For RSD: use . for thousands, , for decimals (e.g., 2.319,00)
                                            // For others: use , for thousands, . for decimals (e.g., 2,319.00)
                                            const isRSD = selectedCurrency === "RSD";

                                            let formattedValue = value;
                                            let numValue = 0;

                                            if (isRSD) {
                                              // RSD format: 2.319,00
                                              // Remove multiple consecutive dots (keep only last dot before comma if exists)
                                              const lastCommaIndex = value.lastIndexOf(",");
                                              if (lastCommaIndex > -1) {
                                                // There's a comma (decimal separator)
                                                const beforeComma = value
                                                  .substring(0, lastCommaIndex)
                                                  .replace(/\./g, "");
                                                const afterComma = value
                                                  .substring(lastCommaIndex + 1)
                                                  .replace(/,/g, "");
                                                // Add thousands separators
                                                const formatted = beforeComma.replace(
                                                  /\B(?=(\d{3})+(?!\d))/g,
                                                  "."
                                                );
                                                formattedValue = formatted + "," + afterComma;
                                                // Parse for setValue
                                                numValue =
                                                  Number.parseFloat(
                                                    beforeComma.replace(/\./g, "") +
                                                      "." +
                                                      afterComma
                                                  ) || 0;
                                              } else {
                                                // No comma yet, treat dots as thousands separators
                                                const cleaned = value.replace(/\./g, "");
                                                const formatted = cleaned.replace(
                                                  /\B(?=(\d{3})+(?!\d))/g,
                                                  "."
                                                );
                                                formattedValue = formatted;
                                                numValue = Number.parseFloat(cleaned) || 0;
                                              }
                                            } else {
                                              // Standard format: 2,319.00
                                              const lastDotIndex = value.lastIndexOf(".");
                                              if (lastDotIndex > -1) {
                                                // There's a dot (decimal separator)
                                                const beforeDot = value
                                                  .substring(0, lastDotIndex)
                                                  .replace(/,/g, "");
                                                const afterDot = value
                                                  .substring(lastDotIndex + 1)
                                                  .replace(/\./g, "");
                                                // Add thousands separators
                                                const formatted = beforeDot.replace(
                                                  /\B(?=(\d{3})+(?!\d))/g,
                                                  ","
                                                );
                                                formattedValue = formatted + "." + afterDot;
                                                // Parse for setValue
                                                numValue =
                                                  Number.parseFloat(beforeDot + "." + afterDot) ||
                                                  0;
                                              } else {
                                                // No dot yet, treat commas as thousands separators
                                                const cleaned = value.replace(/,/g, "");
                                                const formatted = cleaned.replace(
                                                  /\B(?=(\d{3})+(?!\d))/g,
                                                  ","
                                                );
                                                formattedValue = formatted;
                                                numValue = Number.parseFloat(cleaned) || 0;
                                              }
                                            }

                                            e.target.value = formattedValue;

                                            // Update form value immediately for real-time calculations
                                            methods.setValue(
                                              `items.${index}.unitPrice` as const,
                                              numValue,
                                              {
                                                shouldValidate: false,
                                                shouldDirty: true
                                              }
                                            );
                                          },
                                          onBlur: (e) => {
                                            const isRSD = selectedCurrency === "RSD";
                                            let value = e.target.value;

                                            // Parse value: remove thousands separators, normalize decimal separator
                                            if (isRSD) {
                                              // RSD: 2.319,00 -> 2319.00
                                              value = value.replace(/\./g, "").replace(",", ".");
                                            } else {
                                              // Standard: 2,319.00 -> 2319.00
                                              value = value.replace(/,/g, "");
                                            }

                                            const numValue = Number.parseFloat(value) || 0;
                                            methods.setValue(
                                              `items.${index}.unitPrice` as const,
                                              numValue,
                                              {
                                                shouldValidate: true
                                              }
                                            );

                                            // Format with thousands separator and 2 decimals
                                            if (isRSD) {
                                              // RSD: 2.319,00
                                              const parts = numValue.toFixed(2).split(".");
                                              const integerPart = parts[0].replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                "."
                                              );
                                              e.target.value = integerPart + "," + parts[1];
                                            } else {
                                              // Standard: 2,319.00
                                              const parts = numValue.toFixed(2).split(".");
                                              const integerPart = parts[0].replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ","
                                              );
                                              e.target.value = integerPart + "." + parts[1];
                                            }
                                          }
                                        })}
                                        placeholder={selectedCurrency === "RSD" ? "0,00" : "0.00"}
                                        className="h-8 w-full max-w-[120px] text-right text-sm"
                                      />
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-right text-sm">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        {...methods.register(
                                          `items.${index}.discountRate` as const,
                                          {
                                            valueAsNumber: true,
                                            onChange: (e) => {
                                              const value = e.target.value.replace(/[^\d.,]/g, "");
                                              const normalizedValue = value.replace(",", ".");
                                              const parts = normalizedValue.split(".");
                                              let formattedValue = value;
                                              if (parts.length > 2) {
                                                formattedValue =
                                                  parts[0] + "." + parts.slice(1).join("");
                                                e.target.value = formattedValue;
                                              } else {
                                                e.target.value = value;
                                              }
                                              // Limit to 100
                                              let numValue =
                                                Number.parseFloat(normalizedValue) || 0;
                                              if (numValue > 100) {
                                                e.target.value = "100";
                                                numValue = 100;
                                              }

                                              // Update form value immediately for real-time calculations
                                              methods.setValue(
                                                `items.${index}.discountRate` as const,
                                                numValue,
                                                {
                                                  shouldValidate: false,
                                                  shouldDirty: true
                                                }
                                              );
                                            },
                                            onBlur: (e) => {
                                              const value = e.target.value.replace(",", ".");
                                              const numValue = Number.parseFloat(value) || 0;
                                              methods.setValue(
                                                `items.${index}.discountRate` as const,
                                                numValue,
                                                {
                                                  shouldValidate: true
                                                }
                                              );
                                              // Format with locale-appropriate decimal separator
                                              const formatted = numValue.toFixed(2);
                                              e.target.value =
                                                selectedCurrency === "RSD"
                                                  ? formatted.replace(".", ",")
                                                  : formatted;
                                            }
                                          }
                                        )}
                                        placeholder={selectedCurrency === "RSD" ? "0,00" : "0.00"}
                                        className="h-8 w-16 text-right text-sm"
                                        defaultValue={0}
                                      />
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-right text-sm">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        {...methods.register(`items.${index}.vatRate` as const, {
                                          valueAsNumber: true,
                                          onChange: (e) => {
                                            const value = e.target.value.replace(/[^\d.,]/g, "");
                                            const normalizedValue = value.replace(",", ".");
                                            const parts = normalizedValue.split(".");
                                            let formattedValue = value;
                                            if (parts.length > 2) {
                                              formattedValue =
                                                parts[0] + "." + parts.slice(1).join("");
                                              e.target.value = formattedValue;
                                            } else {
                                              e.target.value = value;
                                            }
                                            // Limit to 100
                                            let numValue = Number.parseFloat(normalizedValue) || 0;
                                            if (numValue > 100) {
                                              e.target.value = "100";
                                              numValue = 100;
                                            }

                                            // Update form value immediately for real-time calculations
                                            methods.setValue(
                                              `items.${index}.vatRate` as const,
                                              numValue,
                                              {
                                                shouldValidate: false,
                                                shouldDirty: true
                                              }
                                            );
                                          },
                                          onBlur: (e) => {
                                            const value = e.target.value.replace(",", ".");
                                            const numValue = Number.parseFloat(value) || 0;
                                            methods.setValue(
                                              `items.${index}.vatRate` as const,
                                              numValue,
                                              {
                                                shouldValidate: true
                                              }
                                            );
                                            // Format with locale-appropriate decimal separator
                                            if (numValue > 0) {
                                              const formatted = numValue.toFixed(2);
                                              e.target.value =
                                                selectedCurrency === "RSD"
                                                  ? formatted.replace(".", ",")
                                                  : formatted;
                                            } else {
                                              e.target.value = "";
                                            }
                                          }
                                        })}
                                        placeholder={selectedCurrency === "RSD" ? "0,00" : "0.00"}
                                        className="h-8 w-16 text-right text-sm"
                                      />
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-right text-sm">
                                      <span className="text-sm font-medium">
                                        {formatCurrency(itemTotalWithVat, selectedCurrency)}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="px-3 py-2 text-right text-sm font-medium">
                                  Amount before discount:
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right text-sm font-medium">
                                  {formatCurrency(totals.amountBeforeDiscount, selectedCurrency)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="px-3 py-2 text-right text-sm font-medium">
                                  Discount:
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right text-sm font-medium">
                                  <span className="text-destructive">
                                    -{formatCurrency(totals.discountTotal, selectedCurrency)}
                                  </span>
                                </TableCell>
                              </TableRow>
                              <TableRow className="border-t">
                                <TableCell
                                  colSpan={6}
                                  className="px-3 py-2 text-right text-sm font-medium">
                                  Subtotal:
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right text-sm font-medium">
                                  {formatCurrency(totals.subtotal, selectedCurrency)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="px-3 py-2 text-right text-sm font-medium">
                                  VAT Amount
                                  {totals.averageVatRate > 0 ? ` (${totals.averageVatRate}%)` : ""}:
                                </TableCell>
                                <TableCell className="px-3 py-2 text-right text-sm font-medium">
                                  {formatCurrency(totals.totalVat, selectedCurrency)}
                                </TableCell>
                              </TableRow>
                              <TableRow className="border-t-2">
                                <TableCell
                                  colSpan={6}
                                  className="px-3 py-2.5 text-right text-base font-bold">
                                  Total:
                                </TableCell>
                                <TableCell className="px-3 py-2.5 text-right text-base font-bold">
                                  {formatCurrency(totals.total, selectedCurrency)}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </div>
                        {errors.items && (
                          <p className="text-destructive mt-2 text-sm">{errors.items.message}</p>
                        )}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="border-border/60 bg-muted/40 rounded-lg border p-4">
                        <div className="space-y-3">
                          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            Notes
                          </div>
                          <MinimalTiptapEditor
                            value={watch("notes") as Content | undefined}
                            onChange={(content) => setValue("notes", content)}
                            output="json"
                            placeholder="Add notes…"
                            editorContentClassName="min-h-[100px] border-0 bg-transparent px-3 py-2 text-sm leading-relaxed"
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </form>
              </FormProvider>
            </div>

            <div className="fixed right-6 bottom-6 z-50">
              <Button
                type="button"
                size="lg"
                className="px-6 py-6 shadow-lg"
                onClick={handleSubmit(
                  (data) => {
                    onSubmit(data as InvoiceFormData);
                  },
                  (errors) => {
                    const collect = (obj: unknown): string[] => {
                      const out: string[] = [];
                      const walk = (o: unknown) => {
                        if (!o || typeof o !== "object") return;
                        const objRecord = o as Record<string, unknown>;
                        for (const k of Object.keys(objRecord)) {
                          const v = objRecord[k] as unknown;
                          if (!v) continue;
                          const maybeMessage = (v as { message?: unknown }).message;
                          if (typeof maybeMessage === "string") out.push(maybeMessage);
                          else if (Array.isArray(v)) v.forEach((item) => walk(item));
                          else if (typeof v === "object") walk(v);
                        }
                      };
                      walk(obj);
                      return out;
                    };
                    const messages = collect(errors);
                    if (messages.length > 0) {
                      console.error("Form validation errors:", messages);
                      toast({
                        variant: "destructive",
                        title: "Validation Error",
                        description:
                          messages[0] ?? "Please check all required fields and fix any errors."
                      });
                    }
                  }
                )}
                disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {context === "offer" ? "Creating offer..." : "Creating..."}
                  </>
                ) : (
                  context === "offer" ? "CREATE OFFER" : "CREATE"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CompanyEditModal
        open={isEditCompanyModalOpen && !!customer}
        onOpenChange={setIsEditCompanyModalOpen}
        onCompanyUpdated={handleCompanyUpdated}
        company={customer || null}
      />
    </>
  );
}
