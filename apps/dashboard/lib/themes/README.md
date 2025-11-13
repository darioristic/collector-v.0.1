# Vercel Geist Design System - Dark Theme

Kompletna Vercel Geist Design System dark tema sa svim bojama i skalama.

## Struktura

- **`geist-dark.ts`** - TypeScript objekat sa svim bojama dark teme
- **`geist-dark.json`** - JSON objekat sa svim bojama dark teme
- **`apps/dashboard/app/themes.css`** - CSS varijable za dark temu u `@variant dark` bloku
- **`apps/dashboard/app/globals.css`** - Tailwind utility klase za dark temu

## Kategorije Boja

### 1. Backgrounds

- **Background 1** (`#000000`) - Default element background
- **Background 2** (`#111111`) - Secondary background
- **Component Default** (`#111111`) - Color 1 (default)
- **Component Hover** (`#1A1A1A`) - Color 2 (hover)
- **Component Active** (`#262626`) - Color 3 (active)
- **High Contrast Default** (`#525252`) - Color 7 (default)
- **High Contrast Hover** (`#737373`) - Color 8 (hover)

### 2. Borders

- **Border Default** (`#2A2A2A`) - Color 4 (default)
- **Border Hover** (`#404040`) - Color 5 (hover)
- **Border Active** (`#525252`) - Color 6 (active)

### 3. Text & Icons

- **Text Primary** (`#FFFFFF`) - Color 10 (primary text and icons)
- **Text Secondary** (`#888888`) - Color 9 (secondary text and icons)
- **Icon Primary** (`#FFFFFF`) - Color 10 (primary icons)
- **Icon Secondary** (`#888888`) - Color 9 (secondary icons)

### 4. Color Scales

#### Gray Scale (10 shades)
- `gray-1` through `gray-10` - Od `#FAFAFA` do `#171717`

#### Gray Alpha Scale (10 shades)
- `gray-alpha-1` through `gray-alpha-10` - Od `rgba(255, 255, 255, 0.05)` do `rgba(255, 255, 255, 0.80)`

#### Blue Scale (10 shades)
- `blue-1` through `blue-10` - Od `#0A1929` do `#001C55`
- Primary: `blue-6` (`#0070F3`) - Vercel brand color

#### Red Scale (10 shades)
- `red-1` through `red-10` - Od `#2A0E0E` do `#FFBDBD`
- Primary: `red-5` (`#FF3B3B`) - Destructive actions

#### Amber Scale (10 shades)
- `amber-1` through `amber-10` - Od `#2A1F0E` do `#FFF8E1`
- Primary: `amber-5` (`#FFB300`) - Warning states

#### Green Scale (10 shades)
- `green-1` through `green-10` - Od `#0A1F15` do `#99FADD`
- Primary: `green-5` (`#00B37E`) - Success states

#### Teal Scale (10 shades)
- `teal-1` through `teal-10` - Od `#0A1F1F` do `#99FAFA`
- Primary: `teal-5` (`#00B3B3`)

#### Purple Scale (10 shades)
- `purple-1` through `purple-10` - Od `#1F0A2A` do `#F3E8FF`
- Primary: `purple-5` (`#9333EA`)

#### Pink Scale (10 shades)
- `pink-1` through `pink-10` - Od `#2A0A1F` do `#FFE8F7`
- Primary: `pink-5` (`#EC4899`)

### 5. Semantic Colors

- **Primary** (`#0070F3`) - Primary action color
- **Secondary** (`#262626`) - Secondary action color
- **Destructive** (`#FF3B3B`) - Destructive action color
- **Accent** (`#0070F3`) - Accent color
- **Muted** (`#262626`) - Muted background
- **Success** (`#00B37E`) - Success state color
- **Warning** (`#FFB300`) - Warning state color
- **Error** (`#FF3B3B`) - Error state color
- **Info** (`#0070F3`) - Info state color

## Korišćenje

### CSS Varijable

```css
/* Backgrounds */
background-color: var(--geist-dark-background-1); /* #000000 */
background-color: var(--geist-dark-background-2); /* #111111 */
background-color: var(--geist-dark-component-default); /* #111111 */
background-color: var(--geist-dark-component-hover); /* #1A1A1A */
background-color: var(--geist-dark-component-active); /* #262626 */

/* Borders */
border-color: var(--geist-dark-border-default); /* #2A2A2A */
border-color: var(--geist-dark-border-hover); /* #404040 */
border-color: var(--geist-dark-border-active); /* #525252 */

/* Text & Icons */
color: var(--geist-dark-text-primary); /* #FFFFFF */
color: var(--geist-dark-text-secondary); /* #888888 */

/* Color Scales */
background-color: var(--geist-dark-blue-6); /* #0070F3 */
background-color: var(--geist-dark-red-5); /* #FF3B3B */
background-color: var(--geist-dark-green-5); /* #00B37E */

/* Semantic Colors */
background-color: var(--geist-dark-primary); /* #0070F3 */
background-color: var(--geist-dark-secondary); /* #262626 */
background-color: var(--geist-dark-destructive); /* #FF3B3B */
```

### Tailwind Utility Classes

```jsx
// Text Colors
<div className="dark:text-primary">Primary Text</div>
<div className="dark:text-secondary">Secondary Text</div>

// Background Colors
<div className="dark:bg-primary">Primary Background</div>
<div className="dark:bg-secondary">Secondary Background</div>

// Border Colors
<div className="dark:border-default">Default Border</div>
<div className="dark:border-hover">Hover Border</div>
<div className="dark:border-active">Active Border</div>
```

### TypeScript/JavaScript

```typescript
import { geistDarkTheme } from '@/lib/themes/geist-dark';

// Access colors
const primaryColor = geistDarkTheme.semantic.primary; // "#0070F3"
const background1 = geistDarkTheme.backgrounds.background1; // "#000000"
const blue6 = geistDarkTheme.blue.blue6; // "#0070F3"
```

### JSON

```json
{
  "theme": {
    "backgrounds": {
      "background1": {
        "value": "#000000",
        "description": "Default element background",
        "usage": "Main background color"
      }
    }
  }
}
```

## Integracija u Theme System

Dark tema je integrisana u postojeći theme system kroz `@variant dark` blok u `apps/dashboard/app/themes.css`. Kada je Vercel tema aktivna i sistem je u dark modu, sve boje se automatski primenjuju.

### Aktivacija Dark Teme

Dark tema se automatski aktivira kada:
1. Vercel tema je selektovana (`data-theme-preset="vercel"`)
2. Sistem je u dark modu (`.dark` klasa ili `@variant dark`)

### Theme Varijable

Dark tema mapira sve standardne theme varijable:

```css
--background: var(--geist-dark-background-1);
--foreground: var(--geist-dark-text-primary);
--primary: var(--geist-dark-primary);
--secondary: var(--geist-dark-secondary);
--destructive: var(--geist-dark-destructive);
--border: var(--geist-dark-border-default);
--muted: var(--geist-dark-muted);
--accent: var(--geist-dark-accent);
```

## Primer Stranice

Pogledajte `apps/dashboard/app/(protected)/pages/geist-dark-theme/page.tsx` za kompletan primer korišćenja dark teme sa svim bojama i skalama.

## P3 Color Support

Sve boje su pripremljene za P3 color space podršku. P3 color vrednosti mogu biti dodate kasnije kada budu potrebne.

## Reference

- [Vercel Geist Design System](https://vercel.com/geist)
- [Vercel Geist Colors](https://vercel.com/geist/colors)
- [Vercel Geist Typography](https://vercel.com/geist/typography)

