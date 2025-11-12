import { UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import AddEmployeeDialog from "./AddEmployeeDialog";

export default function EmployeesEmptyState() {
  return (
    <div className="border-muted-foreground/40 bg-muted/40 flex flex-col items-center justify-center rounded-xl border border-dashed px-8 py-12 text-center shadow-sm">
      <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
        <UserRoundPlus className="size-7" aria-hidden="true" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">No employees yet</h3>
      <p className="text-muted-foreground mt-2 max-w-lg text-sm">
        Add your first employee to start tracking HR data, monitor their status, and collaborate
        with your HR team.
      </p>
      <AddEmployeeDialog>
        <Button type="button" className="mt-6">
          Add Employee
        </Button>
      </AddEmployeeDialog>
    </div>
  );
}
