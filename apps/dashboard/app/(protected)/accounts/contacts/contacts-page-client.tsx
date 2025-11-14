"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TablePageHeader } from "@/components/ui/page-header";

import ContactsDataTable, {
	type Contact,
	type ContactsDataTableHandle,
} from "./data-table";

type ContactsPageClientProps = {
	data: Contact[];
	error: string | null;
};

export default function ContactsPageClient({
	data,
	error,
}: ContactsPageClientProps) {
	const tableRef = React.useRef<ContactsDataTableHandle>(null);

	return (
		<div className="space-y-8">
			<TablePageHeader
				title="Contacts"
				description="Browse account contacts and quickly find the people you collaborate with."
				actions={
					<Button
						type="button"
						onClick={() => tableRef.current?.openAddDialog()}
						className="gap-2"
						disabled={Boolean(error)}
					>
						<Plus className="size-4" aria-hidden="true" />
						Add Contact
					</Button>
				}
			/>

			{error ? (
				<Alert variant="destructive">
					<AlertTitle>Loading failed</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : (
				<ContactsDataTable
					ref={tableRef}
					data={data}
					showAddActionInToolbar={false}
				/>
			)}
		</div>
	);
}
