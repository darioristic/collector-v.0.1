import { eq, inArray, sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import {
	attendanceRecords,
	employeeRoleAssignments,
	employees,
	payrollEntries,
	timeOffRequests,
} from "../schema/hr.schema";
import { roles, users } from "../schema/settings.schema";

type EmployeeSeedData = {
	email: string;
	name: string;
	employeeNumber: string;
	department: string;
	managerEmail?: string;
	hiredAt: Date;
	status: "active" | "on_leave" | "terminated" | "contractor";
};

const EMPLOYEES_DATA: EmployeeSeedData[] = [
	{
		email: "marko.petrovic@collectorlabs.test",
		name: "Marko Petrović",
		employeeNumber: "EMP001",
		department: "Development",
		hiredAt: new Date("2020-03-15"),
		status: "active",
	},
	{
		email: "jovana.jovanovic@collectorlabs.test",
		name: "Jovana Jovanović",
		employeeNumber: "EMP002",
		department: "Development",
		managerEmail: "marko.petrovic@collectorlabs.test",
		hiredAt: new Date("2021-07-01"),
		status: "active",
	},
	{
		email: "stefan.nikolic@collectorlabs.test",
		name: "Stefan Nikolić",
		employeeNumber: "EMP003",
		department: "Development",
		managerEmail: "marko.petrovic@collectorlabs.test",
		hiredAt: new Date("2022-01-10"),
		status: "active",
	},
	{
		email: "ana.markovic@collectorlabs.test",
		name: "Ana Marković",
		employeeNumber: "EMP004",
		department: "Development",
		managerEmail: "marko.petrovic@collectorlabs.test",
		hiredAt: new Date("2019-11-20"),
		status: "active",
	},
	{
		email: "milos.radovic@collectorlabs.test",
		name: "Miloš Radović",
		employeeNumber: "EMP005",
		department: "DevOps",
		hiredAt: new Date("2020-05-10"),
		status: "active",
	},
	{
		email: "ivana.tomic@collectorlabs.test",
		name: "Ivana Tomić",
		employeeNumber: "EMP006",
		department: "QA",
		hiredAt: new Date("2020-08-01"),
		status: "active",
	},
	{
		email: "marija.kostic@collectorlabs.test",
		name: "Marija Kostić",
		employeeNumber: "EMP007",
		department: "Product",
		hiredAt: new Date("2020-01-15"),
		status: "active",
	},
	{
		email: "snezana.pavlovic@collectorlabs.test",
		name: "Snežana Pavlović",
		employeeNumber: "EMP008",
		department: "HR",
		hiredAt: new Date("2019-04-01"),
		status: "active",
	},
	{
		email: "maja.radosavljevic@collectorlabs.test",
		name: "Maja Radosavljević",
		employeeNumber: "EMP009",
		department: "Development",
		managerEmail: "marko.petrovic@collectorlabs.test",
		hiredAt: new Date("2021-01-15"),
		status: "on_leave",
	},
	{
		email: "dejan.vasic@collectorlabs.test",
		name: "Dejan Vasić",
		employeeNumber: "EMP010",
		department: "Development",
		managerEmail: "marko.petrovic@collectorlabs.test",
		hiredAt: new Date("2023-01-01"),
		status: "contractor",
	},
];

type HrSeedResult = {
	employeesCreated: number;
	roleAssignmentsCreated: number;
	attendanceRecordsCreated: number;
	timeOffRequestsCreated: number;
	payrollEntriesCreated: number;
};

export const seedHr = async (database = defaultDb): Promise<void> => {
	await database.transaction(async (tx) => {
		// Get existing users
		const existingUsers = await tx
			.select({
				id: users.id,
				email: users.email,
			})
			.from(users);

		const userMap = new Map(
			existingUsers.map((u) => [u.email.toLowerCase(), u.id]),
		);

		// Get existing roles
		const existingRoles = await tx
			.select({
				id: roles.id,
				key: roles.key,
			})
			.from(roles);

		const roleMap = new Map(existingRoles.map((r) => [r.key, r.id]));

		// Get or create employees
		const employeeMap = new Map<string, string>();
		const managerMap = new Map<string, string>();

		for (const empData of EMPLOYEES_DATA) {
			const userId = userMap.get(empData.email.toLowerCase()) || null;

			const [employee] = await tx
				.insert(employees)
				.values({
					userId,
					employeeNumber: empData.employeeNumber,
					status: empData.status,
					department: empData.department,
					hiredAt: empData.hiredAt,
				})
				.onConflictDoUpdate({
					target: employees.employeeNumber,
					set: {
						status: empData.status,
						department: empData.department,
						hiredAt: empData.hiredAt,
						updatedAt: sql`NOW()`,
					},
				})
				.returning();

			if (employee) {
				employeeMap.set(empData.email.toLowerCase(), employee.id);
				if (empData.managerEmail) {
					managerMap.set(empData.email.toLowerCase(), empData.managerEmail);
				}
			}
		}

		// Update manager relationships
		for (const [employeeEmail, managerEmail] of managerMap.entries()) {
			const employeeId = employeeMap.get(employeeEmail);
			const managerId = employeeMap.get(managerEmail.toLowerCase());

			if (employeeId && managerId) {
				await tx
					.update(employees)
					.set({ managerId })
					.where(eq(employees.id, employeeId));
			}
		}

		// Assign roles to employees (assign user role by default)
		const userRoleId = roleMap.get("user");
		if (userRoleId) {
			const roleAssignments = Array.from(employeeMap.values()).map((employeeId) => ({
				employeeId,
				roleId: userRoleId,
			}));

			if (roleAssignments.length > 0) {
				await tx
					.insert(employeeRoleAssignments)
					.values(roleAssignments)
					.onConflictDoNothing();
			}
		}

		// Create attendance records for last 30 days
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const attendanceData: Array<{
			employeeId: string;
			date: Date;
			status: string;
			checkIn: Date;
			checkOut: Date;
		}> = [];

		for (let day = 0; day < 30; day++) {
			const date = new Date(today);
			date.setDate(date.getDate() - day);

			// Skip weekends
			if (date.getDay() === 0 || date.getDay() === 6) {
				continue;
			}

			for (const employeeId of employeeMap.values()) {
				// Randomly skip some days (sick leave, etc.)
				if (Math.random() < 0.1) {
					continue;
				}

				const checkIn = new Date(date);
				checkIn.setHours(9 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

				const checkOut = new Date(date);
				checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

				attendanceData.push({
					employeeId,
					date,
					status: "present",
					checkIn,
					checkOut,
				});
			}
		}

		if (attendanceData.length > 0) {
			await tx
				.insert(attendanceRecords)
				.values(attendanceData)
				.onConflictDoNothing();
		}

		// Create time off requests
		const timeOffData = [
			{
				employeeEmail: "jovana.jovanovic@collectorlabs.test",
				startDate: new Date("2024-12-20"),
				endDate: new Date("2024-12-27"),
				reason: "Godišnji odmor",
				status: "approved",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "stefan.nikolic@collectorlabs.test",
				startDate: new Date("2024-12-15"),
				endDate: new Date("2024-12-17"),
				reason: "Bolovanje",
				status: "approved",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "ana.markovic@collectorlabs.test",
				startDate: new Date("2025-01-10"),
				endDate: new Date("2025-01-15"),
				reason: "Planirani odmor",
				status: "pending",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
		];

		const timeOffToInsert = [];

		for (const timeOff of timeOffData) {
			const employeeId = employeeMap.get(timeOff.employeeEmail.toLowerCase());
			const approverId = userMap.get(timeOff.approverEmail.toLowerCase()) || null;

			if (employeeId) {
				timeOffToInsert.push({
					employeeId,
					startDate: timeOff.startDate,
					endDate: timeOff.endDate,
					reason: timeOff.reason,
					status: timeOff.status,
					approvedBy: approverId,
				});
			}
		}

		if (timeOffToInsert.length > 0) {
			await tx.insert(timeOffRequests).values(timeOffToInsert);
		}

		// Create payroll entries for last 3 months
		const payrollData: Array<{
			employeeId: string;
			periodStart: Date;
			periodEnd: Date;
			grossPay: number;
			netPay: number;
		}> = [];

		const baseSalaries = new Map([
			["marko.petrovic@collectorlabs.test", 180000],
			["jovana.jovanovic@collectorlabs.test", 140000],
			["stefan.nikolic@collectorlabs.test", 130000],
			["ana.markovic@collectorlabs.test", 170000],
			["milos.radovic@collectorlabs.test", 160000],
			["ivana.tomic@collectorlabs.test", 150000],
			["marija.kostic@collectorlabs.test", 190000],
			["snezana.pavlovic@collectorlabs.test", 145000],
		]);

		for (let month = 0; month < 3; month++) {
			const periodStart = new Date(today);
			periodStart.setMonth(periodStart.getMonth() - month - 1);
			periodStart.setDate(1);
			periodStart.setHours(0, 0, 0, 0);

			const periodEnd = new Date(periodStart);
			periodEnd.setMonth(periodEnd.getMonth() + 1);
			periodEnd.setDate(0);
			periodEnd.setHours(23, 59, 59, 999);

			for (const [email, employeeId] of employeeMap.entries()) {
				const grossPay = baseSalaries.get(email) || 100000;
				const netPay = Math.round(grossPay * 0.7); // 30% tax approximation

				payrollData.push({
					employeeId,
					periodStart,
					periodEnd,
					grossPay,
					netPay,
				});
			}
		}

		if (payrollData.length > 0) {
			await tx.insert(payrollEntries).values(payrollData);
		}
	});
};

