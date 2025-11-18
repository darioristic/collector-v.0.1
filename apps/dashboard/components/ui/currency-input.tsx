"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  currency?: string;
  locale?: string;
  prefix?: string;
  suffix?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value,
      onChange,
      currency = "USD",
      locale = "en-US",
      prefix,
      suffix,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;

      // Remove prefix and suffix from input value if present
      if (prefix && inputValue.startsWith(prefix)) {
        inputValue = inputValue.slice(prefix.length);
      }
      if (suffix && inputValue.endsWith(suffix)) {
        inputValue = inputValue.slice(0, -suffix.length);
      }

      // Allow empty string
      if (inputValue.trim() === "") {
        setDisplayValue("");
        onChange?.(undefined);
        return;
      }

      // Remove non-numeric characters except decimal point
      const numericValue = inputValue.replace(/[^\d.]/g, "");

      // Prevent multiple decimal points
      const parts = numericValue.split(".");
      const sanitized = parts.length > 2
        ? parts[0] + "." + parts.slice(1).join("")
        : numericValue;

      setDisplayValue(sanitized);

      const numberValue = parseFloat(sanitized);
      if (!isNaN(numberValue)) {
        onChange?.(numberValue);
      } else {
        onChange?.(undefined);
      }
    };

    const inputWithAffixes = (
      <div className="relative inline-flex items-center">
        {prefix && <span className="select-none">{prefix}</span>}
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          className={cn(className)}
          {...props}
        />
        {suffix && <span className="select-none">{suffix}</span>}
      </div>
    );

    // If no prefix or suffix, return just the input
    if (!prefix && !suffix) {
      return (
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          className={cn(className)}
          {...props}
        />
      );
    }

    return inputWithAffixes;
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
