import * as React from "react";

/**
 * Custom hook za debounce vrednosti
 * Koristi se za optimizaciju search input-a i drugih input polja
 * 
 * @param value - Vrednost koja se debounce-uje
 * @param delay - Vreme čekanja u milisekundama (default: 300ms)
 * @returns Debounced vrednost
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

