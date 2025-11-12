"use client";

import type { Lead } from "@crm/types";
import { Plus } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LeadsDataTable, type LeadsDataTableHandle } from "./data-table";

type LeadsPageClientProps = {
	data: Lead[];
	error: string | null;
};

export default function LeadsPageClient({ data, error }: LeadsPageClientProps) {
	const tableRef = React.useRef<LeadsDataTableHandle>(null);

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight">CRM Leads</h1>
					<p className="text-muted-foreground text-sm">
						Monitor each lead’s status, source, and next steps to keep your
						pipeline moving.
					</p>
				</div>
				<Button
					type="button"
					onClick={() => tableRef.current?.openAddDialog()}
					className="gap-2"
					disabled={Boolean(error)}
				>
					<Plus className="size-4" aria-hidden="true" />
					New Lead
				</Button>
			</div>

			{error ? (
				<Alert variant="destructive">
					<AlertTitle>Loading Failed</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : (
				<LeadsDataTable
					ref={tableRef}
					data={data}
					showAddActionInToolbar={false}
				/>
			)}
		</div>
	);
}
