import { QuantityInput as BaseQuantityInput } from "@/components/ui/quantity-input";
import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";

export function QuantityInput({
  name,
  ...props
}: { name: string } & Omit<Parameters<typeof BaseQuantityInput>[0], "value">) {
  const [isFocused, setIsFocused] = useState(false);

  const { control } = useFormContext();
  const {
    field: { value, onChange, onBlur },
  } = useController({
    name,
    control,
  });

  return (
    <div className="relative">
      <BaseQuantityInput
        {...props}
        value={value}
        min={0}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur();
        }}
      />

      {!value && !isFocused && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full dotted-bg" />
        </div>
      )}
    </div>
  );
}
