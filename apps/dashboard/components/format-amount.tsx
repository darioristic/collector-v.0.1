"use client";

import { formatCurrency } from "@/lib/utils";

type FormatAmountProps = {
	amount: number;
	currency?: string;
	className?: string;
};

export function FormatAmount({
	amount,
	currency = "USD",
	className,
}: FormatAmountProps) {
	return <span className={className}>{formatCurrency(amount, currency)}</span>;
}
