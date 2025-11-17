# Analiza i Optimizacija: Companies Data Table

## 📊 Pregled Komponente

**Fajl:** `data-table.tsx`  
**Linija koda:** 1471  
**Kompleksnost:** Visoka  
**Broj state hookova:** 12+  
**Broj useEffect hookova:** 4  

---

## 🔴 Kritični Problemi

### 1. **Performanse Globalnog Filtera**
**Problem:** `companySearch` funkcija se izvršava za svaki red pri svakoj promeni filtera.

```192:206:apps/dashboard/app/(protected)/accounts/companies/data-table.tsx
const companySearch = (company: CompanyRow) =>
  [
    company.name,
    company.email ?? "",
    company.phone ?? "",
    company.taxId,
    getCompanyRegistrationNumber(company),
    company.primaryContactName ?? "",
    company.primaryContactEmail ?? "",
    company.primaryContactPhone ?? "",
    company.country,
    company.type
  ]
    .join(" ")
    .toLowerCase();
```

**Uticaj:** 
- Za 1000 redova = 1000 poziva `getCompanyRegistrationNumber` pri svakoj promeni filtera
- String konkatenacija i lowercase operacije za svaki red
- Nema memoizacije rezultata

**Rešenje:**
- Pre-izračunati search string za svaki red pri učitavanju podataka
- Dodati `searchableText` property u `CompanyRow` tip
- Koristiti `useMemo` za preprocesiranje podataka

### 2. **Višestruko Pozivanje `getCompanyRegistrationNumber`**
**Problem:** Funkcija se poziva više puta za isti red (u search funkciji i u render-u).

```179:190:apps/dashboard/app/(protected)/accounts/companies/data-table.tsx
const getCompanyRegistrationNumber = (company: CompanyRow): string => {
  const taxIdNumericPart = company.taxId?.replace(/\D/g, "") ?? "";

  if (taxIdNumericPart.length > 0) {
    const suffix = taxIdNumericPart.slice(-4);
    return `REG-${suffix.padStart(4, "0")}`;
  }

  const idSuffix = (company.id.split("-").pop() ?? company.id).replace(/\D/g, "");
  const fallback = idSuffix.slice(-4);
  return `REG-${fallback.padStart(4, "0")}`;
};
```

**Uticaj:**
- Regex operacije (`replace(/\D/g, "")`) se izvršavaju više puta
- String manipulacije za svaki render

**Rešenje:**
- Izračunati jednom i sačuvati u `CompanyRow` objektu
- Koristiti `useMemo` za transformaciju podataka pri učitavanju

### 3. **Nedostajuća Memoizacija Column Definicija**
**Problem:** `columns` useMemo zavisi od callback funkcija koje se rekreiraju.

```659:833:apps/dashboard/app/(protected)/accounts/companies/data-table.tsx
const columns = React.useMemo<ColumnDef<CompanyRow>[]>(() => {
  // ... column definitions
}, [handleDelete, handleEdit, handleView]);
```

**Uticaj:**
- Ako se bilo koji od callback-ova promeni, sve kolone se rekreiraju
- Cell render funkcije se kreiraju iznova

**Rešenje:**
- Stabilizovati dependency array
- Koristiti `React.memo` za cell komponente
- Izdvojiti column definicije u poseban fajl

### 4. **Previše State Hookova**
**Problem:** 12+ useState hookova u jednoj komponenti.

**State-ovi:**
- `rows`
- `sorting`
- `columnVisibility`
- `rowSelection`
- `globalFilter`
- `activeQuickFilter`
- `activeCompany`
- `companyDetails`
- `isLoadingDetails`
- `editingCompany`
- `dialogMode`
- `isDialogOpen`
- `isSubmitting`
- `companyToDelete`
- `isDeleteDialogOpen`
- `isDeleting`

**Uticaj:**
- Teško održavanje
- Više re-rendera nego što je potrebno
- Logički povezani state-ovi nisu grupovani

