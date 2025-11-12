import { UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmployeesEmptyStateProps {
	onAdd: () => void;
}

export default function EmployeesEmptyState({
	onAdd,
}: EmployeesEmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/40 px-8 py-12 text-center shadow-sm">
			<div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
				<UserRoundPlus className="size-7" aria-hidden="true" />
			</div>
			<h3 className="mt-6 text-2xl font-semibold tracking-tight">
				No employees yet
			</h3>
			<p className="text-muted-foreground mt-2 max-w-lg text-sm">
				Add your first employee to start tracking HR data, monitor their status,
				and collaborate with your HR team.
			</p>
			<Button type="button" className="mt-6" onClick={onAdd}>
				Add Employee
			</Button>
		</div>
	);
}
