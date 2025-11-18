import * as React from "react";

export function MetaCore({
  invoiceNumber,
  issueDate,
  dueDate,
  fromLabel = "From",
  customerLabel = "Bill To",
}: {
  invoiceNumber: string;
  issueDate: string | Date | null;
  dueDate: string | Date | null;
  fromLabel?: string;
  customerLabel?: string;
}) {
  const fmtDate = (d: any) => {
    if (!d) return "—";
    const date = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  };
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] text-[#878787] font-mono">Invoice NO:</p>
        <p className="text-[14px] font-semibold">{invoiceNumber}</p>
      </div>
      <div className="text-right">
        <p className="text-[11px] text-[#878787] font-mono">Issue date:</p>
        <p className="text-[14px] font-semibold">{fmtDate(issueDate)}</p>
        <p className="text-[11px] text-[#878787] font-mono mt-2">Due date:</p>
        <p className="text-[14px] font-semibold">{fmtDate(dueDate)}</p>
      </div>
    </div>
  );
}

