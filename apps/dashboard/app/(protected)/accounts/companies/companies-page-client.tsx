"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TablePageHeader } from "@/components/ui/page-header";

import CompaniesDataTable, {
	type CompaniesDataTableHandle,
	type CompanyRow,
} from "./data-table";

type CompaniesPageClientProps = {
	data: CompanyRow[];
	error: string | null;
};

export default function CompaniesPageClient({
	data,
	error,
}: CompaniesPageClientProps) {
	const tableRef = React.useRef<CompaniesDataTableHandle>(null);

	return (
		<div className="space-y-8">
			<TablePageHeader
				title="Companies"
				description="Manage company accounts, validate primary contacts, and keep business records up to date."
				actions={
					<Button
						type="button"
						onClick={() => tableRef.current?.openCreateDialog()}
						className="gap-2"
						disabled={Boolean(error)}
					>
						<Plus className="size-4" aria-hidden="true" />
						Add Company
					</Button>
				}
			/>

			{error ? (
				<Alert variant="destructive">
					<AlertTitle>Failed to load data</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : (
				<CompaniesDataTable
					ref={tableRef}
					data={data}
					showCreateActionInToolbar={false}
				/>
			)}
		</div>
	);
}
