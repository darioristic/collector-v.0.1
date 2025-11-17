# Companies Data Table - Optimizacija

## 📁 Struktura Foldera

```
companies/
├── data-table.tsx              # Glavna komponenta (1471 linija)
├── OPTIMIZATION_ANALYSIS.md    # Detaljna analiza problema
├── OPTIMIZATION_IMPLEMENTATION.md  # Vodič za implementaciju
├── README.md                   # Ovaj fajl
│
├── utils/
│   └── company-helpers.ts      # Helper funkcije (izdvojene)
│
├── hooks/
│   ├── use-company-dialog.ts   # Dialog state management
│   ├── use-debounce.ts         # Debounce hook za search
│   └── use-url-params.ts       # URL parameter handling
│
└── components/
    └── memoized-table-row.tsx  # Optimizovana table row komponenta
```

---

## 🎯 Ciljevi Optimizacije

1. **Performanse**
   - Smanjenje re-rendera za 50-70%
   - Brže renderovanje tabele sa 1000+ redova
   - Optimizacija search operacija

2. **Održivost**
   - Izdvajanje logike u manje module
   - Lakše testiranje
   - Bolja čitljivost koda

3. **Developer Experience**
   - Ponovna upotreba helper funkcija
   - Custom hook-ovi za čestu logiku
   - Bolja tipizacija

---

## 📚 Dokumentacija

### OPTIMIZATION_ANALYSIS.md
Detaljna analiza svih problema i preporuka za optimizaciju:
- Kritični problemi (performanse)
- Srednji problemi (održivost)
- Manji problemi (kod organizacija)
- Očekivani rezultati
- Metrije za praćenje

### OPTIMIZATION_IMPLEMENTATION.md
Korak-po-korak vodič za implementaciju:
- 5 faza implementacije
- Detaljni koraci za svaku fazu
- Checklist za praćenje napretka
- Test plan

---

## 🛠️ Helper Funkcije

### `utils/company-helpers.ts`

**Funkcije:**
- `getCompanyRegistrationNumber()` - Generiše registration number
- `getCompanySearchableText()` - Generiše searchable text
- `formatTag()` - Formatira tag za prikaz
- `shouldHideCompany()` - Proverava da li kompanija treba da bude sakrivena
- `enhanceCompanyRow()` - Transformiše CompanyRow u EnhancedCompanyRow
- `enhanceCompanyRows()` - Batch transformacija

**Korišćenje:**
```typescript
import { 
  getCompanyRegistrationNumber,
  enhanceCompanyRows 
} from "./utils/company-helpers";

const enhancedRows = enhanceCompanyRows(companies);
```

---

## 🎣 Custom Hook-ovi

### `hooks/use-company-dialog.ts`

**Svrha:** Upravljanje dialog state-om za kreiranje/izmenu kompanije

**API:**
```typescript
const dialog = useCompanyDialog();

// State
dialog.isOpen
dialog.mode // 'create' | 'edit'
dialog.editingCompany
dialog.isSubmitting

// Actions
dialog.openCreateDialog()
dialog.openEditDialog(company)
dialog.closeDialog()
dialog.resetDialog()
```

**Korišćenje:**
```typescript
import { useCompanyDialog } from "./hooks/use-company-dialog";

const MyComponent = () => {
  const dialog = useCompanyDialog();
  
  return (
    <Button onClick={dialog.openCreateDialog}>
      Create Company
    </Button>
  );
};
```

### `hooks/use-debounce.ts`

**Svrha:** Debounce vrednosti za optimizaciju input polja

**API:**
```typescript
const debouncedValue = useDebounce(value, delay);
```

**Korišćenje:**
```typescript
import { useDebounce } from "./hooks/use-debounce";

const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

// Koristi debouncedSearch za filtriranje
useEffect(() => {
  filterData(debouncedSearch);
}, [debouncedSearch]);
```

### `hooks/use-url-params.ts`

**Svrha:** Rad sa URL parametrima

**API:**
```typescript
const urlParams = useURLParams();

urlParams.getParam(key)
urlParams.setParam(key, value)
urlParams.removeParam(key)
urlParams.removeParams([key1, key2])
```

**Korišćenje:**
```typescript
import { useURLParams } from "./hooks/use-url-params";

const MyComponent = () => {
  const urlParams = useURLParams();
  const companyId = urlParams.getParam("company");
  
  // ...
};
```

---

## 🧩 Komponente

### `components/memoized-table-row.tsx`

**Svrha:** Optimizovana table row komponenta sa memoizacijom

**Korišćenje:**
```typescript
import { MemoizedTableRow } from "./components/memoized-table-row";

{table.getRowModel().rows.map((row) => (
  <MemoizedTableRow
    key={row.id}
    row={row}
    onRowClick={handleView}
  />
))}
```

**Optimizacije:**
- Re-renderuje se samo kada se promeni row data ili selection state
- Custom comparison funkcija za preciznu kontrolu
- Optimizovano za velike tabele

---

## 🚀 Početak Optimizacije

### Korak 1: Pročitaj analizu
```bash
cat OPTIMIZATION_ANALYSIS.md
```

### Korak 2: Prati implementacioni vodič
```bash
cat OPTIMIZATION_IMPLEMENTATION.md
```

### Korak 3: Implementiraj fazu po fazu
- Faza 1: Helper funkcije (1-2h)
- Faza 2: Optimizacija performansi (2-3h)
- Faza 3: Refaktorisanje state-a (2-3h)
- Faza 4: Izdvajanje komponenti (2-3h)
- Faza 5: Cleanup (1h)

---

## 📊 Metrije

### Pre Optimizacije
- Re-renderi pri filtriranju: ~1000+ (za 1000 redova)
- Vreme renderovanja: ~200-300ms
- Bundle size: [treba izmeriti]

### Post Optimizacije (Očekivano)
- Re-renderi pri filtriranju: ~50-100 (za 1000 redova)
- Vreme renderovanje: ~100-150ms
- Bundle size: [treba izmeriti]

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

## 📝 Napomene

- **Postepena implementacija:** Implementirati faze jedna po jedna
- **Testiranje:** Testirati nakon svake faze
- **Rollback plan:** Imati backup pre početka refaktorisanja
- **Code review:** Tražiti code review nakon svake faze

---

## 🔗 Reference

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [TanStack Table Performance](https://tanstack.com/table/latest/docs/guide/performance)
- [useMemo vs useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)

