import * as React from "react";
import type { CompanyRow, CompanyFormValues } from "../data-table";

const ACCOUNT_TAG_OPTIONS = ["customer", "partner", "vendor"] as const;

/**
 * Custom hook za upravljanje dialog state-om za kreiranje/izmenu kompanije
 * Grupiše povezane state-ove i logiku
 */
export function useCompanyDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editingCompany, setEditingCompany] = React.useState<CompanyRow | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const openCreateDialog = React.useCallback(() => {
    setMode("create");
    setEditingCompany(null);
    setIsOpen(true);
  }, []);

  const openEditDialog = React.useCallback((company: CompanyRow) => {
    setEditingCompany(company);
    setMode("edit");
    setIsOpen(true);
  }, []);

  const closeDialog = React.useCallback(() => {
    setIsOpen(false);
    setEditingCompany(null);
    setMode("create");
  }, []);

  const resetDialog = React.useCallback(() => {
    setEditingCompany(null);
    setMode("create");
  }, []);

  return {
    // State
    isOpen,
    mode,
    editingCompany,
    isSubmitting,
    
    // Actions
    setIsOpen,
    setMode,
    setEditingCompany,
    setIsSubmitting,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    resetDialog
  };
}

/**
 * Helper funkcija za resetovanje forme na default vrednosti
 */
export const getDefaultFormValues = (): CompanyFormValues => ({
  name: "",
  email: "",
  billingEmail: "",
  phone: "",
  website: "",
  contactPerson: "",
  type: ACCOUNT_TAG_OPTIONS[0],
  taxId: "",
  country: "RS"
});

/**
 * Helper funkcija za popunjavanje forme sa podacima kompanije
 */
export const getFormValuesFromCompany = (company: CompanyRow): CompanyFormValues => ({
  name: company.name ?? "",
  email: company.email ?? "",
  billingEmail: "",
  phone: company.phone ?? "",
  website: company.website ?? "",
  contactPerson: "",
  type: company.type ?? "customer",
  taxId: company.taxId ?? "",
  country: company.country ?? ""
});

