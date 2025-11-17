# Implementacija Optimizacija - Vodič

## 📋 Pregled

Ovaj dokument sadrži korak-po-korak vodič za implementaciju optimizacija iz `OPTIMIZATION_ANALYSIS.md`.

---

## 🚀 Faza 1: Helper Funkcije (1-2h)

### Korak 1.1: Kreirati helper fajl
✅ **Završeno:** `utils/company-helpers.ts` je kreiran

### Korak 1.2: Ažurirati data-table.tsx

**Zameniti:**
```typescript
// Stari kod
const getCompanyRegistrationNumber = (company: CompanyRow): string => { ... }
const companySearch = (company: CompanyRow) => { ... }
const formatTag = (value: CompanyRow["type"]): string => { ... }
const normalizeCountry = (country?: string | null) => { ... }
const shouldHideCompany = (country?: string | null) => { ... }
```

**Sa:**
```typescript
// Novi kod
import {
  getCompanyRegistrationNumber,
  getCompanySearchableText,
  formatTag,
  shouldHideCompany,
  enhanceCompanyRows,
  type EnhancedCompanyRow
} from "./utils/company-helpers";
```

### Korak 1.3: Ažurirati tipove

**Zameniti:**
```typescript
const [rows, setRows] = React.useState<CompanyRow[]>(data);
```

**Sa:**
```typescript
const [rows, setRows] = React.useState<EnhancedCompanyRow[]>(
  enhanceCompanyRows(data)
);
```

### Korak 1.4: Ažurirati globalFilterFn

**Zameniti:**
```typescript
globalFilterFn: (row, _columnId, filterValue) => {
  if (!filterValue) {
    return true;
  }
  return companySearch(row.original).includes(String(filterValue).toLowerCase());
}
```

**Sa:**
```typescript
globalFilterFn: (row, _columnId, filterValue) => {
  if (!filterValue) {
    return true;
  }
  return row.original.searchableText.includes(String(filterValue).toLowerCase());
}
```

### Korak 1.5: Ažurirati getCompanyRegistrationNumber pozive

**Zameniti:**
```typescript
cell: ({ row }) => (
  <span>{getCompanyRegistrationNumber(row.original)}</span>
)
```

**Sa:**
```typescript
cell: ({ row }) => (
  <span>{row.original.registrationNumber}</span>
)
```

---

## ⚡ Faza 2: Optimizacija Performansi (2-3h)

### Korak 2.1: Dodati useDebounce hook
✅ **Završeno:** `hooks/use-debounce.ts` je kreiran

### Korak 2.2: Implementirati debounce za search

**Dodati u komponentu:**
```typescript
import { useDebounce } from "./hooks/use-debounce";

// U komponenti
const [globalFilter, setGlobalFilter] = React.useState("");
const debouncedFilter = useDebounce(globalFilter, 300);
```

**Ažurirati table konfiguraciju:**
```typescript
const table = useReactTable({
  // ...
  state: {
    sorting,
    columnVisibility,
    rowSelection,
    globalFilter: debouncedFilter // Koristi debounced vrednost
  },
  // ...
});
```

**Ažurirati search input:**
```typescript
search={{
  value: globalFilter, // Prikazuje trenutnu vrednost
  onChange: (value) => {
    setGlobalFilter(value); // Ažurira odmah za UX
    setActiveQuickFilter(value.trim() === "" ? "all" : "custom");
  },
  // ...
}}
```

### Korak 2.3: Implementirati memoizovane table rows
✅ **Završeno:** `components/memoized-table-row.tsx` je kreiran

**Zameniti u TableBody:**
```typescript
// Stari kod
{table.getRowModel().rows.map((row) => (
  <TableRow key={row.id} onClick={...}>
    {/* ... */}
  </TableRow>
))}
```

**Sa:**
```typescript
// Novi kod
import { MemoizedTableRow } from "./components/memoized-table-row";

// U TableBody
{table.getRowModel().rows.map((row) => (
  <MemoizedTableRow
    key={row.id}
    row={row}
    onRowClick={handleView}
  />
))}
```

