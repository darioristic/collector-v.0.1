import type { Account } from "@crm/types";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type AccountsTableProps = {
	accounts: Account[];
};

export default function AccountsTable({ accounts }: AccountsTableProps) {
	if (!accounts.length) {
		return (
			<div className="rounded-md border border-dashed p-6 text-center">
				<h2 className="text-2xl font-semibold tracking-tight">
					Accounts Overview
				</h2>
				<p className="text-muted-foreground mt-2 text-sm">
					Accounts will appear here as soon as you create or import them.
				</p>
			</div>
		);
	}

	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-2xl font-semibold tracking-tight">
					Accounts Overview
				</h2>
				<p className="text-muted-foreground mt-1 text-sm">
					Review key details for customer, partner, and vendor accounts at a
					glance.
				</p>
			</div>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead className="text-right">Updated</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{accounts.map((account) => (
							<TableRow key={account.id}>
								<TableCell className="font-medium">{account.name}</TableCell>
								<TableCell>
									<Badge variant="outline" className="capitalize">
										{account.type}
									</Badge>
								</TableCell>
								<TableCell>{account.email ?? "—"}</TableCell>
								<TableCell>{account.phone ?? "—"}</TableCell>
								<TableCell className="text-right">
									{new Date(
										account.updatedAt ?? account.createdAt,
									).toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</section>
	);
}
