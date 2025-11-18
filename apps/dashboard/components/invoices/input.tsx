import { cn } from "@/lib/utils";
import { Input as BaseInput, type InputProps } from "@/components/ui/input";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

export function Input({ className, ...props }: InputProps) {
  const { register, watch } = useFormContext();
  const [isFocused, setIsFocused] = useState(false);
  const fieldName = props.name as string;
  const fieldValue = watch(fieldName);

  const { ref, ...rest } = register(fieldName, {
    valueAsNumber: props.type === "number",
  });

  return (
    <div className="relative">
      <BaseInput
        {...props}
        {...rest}
        ref={ref}
        autoComplete="off"
        value={fieldValue || ""}
        className={cn(
          "border-0 p-0 h-6 border-b border-transparent focus:border-border font-mono text-xs",
          className,
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {!fieldValue && !isFocused && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full dotted-bg" />
        </div>
      )}
    </div>
  );
}