### Korak 2.4: Optimizovati useEffect za rows

**Zameniti:**
```typescript
React.useEffect(() => {
  setRows(data);
}, [data]);
```

**Sa:**
```typescript
React.useEffect(() => {
  setRows(enhanceCompanyRows(data));
}, [data]);
```

---

## 🔄 Faza 3: Refaktorisanje State-a (2-3h)

### Korak 3.1: Implementirati useCompanyDialog hook
✅ **Završeno:** `hooks/use-company-dialog.ts` je kreiran

### Korak 3.2: Zameniti dialog state-ove

**Zameniti:**
```typescript
const [editingCompany, setEditingCompany] = React.useState<CompanyRow | null>(null);
const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
const [isDialogOpen, setIsDialogOpen] = React.useState(false);
const [isSubmitting, setIsSubmitting] = React.useState(false);
```

**Sa:**
```typescript
import { useCompanyDialog, getFormValuesFromCompany, getDefaultFormValues } from "./hooks/use-company-dialog";

const dialog = useCompanyDialog();
```

### Korak 3.3: Ažurirati sve reference na dialog state

**Zameniti:**
- `isDialogOpen` → `dialog.isOpen`
- `setIsDialogOpen` → `dialog.setIsOpen`
- `dialogMode` → `dialog.mode`
- `setDialogMode` → `dialog.setMode`
- `editingCompany` → `dialog.editingCompany`
- `setEditingCompany` → `dialog.setEditingCompany`
- `isSubmitting` → `dialog.isSubmitting`
- `setIsSubmitting` → `dialog.setIsSubmitting`

### Korak 3.4: Ažurirati dialog funkcije

**Zameniti:**
```typescript
const openCreateDialog = React.useCallback(() => {
  setDialogMode("create");
  setEditingCompany(null);
  form.reset({ ...DEFAULT_FORM_VALUES });
  setIsDialogOpen(true);
}, [form]);
```

**Sa:**
```typescript
const openCreateDialog = React.useCallback(() => {
  dialog.openCreateDialog();
  form.reset(getDefaultFormValues());
}, [dialog, form]);
```

**Zameniti:**
```typescript
const handleEdit = React.useCallback((company: CompanyRow) => {
  setEditingCompany(company);
  setDialogMode("edit");
  form.reset({
    name: company.name ?? "",
    // ...
  });
  setIsDialogOpen(true);
}, [form]);
```

**Sa:**
```typescript
const handleEdit = React.useCallback((company: CompanyRow) => {
  dialog.openEditDialog(company);
  form.reset(getFormValuesFromCompany(company));
}, [dialog, form]);
```

### Korak 3.5: Implementirati useURLParams hook
✅ **Završeno:** `hooks/use-url-params.ts` je kreiran

### Korak 3.6: Refaktorisati URL parameter handling

**Zameniti kompleksan useEffect sa:**
```typescript
import { useURLParams } from "./hooks/use-url-params";

const urlParams = useURLParams();

React.useEffect(() => {
  const companyName = urlParams.getParam("company");
  const createParam = urlParams.getParam("create");
  const nameParam = urlParams.getParam("name");

  if (createParam === "true" && nameParam && !dialog.isOpen) {
    dialog.openCreateDialog();
    form.reset({
      ...getDefaultFormValues(),
      name: nameParam
    });
    urlParams.removeParams(["create", "name"]);
    return;
  }

  if (rows.length > 0 && companyName && !activeCompany) {
    const company = rows.find((row) =>
      row.name.toLowerCase().includes(companyName.toLowerCase())
    );

    if (company) {
      openSidebar(company);
      urlParams.removeParam("company");
    }
  }
}, [rows, activeCompany, dialog.isOpen, openSidebar, form, urlParams]);
```

---

## 🧩 Faza 4: Izdvajanje Komponenti (2-3h)

### Korak 4.1: Kreirati columns.tsx

