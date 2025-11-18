import { flexRender, type Row } from "@tanstack/react-table";
import * as React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import type { EnhancedCompanyRow } from "../utils/company-helpers";

interface MemoizedTableRowProps {
	row: Row<EnhancedCompanyRow>;
	onRowClick: (company: EnhancedCompanyRow) => void;
}

/**
 * Memoizovana TableRow komponenta za optimizaciju performansi
 * Re-renderuje se samo kada se promeni row data ili selection state
 */
export const MemoizedTableRow = React.memo<MemoizedTableRowProps>(
	({ row, onRowClick }) => {
		const handleClick = React.useCallback(
			(e: React.MouseEvent<HTMLTableRowElement>) => {
				// Don't open if clicking on action buttons or checkbox
				const target = e.target as HTMLElement;
				if (
					target.closest("button") ||
					target.closest("input[type='checkbox']") ||
					target.closest("a")
				) {
					return;
				}
				onRowClick(row.original);
			},
			[onRowClick, row.original],
		);

		return (
			<TableRow
				key={row.id}
				data-state={row.getIsSelected() && "selected"}
				className="hover:bg-muted/50 cursor-pointer transition-colors"
				onClick={handleClick}
			>
				{row.getVisibleCells().map((cell) => (
					<TableCell key={cell.id} className="align-middle">
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</TableCell>
				))}
			</TableRow>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison function
		// Re-render only if:
		// 1. Row ID changed
		// 2. Selection state changed
		// 3. Row data changed (shallow comparison)
		const prevRow = prevProps.row;
		const nextRow = nextProps.row;

		if (prevRow.id !== nextRow.id) {
			return false; // Different row, need to re-render
		}

		if (prevRow.getIsSelected() !== nextRow.getIsSelected()) {
			return false; // Selection changed, need to re-render
		}

		// Shallow comparison of row data
		const prevData = prevRow.original;
		const nextData = nextRow.original;

		if (prevData.id !== nextData.id) {
			return false;
		}

		// Compare key properties that might change
		const keysToCompare: (keyof EnhancedCompanyRow)[] = [
			"name",
			"email",
			"phone",
			"taxId",
			"type",
			"country",
		];

		for (const key of keysToCompare) {
			if (prevData[key] !== nextData[key]) {
				return false; // Data changed, need to re-render
			}
		}

		// No changes detected, skip re-render
		return true;
	},
);

MemoizedTableRow.displayName = "MemoizedTableRow";
