import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Building2,
	CalendarClock,
	Eye,
	Mail,
	Pencil,
	Phone,
	Receipt as ReceiptIcon,
	Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { EnhancedCompanyRow } from "../utils/company-helpers";
import { formatTag } from "../utils/company-helpers";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const SortIcon = ({ direction }: { direction: false | "asc" | "desc" }) => {
	if (direction === "asc") {
		return <ArrowUp className="ml-2 h-3.5 w-3.5" />;
	}

	if (direction === "desc") {
		return <ArrowDown className="ml-2 h-3.5 w-3.5" />;
	}

	return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-60" />;
};

export const createColumns = (
	handleView: (company: EnhancedCompanyRow) => void,
	handleEdit: (company: EnhancedCompanyRow) => void,
	handleDelete: (company: EnhancedCompanyRow) => void,
): ColumnDef<EnhancedCompanyRow>[] => {
	const renderSortableHeader = (
		column: HeaderContext<EnhancedCompanyRow, unknown>["column"],
		label: string,
	) => (
		<Button
			variant="ghost"
			className="flex w-full items-center justify-between px-2 text-left font-semibold"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
		>
			{label}
			<SortIcon direction={column.getIsSorted()} />
		</Button>
	);

	return [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) =>
						table.toggleAllPageRowsSelected(Boolean(value))
					}
					aria-label="Select all companies"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
					aria-label={`Select company ${row.original.name}`}
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "name",
			header: ({ column }) => renderSortableHeader(column, "Company"),
			cell: ({ row }) => {
				const company = row.original;

				return (
					<div className="flex items-start gap-3">
						<div className="bg-muted hidden h-10 w-10 shrink-0 items-center justify-center rounded-full sm:flex">
							<Building2 className="text-muted-foreground h-5 w-5" />
						</div>
						<div className="min-w-0 space-y-2">
							<div className="space-y-1">
								<span className="text-foreground block text-sm leading-tight font-semibold sm:text-sm">
									{company.name}
								</span>
								{company.primaryContactName && (
									<span className="text-muted-foreground block truncate text-xs sm:text-sm">
										{company.primaryContactName}
									</span>
								)}
							</div>
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "email",
			header: ({ column }) => renderSortableHeader(column, "Email"),
			cell: ({ row }) => {
				const email = row.original.email;
				return email ? (
					<div className="flex items-center gap-2">
						<Mail className="text-muted-foreground h-4 w-4" />
						<a
							href={`mailto:${email}`}
							className="text-primary font-medium hover:underline"
						>
							{email}
						</a>
					</div>
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			accessorKey: "phone",
			header: ({ column }) => renderSortableHeader(column, "Phone"),
			cell: ({ row }) => {
				const phone = row.original.phone;
				return phone ? (
					<div className="flex items-center gap-2">
						<Phone className="text-muted-foreground h-4 w-4" />
						<a href={`tel:${phone}`} className="hover:underline">
							{phone}
						</a>
					</div>
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			id: "companyId",
			accessorFn: (row) => row.registrationNumber,
			header: ({ column }) => renderSortableHeader(column, "Company ID"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<ReceiptIcon className="text-muted-foreground h-4 w-4" />
					<span className="font-medium">{row.original.registrationNumber}</span>
				</div>
			),
		},
		{
			accessorKey: "taxId",
			header: ({ column }) => renderSortableHeader(column, "Tax ID"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<ReceiptIcon className="text-muted-foreground h-4 w-4" />
					<span className="font-medium">{row.original.taxId}</span>
				</div>
			),
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => renderSortableHeader(column, "Created"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<CalendarClock className="text-muted-foreground h-4 w-4" />
					<span>{dateFormatter.format(new Date(row.original.createdAt))}</span>
				</div>
			),
		},
		{
			accessorKey: "type",
			header: ({ column }) => renderSortableHeader(column, "Tag"),
			cell: ({ row }) => (
				<Badge variant="outline" className="capitalize">
					{formatTag(row.original.type)}
				</Badge>
			),
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Actions</span>,
			cell: ({ row }) => {
				const company = row.original;

				return (
					<div className="flex items-center justify-end gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleView(company)}
							aria-label="View"
						>
							<Eye className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleEdit(company)}
							aria-label="Edit"
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleDelete(company)}
							aria-label="Delete"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				);
			},
			enableSorting: false,
			enableHiding: false,
		},
	];
};
