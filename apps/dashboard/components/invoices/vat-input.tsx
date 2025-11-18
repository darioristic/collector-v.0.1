import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import {
	CurrencyInput,
	type CurrencyInputProps,
} from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";

export function VATInput({
	className,
	name,
	...props
}: Omit<CurrencyInputProps, "value" | "onChange"> & {
	name: string;
	className?: string;
}) {
	const { control } = useFormContext();
	const {
		field: { value, onChange, onBlur },
	} = useController({
		name,
		control,
	});

	const [isFocused, setIsFocused] = useState(false);

	return (
		<div className="relative">
			<CurrencyInput
				suffix="%"
				autoComplete="off"
				value={value}
				onChange={(newValue) => {
					const clampedValue = Math.min(Math.max(newValue || 0, 0), 100);
					onChange(clampedValue);
				}}
				onFocus={() => setIsFocused(true)}
				onBlur={() => {
					setIsFocused(false);
					onBlur();
				}}
				{...props}
				className={cn(
					className,
					"p-0 border-0 h-6 text-xs bg-transparent! border-b border-transparent focus:border-border font-mono",
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
