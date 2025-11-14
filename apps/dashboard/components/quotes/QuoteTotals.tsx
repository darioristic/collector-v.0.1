"use client";

import { useEffect } from "react";
import { useWatch, type Control, type FieldValues } from "react-hook-form";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { QuoteItemCreateInput } from "@crm/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type QuoteTotalsFormValues = FieldValues & {
	items: QuoteItemCreateInput[];
};

type QuoteTotalsProps<TFormValues extends QuoteTotalsFormValues = QuoteTotalsFormValues> = {
	control: Control<TFormValues>;
	currency?: string;
	className?: string;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
	EUR: "€",
	USD: "$",
	GBP: "£",
};

function AnimatedNumber({ value }: { value: number }) {
	const motionValue = useMotionValue(value);
	const spring = useSpring(motionValue, {
		damping: 20,
		stiffness: 90,
	});
	const display = useTransform(spring, (latest) => latest.toFixed(2));

	useEffect(() => {
		motionValue.set(value);
	}, [value, motionValue]);

	return <motion.span>{display}</motion.span>;
}

export function QuoteTotals<TFormValues extends QuoteTotalsFormValues = QuoteTotalsFormValues>({
	control,
	currency = "EUR",
	className,
}: QuoteTotalsProps<TFormValues>) {
	const items =
		(useWatch({
			control,
			name: "items",
		}) as QuoteItemCreateInput[] | undefined) ?? [];

	const subtotal = items.reduce((acc, item) => {
		return acc + (item.quantity || 0) * (item.unitPrice || 0);
	}, 0);

	const tax = subtotal * 0.2;
	const total = subtotal + tax;

	const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

	return (
		<Card className={className}>
			<CardContent className="p-6">
				<div className="space-y-4">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Subtotal:</span>
						<span className="font-medium">
							{currencySymbol}
							<AnimatedNumber value={subtotal} />
						</span>
					</div>

					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Tax (20%):</span>
						<span className="font-medium">
							{currencySymbol}
							<AnimatedNumber value={tax} />
						</span>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<span className="text-lg font-semibold">Total:</span>
						<motion.span
							className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
							key={total}
							initial={{ scale: 1.1 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.2 }}
						>
							{currencySymbol}
							<AnimatedNumber value={total} />
						</motion.span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

