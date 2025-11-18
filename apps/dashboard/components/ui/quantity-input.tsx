"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface QuantityInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
}

const QuantityInput = React.forwardRef<HTMLInputElement, QuantityInputProps>(
  ({ className, value, onChange, min = 0, max, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty string
      if (inputValue === "") {
        setDisplayValue("");
        onChange?.(0);
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

      let numberValue = parseFloat(sanitized);
      if (!isNaN(numberValue)) {
        // Apply min/max constraints
        if (min !== undefined && numberValue < min) {
          numberValue = min;
        }
        if (max !== undefined && numberValue > max) {
          numberValue = max;
        }
        onChange?.(numberValue);
      }
    };

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
);

QuantityInput.displayName = "QuantityInput";

export { QuantityInput };
