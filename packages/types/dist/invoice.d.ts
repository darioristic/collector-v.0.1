export interface LineItem {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    vat?: number;
    unit?: string;
    discountRate?: number;
}
export interface TemplateLabels {
    from_label: string;
    customer_label: string;
    description_label: string;
    quantity_label: string;
    price_label: string;
    total_label: string;
    vat_label: string;
    tax_label?: string;
    payment_label: string;
    note_label: string;
    include_vat?: boolean;
    include_tax?: boolean;
    tax_rate?: number;
}
