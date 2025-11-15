export interface EditorDoc {
  type?: string;
  content?: EditorNode[];
}

export interface EditorNode {
  type: string;
  content?: EditorInlineContent[];
  attrs?: Record<string, unknown>;
}

export interface EditorInlineContent {
  type: string;
  text?: string;
  marks?: EditorMark[];
  attrs?: Record<string, unknown>;
}

export interface EditorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface LineItem {
  name: string;
  price: number;
  quantity: number;
  vat?: number;
  unit?: string;
  discountRate?: number;
}

export interface TemplateConfig {
  logo_url?: string;
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

export interface TemplateProps {
  invoice_number: string;
  issue_date: string;
  due_date?: string | null;
  template: TemplateConfig;
  line_items: LineItem[];
  customer_details?: JSON;
  from_details?: JSON;
  payment_details?: JSON;
  note_details?: JSON;
  currency: string;
  customer_name: string;
  width?: string | number;
  height?: string | number;
  amountBeforeDiscount?: number;
  discountTotal?: number;
  subtotal?: number;
  totalVat?: number;
  total?: number;
}

