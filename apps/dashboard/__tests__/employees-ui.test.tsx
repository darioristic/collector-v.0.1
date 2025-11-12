"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import EmployeeFormDialog from "@/app/(protected)/hr/employees/components/employee-form-dialog";
import EmployeesTable from "@/app/(protected)/hr/employees/components/employees-table";
import type { Employee } from "@/app/(protected)/hr/employees/types";

describe("Employees UI", () => {
	it("submits parsed employee form data", async () => {
		const handleSubmit = vi.fn();
		const handleClose = vi.fn();
		const user = userEvent.setup();

		render(
			<EmployeeFormDialog
				open
				mode="create"
				initialValues={undefined}
				isSubmitting={false}
				onClose={handleClose}
				onSubmit={handleSubmit}
			/>,
		);

		await user.type(screen.getByLabelText(/First name/i), "Ana");
		await user.type(screen.getByLabelText(/Last name/i), "Jovanovic");
		await user.type(screen.getByLabelText(/Email/i), "ana@example.com");
		await user.type(screen.getByLabelText(/Phone/i), "+381601234567");
		await user.type(screen.getByLabelText(/Department/i), "Engineering");
		await user.type(
			screen.getByLabelText(/Role \/ Position/i),
			"Frontend Developer",
		);
		await user.type(screen.getByLabelText(/Start date/i), "2024-01-15");
		await user.type(screen.getByLabelText(/Salary \(optional\)/i), "85000");

		await user.click(screen.getByRole("button", { name: /Create employee/i }));

		await waitFor(() => expect(handleSubmit).toHaveBeenCalledTimes(1));

		const payload = handleSubmit.mock.calls[0][0];

		expect(payload.firstName).toBe("Ana");
		expect(payload.lastName).toBe("Jovanovic");
		expect(payload.email).toBe("ana@example.com");
		expect(payload.department).toBe("Engineering");
		expect(payload.role).toBe("Frontend Developer");
		expect(payload.startDate).toBeInstanceOf(Date);
		expect(payload.salary).toBe(85000);
	});

	it("renders empty state messaging when table has no data and triggers sort", async () => {
		const handleSortChange = vi.fn();
		const handleView = vi.fn();
		const handleEdit = vi.fn();
		const handleDelete = vi.fn();
		const handleLoadMore = vi.fn();
		const user = userEvent.setup();

		render(
			<EmployeesTable
				employees={[]}
				isLoading={false}
				isFetchingNextPage={false}
				hasNextPage={false}
				onLoadMore={handleLoadMore}
				sortField="name"
				sortOrder="asc"
				onSortChange={handleSortChange}
				onView={handleView}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>,
		);

		expect(
			screen.getByText(/No employees match your filters/i),
		).toBeInTheDocument();

		await user.click(screen.getByRole("columnheader", { name: /Employee/i }));

		expect(handleSortChange).toHaveBeenCalledWith("name");
	});

	it("invokes load more callback when pagination button clicked", async () => {
		const employees: Employee[] = [
			{
				id: 1,
				firstName: "Ana",
				lastName: "Jovanovic",
				fullName: "Ana Jovanovic",
				email: "ana@example.com",
				phone: null,
				department: "Engineering",
				role: "Frontend Developer",
				employmentType: "Full-time",
				status: "Active",
				startDate: new Date("2024-01-15").toISOString(),
				endDate: null,
				salary: 85000,
				createdAt: new Date("2024-01-01").toISOString(),
				updatedAt: new Date("2024-01-01").toISOString(),
			},
		];

		const handleLoadMore = vi.fn();
		const user = userEvent.setup();

		render(
			<EmployeesTable
				employees={employees}
				isLoading={false}
				isFetchingNextPage={false}
				hasNextPage
				onLoadMore={handleLoadMore}
				sortField="name"
				sortOrder="asc"
				onSortChange={vi.fn()}
				onView={vi.fn()}
				onEdit={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Load more/i }));
		expect(handleLoadMore).toHaveBeenCalledTimes(1);
	});
});