**Kreirati fajl:** `components/columns.tsx`

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { CompanyRow } from "../data-table";
import { formatTag, getCompanyRegistrationNumber } from "../utils/company-helpers";
// ... ostali importi

export const createColumns = (
  handleView: (company: CompanyRow) => void,
  handleEdit: (company: CompanyRow) => void,
  handleDelete: (company: CompanyRow) => void
): ColumnDef<CompanyRow>[] => {
  // ... postojeća logika za kolone
};
```

**Ažurirati data-table.tsx:**
```typescript
import { createColumns } from "./components/columns";

const columns = React.useMemo(
  () => createColumns(handleView, handleEdit, handleDelete),
  [handleView, handleEdit, handleDelete]
);
```

---

## 🧹 Faza 5: Cleanup (1h)

### Korak 5.1: Ukloniti neiskorišćene importe

**Proveriti i ukloniti:**
- Komentarisane importe (Card, Label)
- Neiskorišćene tipove
- Neiskorišćene funkcije

### Korak 5.2: Ažurirati dokumentaciju

- Dodati komentare za nove hook-ove
- Ažurirati README ako postoji
- Dodati JSDoc komentare

---

## ✅ Checklist Implementacije

### Faza 1: Helper Funkcije
- [x] Kreirati `utils/company-helpers.ts`
- [ ] Ažurirati importe u `data-table.tsx`
- [ ] Zameniti sve pozive helper funkcija
- [ ] Testirati funkcionalnost

### Faza 2: Optimizacija Performansi
- [x] Kreirati `hooks/use-debounce.ts`
- [ ] Implementirati debounce za search
- [x] Kreirati `components/memoized-table-row.tsx`
- [ ] Implementirati memoizovane rows
- [ ] Testirati performanse

### Faza 3: Refaktorisanje State-a
- [x] Kreirati `hooks/use-company-dialog.ts`
- [ ] Zameniti dialog state-ove
- [x] Kreirati `hooks/use-url-params.ts`
- [ ] Refaktorisati URL handling
- [ ] Testirati funkcionalnost

### Faza 4: Izdvajanje Komponenti
- [ ] Kreirati `components/columns.tsx`
- [ ] Izdvojiti column definicije
- [ ] Testirati funkcionalnost

### Faza 5: Cleanup
- [ ] Ukloniti neiskorišćene importe
- [ ] Ažurirati dokumentaciju
- [ ] Finalno testiranje

---

## 🧪 Testiranje

### Funkcionalni Testovi
- [ ] Kreiranje kompanije
- [ ] Izmena kompanije
- [ ] Brisanje kompanije
- [ ] Pretraga kompanija
- [ ] Filtriranje po tipu
- [ ] Sortiranje kolona
- [ ] Paginacija
- [ ] URL parametri

### Performanse Testovi
- [ ] Render sa 100 redova
- [ ] Render sa 1000 redova
- [ ] Search sa debounce-om
- [ ] Re-render pri filtriranju
- [ ] Memory leak provera

---

## 📊 Metrije za Praćenje

### Pre Implementacije
- [ ] Izmeriti re-render count
- [ ] Izmeriti render vreme
- [ ] Izmeriti bundle size

### Posle Implementacije
- [ ] Uporediti re-render count
- [ ] Uporediti render vreme
- [ ] Uporediti bundle size

---

## 🐛 Poznati Problemi i Rešenja

### Problem: TypeScript greške pri refaktorisanju
**Rešenje:** Postepeno refaktorisanje, testiranje nakon svakog koraka

### Problem: Dependency array warnings
**Rešenje:** Koristiti ESLint disable komentare samo gde je neophodno

### Problem: Performance regression
**Rešenje:** Koristiti React DevTools Profiler za praćenje

---

## 📝 Napomene

- **Postepena implementacija:** Implementirati faze jedna po jedna
- **Testiranje:** Testirati nakon svake faze
- **Rollback plan:** Imati backup pre početka refaktorisanja
- **Code review:** Tražiti code review nakon svake faze

