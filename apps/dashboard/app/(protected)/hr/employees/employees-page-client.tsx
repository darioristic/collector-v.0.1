"use client";

import * as React from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  mapEmployeeToFormValues,
  updateEmployee
} from "./api";
import EmployeesEmptyState from "./components/employees-empty-state";
import EmployeeDrawer from "./components/employee-drawer";
import EmployeeFormDialog from "./components/employee-form-dialog";
import DeleteEmployeeDialog from "./components/delete-employee-dialog";
import EmployeesSkeleton from "./components/employees-skeleton";
import EmployeesTable from "./components/employees-table";
import EmployeesToolbar from "./components/employees-toolbar";
import { EMPLOYEES_PAGE_SIZE } from "./constants";
import type { EmployeeFormValues } from "./schemas";
import type { Employee, EmployeesQueryState } from "./types";

interface EmployeesPageClientProps {
  initialQuery: EmployeesQueryState;
}

const hasFilters = (query: EmployeesQueryState, searchValue: string) =>
  Boolean(query.department) || Boolean(query.status) || Boolean(query.employmentType) || Boolean(searchValue);

export default function EmployeesPageClient({ initialQuery }: EmployeesPageClientProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [queryState, setQueryState] = React.useState<EmployeesQueryState>({
    ...initialQuery,
    limit: initialQuery.limit ?? EMPLOYEES_PAGE_SIZE
  });
  const [searchValue, setSearchValue] = React.useState(initialQuery.search ?? "");

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [formInitialValues, setFormInitialValues] = React.useState<EmployeeFormValues | undefined>(undefined);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<Employee | null>(null);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setQueryState((prev) => ({
        ...prev,
        search: searchValue.trim().length > 0 ? searchValue.trim() : undefined
      }));
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchValue]);

  const queryKey = React.useMemo(() => ["employees", queryState] as const, [queryState]);

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchEmployees({
        query: queryState,
        cursor: typeof pageParam === "string" ? pageParam : undefined
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    staleTime: 0,
    refetchOnWindowFocus: false,
    keepPreviousData: true
  });

  const employees = React.useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data?.pages]);

  const availableDepartments = React.useMemo(() => {
    const departments = new Set<string>();
    employees.forEach((employee) => {
      if (employee.department) {
        departments.add(employee.department);
      }
    });
    return Array.from(departments).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  React.useEffect(() => {
    if (selectedEmployee) {
      const updated = employees.find((employee) => employee.id === selectedEmployee.id);
      if (updated) {
        setSelectedEmployee(updated);
      }
    }
  }, [employees, selectedEmployee]);

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (employee) => {
      toast({
        title: "Employee created",
        description: `${employee.fullName} has been added successfully.`
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsFormOpen(false);
      setSelectedEmployee(employee);
      setIsDrawerOpen(true);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error.message
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<EmployeeFormValues> }) =>
      updateEmployee(id, values),
    onSuccess: (employee) => {
      toast({
        title: "Employee updated",
        description: `${employee.fullName} has been updated.`
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsFormOpen(false);
      setSelectedEmployee(employee);
      setIsDrawerOpen(true);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: (_, id) => {
      toast({
        title: "Employee deleted",
        description: "The employee has been removed."
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEmployeeToDelete(null);
      if (selectedEmployee?.id === id) {
        setSelectedEmployee(null);
        setIsDrawerOpen(false);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message
      });
    }
  });

  const handleOpenCreate = React.useCallback(() => {
    setFormMode("create");
    setFormInitialValues(undefined);
    setIsFormOpen(true);
    setEditingEmployee(null);
  }, []);

  const handleOpenEdit = React.useCallback(
    (employee: Employee) => {
      const values = mapEmployeeToFormValues(employee);
      setFormMode("edit");
      setFormInitialValues(values);
      setEditingEmployee(employee);
      setIsFormOpen(true);
    },
    []
  );

  const handleViewEmployee = React.useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDrawerOpen(true);
  }, []);

  const handleSubmitForm = React.useCallback(
    (values: EmployeeFormValues) => {
      if (formMode === "create") {
        createMutation.mutate(values);
        return;
      }

      if (!editingEmployee) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "No employee selected for editing."
        });
        return;
      }

      updateMutation.mutate({
        id: editingEmployee.id,
        values
      });
    },
    [createMutation, editingEmployee, formMode, toast, updateMutation]
  );

  const handleDelete = React.useCallback((employee: Employee) => {
    setEmployeeToDelete(employee);
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete.id);
    }
  }, [deleteMutation, employeeToDelete]);

  const handleFiltersChange = React.useCallback(
    (nextFilters: { department?: string; status?: string; employmentType?: string }) => {
      setQueryState((prev) => ({
        ...prev,
        department: nextFilters.department ?? undefined,
        status: nextFilters.status ?? undefined,
        employmentType: nextFilters.employmentType ?? undefined
      }));
    },
    []
  );

  const handleSortFieldChange = React.useCallback((field: EmployeesQueryState["sortField"]) => {
    setQueryState((prev) => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field ? prev.sortOrder : "asc"
    }));
  }, []);

  const handleSortOrderToggle = React.useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc"
    }));
  }, []);

  const handleTableSortChange = React.useCallback(
    (field: EmployeesQueryState["sortField"]) => {
      setQueryState((prev) => ({
        ...prev,
        sortField: field,
        sortOrder: prev.sortField === field && prev.sortOrder === "asc" ? "desc" : "asc"
      }));
    },
    []
  );

  const handleResetFilters = React.useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      search: undefined,
      department: undefined,
      employmentType: undefined,
      status: undefined
    }));
    setSearchValue("");
  }, []);

  const isInitialLoading = isLoading && !data;
  const isEmpty = !isLoading && employees.length === 0;
  const filtersActive = hasFilters(queryState, searchValue);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/hr">HR</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Employees</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Stay on top of your workforce, manage status changes, and keep employee records up to date.
            </p>
          </div>
          <Button type="button" onClick={handleOpenCreate} className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Add Employee
          </Button>
        </div>
      </div>

      <EmployeesToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={{
          department: queryState.department,
          status: queryState.status,
          employmentType: queryState.employmentType
        }}
        onFiltersChange={handleFiltersChange}
        sortField={queryState.sortField}
        sortOrder={queryState.sortOrder}
        onSortFieldChange={handleSortFieldChange}
        onSortOrderToggle={handleSortOrderToggle}
        availableDepartments={availableDepartments}
        isDisabled={isFetching && !employees.length}
        onResetFilters={handleResetFilters}
      />

      {isInitialLoading ? (
        <EmployeesSkeleton />
      ) : isEmpty && !filtersActive ? (
        <EmployeesEmptyState onAdd={handleOpenCreate} />
      ) : (
        <EmployeesTable
          employees={employees}
          isLoading={isFetching && employees.length === 0}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          onLoadMore={() => fetchNextPage()}
          sortField={queryState.sortField}
          sortOrder={queryState.sortOrder}
          onSortChange={handleTableSortChange}
          onView={handleViewEmployee}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      <EmployeeDrawer
        open={isDrawerOpen && Boolean(selectedEmployee)}
        employee={selectedEmployee}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <EmployeeFormDialog
        open={isFormOpen}
        mode={formMode}
        initialValues={formInitialValues ?? undefined}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <DeleteEmployeeDialog
        open={Boolean(employeeToDelete)}
        employeeName={employeeToDelete?.fullName ?? null}
        isLoading={deleteMutation.isPending}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <Button
        type="button"
        className="sm:hidden fixed bottom-6 right-6 z-50 shadow-lg"
        onClick={handleOpenCreate}
      >
        <Plus className="mr-2 size-4" aria-hidden="true" />
        Add Employee
      </Button>
    </div>
  );
}

