import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";

export function AmountInput({
  className,
  name,
  ...props
}: React.ComponentProps<typeof CurrencyInput> & {
  name: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const { control } = useFormContext();
  const {
    field: { value, onChange, onBlur },
  } = useController({
    name,
    control,
  });

  return (
    <div className="relative font-mono">
      <CurrencyInput
        autoComplete="off"
        value={value}
        onChange={(newValue) => {
          onChange(newValue, { shouldValidate: true });
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur();
        }}
        {...props}
        className={cn(
          className,
          "p-0 border-0 h-6 text-xs !bg-transparent border-b border-transparent focus:border-border",
        )}
      />

      {!value && !isFocused && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full dotted-bg" />
        </div>
      )}
    </div>
  );
}