**Rešenje:**
- Grupisati povezane state-ove u objekte
- Koristiti `useReducer` za kompleksnije state management
- Izdvojiti dialog state u custom hook

---

## 🟡 Srednji Problemi

### 5. **Nedostajuća Memoizacija Table Rows**
**Problem:** Svaki red se re-renderuje pri bilo kojoj promeni state-a.

```1029:1053:apps/dashboard/app/(protected)/accounts/companies/data-table.tsx
{table.getRowModel().rows.map((row) => (
  <TableRow
    key={row.id}
    data-state={row.getIsSelected() && "selected"}
    className="hover:bg-muted/50 cursor-pointer transition-colors"
    onClick={(e) => {
      // ... click handler
    }}>
    {row.getVisibleCells().map((cell) => (
      <TableCell key={cell.id} className="align-middle">
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    ))}
  </TableRow>
))}
```

**Rešenje:**
- Kreirati memoizovanu `TableRow` komponentu
- Koristiti `React.memo` sa custom comparison funkcijom

### 6. **URL Parameter Handling u useEffect**
**Problem:** Kompleksna logika u useEffect koja zavisi od više dependency-ja.

```374:415:apps/dashboard/app/(protected)/accounts/companies/data-table.tsx
React.useEffect(() => {
  if (typeof window === "undefined") {
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const companyName = searchParams.get("company");
  const createParam = searchParams.get("create");
  const nameParam = searchParams.get("name");

  // ... complex logic
}, [rows, activeCompany, openSidebar, isDialogOpen, form]);
```

**Uticaj:**
- useEffect se izvršava često zbog dependency-ja
- Potencijalno race condition-ovi

**Rešenje:**
- Izdvojiti u custom hook `useURLParams`
- Koristiti `useSearchParams` iz Next.js ako je dostupan
- Optimizovati dependency array

### 7. **Nedostajuća Debounce za Search**
**Problem:** Global filter se ažurira pri svakoj promeni input-a.

```956:964:apps/dashboard/app/(protected)/accounts/companies/data-table.tsx
search={{
  value: globalFilter,
  onChange: (value) => {
    setGlobalFilter(value);
    setActiveQuickFilter(value.trim() === "" ? "all" : "custom");
  },
  placeholder: "Search companies by name, email, or country",
  ariaLabel: "Search companies"
}}
```

**Rešenje:**
- Dodati debounce za search input (300-500ms)
- Koristiti `useDebounce` hook

### 8. **Form Reset Logika**
**Problem:** Form se resetuje na više mesta sa istom logikom.

**Rešenje:**
- Kreirati `resetForm` helper funkciju
- Koristiti `useCallback` za stabilizaciju

---

## 🟢 Manji Problemi i Poboljšanja

### 9. **Izdvajanje Helper Funkcija**
**Preporuka:** Izdvojiti helper funkcije u `utils/company-helpers.ts`

- `getCompanyRegistrationNumber`
- `companySearch`
- `formatTag`
- `normalizeCountry`
- `shouldHideCompany`

### 10. **Izdvajanje Column Definicija**
**Preporuka:** Kreirati `columns.tsx` fajl sa column definicijama

- Lakše testiranje
- Bolja organizacija koda
- Mogućnost ponovne upotrebe

### 11. **Izdvajanje Form Logike**
**Preporuka:** Kreirati `useCompanyForm` custom hook

- Form state management
- Validation logika
- Submit handler

### 12. **Izdvajanje Dialog State**
**Preporuka:** Kreirati `useCompanyDialog` custom hook

- Dialog open/close state
- Edit/Create mode
- Company selection

### 13. **Optimizacija Date Formatting**
**Problem:** `dateFormatter` se kreira pri svakom render-u (iako je van komponente, dobro je).

```129:129:apps/dashboard/app/(protected)/accounts/companies/data-table.tsx
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
```

**Status:** ✅ Već je optimizovano (van komponente)

