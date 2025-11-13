"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { generateAvatarFallback } from "@/lib/utils";
import type { Employee } from "../types";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const statusVariantMap: Record<Employee["status"], "success" | "warning" | "destructive"> = {
  Active: "success",
  "On Leave": "warning",
  Terminated: "destructive"
};

interface EmployeesTableProps {
  employees: Employee[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  sortField: "name" | "startDate" | "status";
  sortOrder: "asc" | "desc";
  onSortChange: (field: "name" | "startDate" | "status") => void;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const getAvatarUrl = (employee: Employee) =>
  `https://avatar.vercel.sh/${encodeURIComponent(employee.email)}.svg?size=64&text=${encodeURIComponent(employee.firstName.charAt(0))}`;

const formatCurrency = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
};

export default function EmployeesTable({
  employees,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  sortField,
  sortOrder,
  onSortChange,
  onView,
  onEdit,
  onDelete
}: EmployeesTableProps) {
  const sortedIndicator = (field: "name" | "startDate" | "status") =>
    sortField === field ? (sortOrder === "asc" ? "↑" : "↓") : "";

  return (
    <div className="space-y-4">
      <div className="bg-card hidden overflow-hidden rounded-xl border shadow-sm lg:block">
        <Table>
          <TableHeader className="bg-card/95 sticky top-0 z-10 backdrop-blur">
            <TableRow>
              <TableHead className="w-[240px] cursor-pointer" onClick={() => onSortChange("name")}>
                <div className="flex items-center gap-2">
                  Employee
                  <span className="text-muted-foreground text-xs">{sortedIndicator("name")}</span>
                </div>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Employment type</TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSortChange("status")}>
                <div className="flex items-center gap-2">
                  Status
                  <span className="text-muted-foreground text-xs">{sortedIndicator("status")}</span>
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSortChange("startDate")}>
                <div className="flex items-center gap-2">
                  Start date
                  <span className="text-muted-foreground text-xs">
                    {sortedIndicator("startDate")}
                  </span>
                </div>
              </TableHead>
              <TableHead>Salary</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow
                key={employee.id}
                className="group hover:bg-muted/40 cursor-pointer transition"
                onClick={() => onView(employee)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="border-border size-11 border">
                      <AvatarImage src={getAvatarUrl(employee)} alt={employee.fullName} />
                      <AvatarFallback>{generateAvatarFallback(employee.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="leading-tight font-medium">{employee.fullName}</span>
                      <span className="text-muted-foreground text-xs">{employee.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{employee.role ?? "—"}</TableCell>
                <TableCell>{employee.department ?? "—"}</TableCell>
                <TableCell>{employee.employmentType}</TableCell>
                <TableCell>
                  <Badge variant={statusVariantMap[employee.status]} size="xs">
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell>{dateFormatter.format(new Date(employee.startDate))}</TableCell>
                <TableCell>{formatCurrency(employee.salary)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(employee);
                      }}
                      aria-label={`Edit ${employee.fullName}`}>
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive size-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(employee);
                      }}
                      aria-label={`Delete ${employee.fullName}`}>
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        onView(employee);
                      }}
                      aria-label={`View ${employee.fullName}`}>
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="group border-border bg-card hover:border-primary/40 rounded-xl border p-4 shadow-sm transition">
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => onView(employee)}
                className="flex flex-1 items-center gap-3 text-left">
                <Avatar className="border-border size-12 border">
                  <AvatarImage src={getAvatarUrl(employee)} alt={employee.fullName} />
                  <AvatarFallback>{generateAvatarFallback(employee.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="leading-tight font-semibold">{employee.fullName}</span>
                  <span className="text-muted-foreground text-xs">{employee.email}</span>
                  <span className="text-muted-foreground mt-1 text-xs">
                    {employee.role ?? "Role not set"} · {employee.department ?? "No department"}
                  </span>
                </div>
              </button>
              <Badge variant={statusVariantMap[employee.status]} size="xs">
                {employee.status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Employment</p>
                <p className="font-medium">{employee.employmentType}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Start date</p>
                <p className="font-medium">{dateFormatter.format(new Date(employee.startDate))}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Salary</p>
                <p className="font-medium">{formatCurrency(employee.salary)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">End date</p>
                <p className="font-medium">
                  {employee.endDate ? dateFormatter.format(new Date(employee.endDate)) : "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onEdit(employee)}
                aria-label={`Edit ${employee.fullName}`}>
                <Pencil className="mr-2 size-4" aria-hidden="true" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(employee)}
                aria-label={`Delete ${employee.fullName}`}>
                <Trash2 className="mr-2 size-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      {employees.length === 0 && !isLoading ? (
        <div className="text-muted-foreground text-center text-sm">
          No employees match your filters.
        </div>
      ) : null}
    </div>
  );
}
