import { format } from "date-fns";
import Image from "next/image";
import type { TemplateConfig } from "../types";

type Props = {
	template: TemplateConfig;
	invoiceNumber: string;
	issueDate: string;
	dueDate?: string | null;
};

export function Meta({
	template: _template,
	invoiceNumber,
	issueDate,
	dueDate,
}: Props) {
	return (
		<div className="flex items-center justify-between gap-4 mb-3">
			<div className="font-mono text-[11px] space-y-0.5">
				<div>
					<span className="text-muted-foreground">Invoice No: </span>
					<span className="text-foreground">{invoiceNumber}</span>
				</div>
				<div>
					<span className="text-muted-foreground">Issue Date: </span>
					<span className="text-foreground">
						{format(new Date(issueDate), "dd/MM/yyyy")}
					</span>
				</div>
				{dueDate && (
					<div>
						<span className="text-muted-foreground">Due Date: </span>
						<span className="text-foreground">
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
						width={64}
						height={64}
						className="h-16 w-16 object-contain"
					/>
				</div>
			)}
		</div>
	);
}
