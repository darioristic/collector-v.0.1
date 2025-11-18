import type { LineItem } from "@crm/types";
export declare function LineItemsCore({ items, currency, descriptionLabel, priceLabel, totalLabel, includeVAT, }: {
    items: LineItem[];
    currency?: string;
    descriptionLabel?: string;
    priceLabel?: string;
    totalLabel?: string;
    includeVAT?: boolean;
}): import("react/jsx-runtime").JSX.Element;
