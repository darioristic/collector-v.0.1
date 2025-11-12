const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
});

export const formatCurrency = (value: number) =>
	currencyFormatter.format(value);

export const formatDate = (value?: Date | string | null) => {
	if (!value) {
		return "—";
	}

	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "—";
	}

	return dateFormatter.format(date);
};

export const getInitials = (value?: string | null) => {
	if (!value) {
		return "NA";
	}

	const segments = value.trim().split(/\s+/).filter(Boolean);

	if (segments.length === 0) {
		return "NA";
	}

	if (segments.length === 1) {
		return segments[0].slice(0, 2).toUpperCase();
	}

	return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase();
};