### 14. **Bundle Size Optimizacija**
**Provera:** 
- Komentarisani importi (Card, Label) - ukloniti ako nisu potrebni
- Proveriti da li su svi importi korišćeni

---

## 📈 Predložene Optimizacije

### Prioritet 1: Visok (Kritično za Performanse)

1. **Pre-izračunati search string**
   ```typescript
   const rowsWithSearch = useMemo(() => 
     rows.map(row => ({
       ...row,
       searchableText: companySearch(row),
       registrationNumber: getCompanyRegistrationNumber(row)
     }))
   , [rows]);
   ```

2. **Dodati debounce za search**
   ```typescript
   const debouncedFilter = useDebounce(globalFilter, 300);
   ```

3. **Memoizovati table rows**
   ```typescript
   const MemoizedTableRow = React.memo(TableRow, (prev, next) => {
     return prev.row.id === next.row.id && 
            prev.row.getIsSelected() === next.row.getIsSelected();
   });
   ```

### Prioritet 2: Srednji (Poboljšanje Održivosti)

4. **Izdvojiti helper funkcije**
   - Kreirati `utils/company-helpers.ts`

5. **Izdvojiti column definicije**
   - Kreirati `columns.tsx`

6. **Grupisati state-ove**
   ```typescript
   const [dialogState, setDialogState] = useState({
     isOpen: false,
     mode: 'create' as 'create' | 'edit',
     company: null as CompanyRow | null,
     isSubmitting: false
   });
   ```

### Prioritet 3: Nizak (Kod Organizacija)

7. **Izdvojiti custom hook-ove**
   - `useCompanyForm`
   - `useCompanyDialog`
   - `useURLParams`

8. **Cleanup komentara**
   - Ukloniti neiskorišćene importe

---

## 🎯 Očekivani Rezultati

### Performanse:
- **50-70% smanjenje** re-rendera pri filtriranju
- **30-40% brže** renderovanje tabele sa 1000+ redova
- **Smanjenje** bundle size za ~5-10%

### Održivost:
- **40% manje** linija koda u glavnoj komponenti
- **Lakše testiranje** izdvojenih funkcija
- **Bolja čitljivost** i organizacija

### Developer Experience:
- **Lakše održavanje** izdvojenih modula
- **Ponovna upotreba** helper funkcija
- **Bolja tipizacija** sa izdvojenim tipovima

---

## 📝 Plan Implementacije

### Faza 1: Helper Funkcije (1-2h)
- [ ] Kreirati `utils/company-helpers.ts`
- [ ] Premestiti helper funkcije
- [ ] Ažurirati importe

### Faza 2: Optimizacija Performansi (2-3h)
- [ ] Pre-izračunati search string i registration number
- [ ] Dodati debounce za search
- [ ] Memoizovati table rows

### Faza 3: Refaktorisanje State-a (2-3h)
- [ ] Grupisati dialog state
- [ ] Kreirati custom hook-ove
- [ ] Optimizovati useEffect dependency array-e

### Faza 4: Izdvajanje Komponenti (2-3h)
- [ ] Izdvojiti column definicije
- [ ] Kreirati memoizovane cell komponente
- [ ] Izdvojiti form logiku

### Faza 5: Cleanup (1h)
- [ ] Ukloniti neiskorišćene importe
- [ ] Ažurirati dokumentaciju
- [ ] Testiranje

**Ukupno vreme:** 8-12 sati

---

## 🔍 Metrije za Praćenje

### Pre Optimizacije:
- Re-renderi pri filtriranju: ~1000+ (za 1000 redova)
- Vreme renderovanja: ~200-300ms
- Bundle size: [treba izmeriti]

### Post Optimizacije:
- Re-renderi pri filtriranju: ~50-100 (za 1000 redova)
- Vreme renderovanja: ~100-150ms
- Bundle size: [treba izmeriti]

---

## 📚 Reference

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [TanStack Table Performance](https://tanstack.com/table/latest/docs/guide/performance)
- [useMemo vs useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)

