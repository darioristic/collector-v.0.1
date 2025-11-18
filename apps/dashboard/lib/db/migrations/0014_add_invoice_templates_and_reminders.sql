CREATE TABLE "invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" integer NOT NULL,
	"logo_url" text,
	"size" "invoice_size" DEFAULT 'a4' NOT NULL,
	"include_vat" boolean DEFAULT true,
	"include_tax" boolean DEFAULT false,
	"tax_rate" numeric(5, 2),
	"date_format" date_format DEFAULT 'yyyy-MM-dd' NOT NULL,
	"locale" varchar(10) DEFAULT 'en-US',
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"customer_label" varchar(100) DEFAULT 'To',
	"from_label" varchar(100) DEFAULT 'From',
	"invoice_no_label" varchar(100) DEFAULT 'Invoice No',
	"issue_date_label" varchar(100) DEFAULT 'Issue Date',
	"due_date_label" varchar(100) DEFAULT 'Due Date',
	"description_label" varchar(100) DEFAULT 'Description',
	"price_label" varchar(100) DEFAULT 'Price',
	"quantity_label" varchar(100) DEFAULT 'Quantity',
	"total_label" varchar(100) DEFAULT 'Total',
	"vat_label" varchar(100) DEFAULT 'VAT',
	"tax_label" varchar(100) DEFAULT 'Tax',
	"payment_label" varchar(100) DEFAULT 'Payment Details',
	"note_label" varchar(100) DEFAULT 'Note',
	"from_details" json,
	"payment_details" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_templates_company_id_unique" UNIQUE("company_id")
);

ALTER TABLE "invoices" ADD COLUMN "reminder_sent_at" timestamp with time zone;
ALTER TABLE "invoices" ADD COLUMN "reminder_count" integer DEFAULT 0;
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "invoice_templates_company_id_idx" ON "invoice_templates" USING btree ("company_id");