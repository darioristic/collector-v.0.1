"use client";

import type { Table } from "@tanstack/react-table";

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
}

export function DataTableToolbar<TData>({
	table: _table,
}: DataTableToolbarProps<TData>) {
	return null;
}
