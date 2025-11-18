import { CurrencyInput } from "@/components/ui/currency-input";
import { useController, useFormContext } from "react-hook-form";

export function TaxInput() {
  const { control } = useFormContext();
  const {
    field: { value, onChange },
  } = useController({
    name: "template.tax_rate",
    control,
  });

  return (
    <CurrencyInput
      suffix="%)"
      prefix="("
      autoComplete="off"
      value={value}
      onChange={(newValue) => {
        const clampedValue = newValue === undefined ? undefined : Math.min(Math.max(newValue, 0), 100);
        onChange(clampedValue);
      }}
      className="p-0 border-0 h-6 text-xs !bg-transparent font-mono flex-shrink-0 w-10 text-[11px] text-[#878787]"
    />
  );
}
