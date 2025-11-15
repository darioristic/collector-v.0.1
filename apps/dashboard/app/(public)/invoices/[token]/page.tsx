"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HtmlTemplate } from "@/components/invoices/templates";
import type { TemplateProps } from "@/components/invoices/templates/types";
import { useInvoice } from "@/src/hooks/useInvoices";
import { Loader2 } from "lucide-react";

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;
  const [invoiceData, setInvoiceData] = useState<{ invoice: any; templateProps: TemplateProps | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoiceByToken() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/invoices/token/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Invoice not found or link has expired");
          } else if (response.status === 403) {
            setError("This invoice link is no longer valid");
          } else {
            setError("Failed to load invoice");
          }
          return;
        }

        const data = await response.json();
        setInvoiceData(data);

        // Track view
        try {
          await fetch(`/api/invoices/token/${token}/track`, {
            method: "POST",
          });
        } catch (trackError) {
          // Silently fail tracking - don't block invoice display
          console.error("Failed to track view:", trackError);
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice");
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      fetchInvoiceByToken();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoiceData || !invoiceData.templateProps) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invoice not found</h1>
          <p className="text-muted-foreground">The invoice could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <HtmlTemplate {...invoiceData.templateProps} />
      </div>
    </div>
  );
}

