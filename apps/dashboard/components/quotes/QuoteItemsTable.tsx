"use client";

import type { QuoteItemCreateInput } from "@crm/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import {
	type Control,
	useFieldArray,
	useFormContext,
	useWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type QuoteItem = QuoteItemCreateInput & {
	id: string;
};

type QuoteItemsFormValues = {
	items: QuoteItemCreateInput[];
};

type QuoteItemsTableProps = {
	control: Control<QuoteItemsFormValues>;
};

export function QuoteItemsTable({ control }: QuoteItemsTableProps) {
	const { fields, append, remove } = useFieldArray<QuoteItemsFormValues>({
		control,
		name: "items",
		keyName: "id",
	});

	const { setValue } = useFormContext<QuoteItemsFormValues>();
	const items =
		(useWatch({
			control,
			name: "items",
		}) as QuoteItemCreateInput[] | undefined) ?? [];

	const tableItems: QuoteItem[] = fields.map((field, index) => ({
		id: field.id,
		description: items[index]?.description || "",
		quantity: items[index]?.quantity || 1,
		unitPrice: items[index]?.unitPrice || 0,
	}));

	const columns = useMemo<ColumnDef<QuoteItem>[]>(
		() => [
			{
				accessorKey: "description",
				header: "Description",
				cell: ({ row }) => {
					const index = row.index;
					return (
						<Input
							placeholder="Item description"
							value={row.original.description || ""}
							onChange={(e) => {
								setValue(`items.${index}.description`, e.target.value);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									// Focus next cell (quantity)
									const currentRow = e.currentTarget.closest("tr");
									const nextInput = currentRow?.querySelector(
										'input[type="number"]',
									) as HTMLInputElement;
									nextInput?.focus();
								}
							}}
							className="border-0 bg-transparent shadow-none focus-visible:ring-1"
						/>
					);
				},
			},
			{
				accessorKey: "quantity",
				header: "Quantity",
				cell: ({ row }) => {
					const index = row.index;
					return (
						<Input
							type="number"
							min="1"
							step="1"
							placeholder="1"
							value={row.original.quantity || 1}
							onChange={(e) => {
								const value = Number.parseFloat(e.target.value) || 1;
								setValue(`items.${index}.quantity`, value);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === "Tab") {
									e.preventDefault();
									// Focus next cell (unit price)
									const currentRow = e.currentTarget.closest("tr");
									const inputs = currentRow?.querySelectorAll(
										'input[type="number"]',
									);
									if (inputs && inputs.length > 1) {
										(inputs[1] as HTMLInputElement)?.focus();
									}
								}
							}}
							className="border-0 bg-transparent shadow-none focus-visible:ring-1"
						/>
					);
				},
			},
			{
				accessorKey: "unitPrice",
				header: "Unit Price",
				cell: ({ row }) => {
					const index = row.index;
					return (
						<Input
							type="number"
							min="0"
							step="0.01"
							placeholder="0.00"
							value={row.original.unitPrice || 0}
							onChange={(e) => {
								const value = Number.parseFloat(e.target.value) || 0;
								setValue(`items.${index}.unitPrice`, value);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									const emptyItem: QuoteItemCreateInput = {
										description: "",
										quantity: 1,
										unitPrice: 0,
									};
									append(emptyItem);
									// Focus first input of new row after a short delay
									setTimeout(() => {
										const tbody = e.currentTarget.closest("tbody");
										const newRow = tbody?.querySelector(
											"tr:last-child input",
										) as HTMLInputElement;
										newRow?.focus();
									}, 100);
								}
							}}
							className="border-0 bg-transparent shadow-none focus-visible:ring-1"
						/>
					);
				},
			},
			{
				id: "total",
				header: "Total",
				cell: ({ row }) => {
					const quantity = row.original.quantity || 0;
					const unitPrice = row.original.unitPrice || 0;
					const total = quantity * unitPrice;
					return <span className="font-medium">{total.toFixed(2)}</span>;
				},
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const index = row.index;
					return (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => remove(index)}
							disabled={fields.length === 1}
							className="h-8 w-8 p-0"
						>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					);
				},
			},
		],
		[append, fields.length, remove, setValue],
	);

	const table = useReactTable({
		data: tableItems,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const handleAddItem = () => {
		append({ description: "", quantity: 1, unitPrice: 0 });
		// Focus first input of new row after a short delay
		setTimeout(() => {
			const newRow = document.querySelector(
				"tbody tr:last-child input",
			) as HTMLInputElement;
			newRow?.focus();
		}, 100);
	};

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className={
											header.id === "description"
												? "w-[40%]"
												: header.id === "quantity"
													? "w-[15%]"
													: header.id === "unitPrice"
														? "w-[20%]"
														: header.id === "total"
															? "w-[15%]"
															: "w-[10%]"
										}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						<AnimatePresence>
							{table.getRowModel().rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No items. Click &quot;Add Item&quot; to add one.
									</TableCell>
								</TableRow>
							) : (
								table.getRowModel().rows.map((row) => (
									<motion.tr
										key={row.id}
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, x: -20 }}
										transition={{ duration: 0.2 }}
										className="border-b"
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</motion.tr>
								))
							)}
						</AnimatePresence>
					</TableBody>
				</Table>
			</div>

			<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={handleAddItem}
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					Add Item
				</Button>
			</motion.div>
		</div>
	);
}
