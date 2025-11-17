import { format } from "date-fns";
import Image from "next/image";
import type { TemplateConfig } from "../types";

type Props = {
  template: TemplateConfig;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
};

export function Meta({ template: _template, invoiceNumber, issueDate, dueDate }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="font-mono text-sm">
        <div className="mb-2 text-[14px] font-bold">
          <span className="text-muted-foreground">Invoice NO: </span>
          <span className="text-foreground font-normal">{invoiceNumber}</span>
        </div>
        <div className="mb-2 text-[11px]">
          <span className="text-muted-foreground">Issue date: </span>
          <span className="text-foreground font-normal">
            {format(new Date(issueDate), "dd/MM/yyyy")}
          </span>
        </div>
        {dueDate && (
          <div className="text-[11px]">
            <span className="text-muted-foreground">Due date: </span>
            <span className="text-foreground font-normal">
              {format(new Date(dueDate), "dd/MM/yyyy")}
            </span>
          </div>
        )}
      </div>
      {_template.logo_url && (
        <div className="flex-shrink-0">
          <Image
            src={_template.logo_url}
            alt="Company Logo"
            width={120}
            height={48}
            className="h-12 w-auto max-w-[120px] object-contain"
          />
        </div>
      )}
    </div>
  );
}
