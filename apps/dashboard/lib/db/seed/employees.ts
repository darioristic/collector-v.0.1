import { employees } from "../schema/employees";
import type { DashboardDatabase } from "./seed-runner";

type EmployeeSeedData = {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	department: string;
	role: string;
	employmentType: "Full-time" | "Contractor" | "Intern";
	status: "Active" | "On Leave" | "Terminated";
	startDate: Date;
	endDate?: Date;
	salary?: number;
};

const EMPLOYEES_DATA: EmployeeSeedData[] = [
	// Development - Backend (4)
	{
		firstName: "Marko",
		lastName: "Petrović",
		email: "marko.petrovic@techfirm.rs",
		phone: "+381 64 123 4567",
		department: "Development",
		role: "Senior Backend Developer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2020-03-15"),
		salary: 180000,
	},
	{
		firstName: "Jovana",
		lastName: "Jovanović",
		email: "jovana.jovanovic@techfirm.rs",
		phone: "+381 64 234 5678",
		department: "Development",
		role: "Backend Developer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2021-07-01"),
		salary: 140000,
	},
	{
		firstName: "Stefan",
		lastName: "Nikolić",
		email: "stefan.nikolic@techfirm.rs",
		phone: "+381 64 345 6789",
		department: "Development",
		role: "Backend Developer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2022-01-10"),
		salary: 130000,
	},
	{
		firstName: "Milica",
		lastName: "Stojanović",
		email: "milica.stojanovic@techfirm.rs",
		phone: "+381 64 456 7890",
		department: "Development",
		role: "Junior Backend Developer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2023-06-01"),
		salary: 90000,
	},
	// Development - Frontend (4)
	{
		firstName: "Ana",
		lastName: "Marković",
		email: "ana.markovic@techfirm.rs",
		phone: "+381 64 567 8901",
		department: "Development",
		role: "Senior Frontend Developer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2019-11-20"),
		salary: 170000,
	},
	{
		firstName: "Nikola",
		lastName: "Đorđević",
		email: "nikola.djordjevic@techfirm.rs",
		phone: "+381 64 678 9012",
		department: "Development",
		role: "Frontend Developer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2021-09-15"),
		salary: 135000,
	},
	{
		firstName: "Jelena",
		lastName: "Ilić",
		email: "jelena.ilic@techfirm.rs",
		phone: "+381 64 789 0123",
		department: "Development",
		role: "Frontend Developer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2022-03-01"),
		salary: 125000,
	},
	{
		firstName: "Luka",
		lastName: "Popović",
		email: "luka.popovic@techfirm.rs",
		phone: "+381 64 890 1234",
		department: "Development",
		role: "Junior Frontend Developer",
		employmentType: "Intern",
		status: "Active",
		startDate: new Date("2024-01-15"),
		salary: 50000,
	},
	// DevOps (2)
	{
		firstName: "Miloš",
		lastName: "Radović",
		email: "milos.radovic@techfirm.rs",
		phone: "+381 64 901 2345",
		department: "DevOps",
		role: "DevOps Engineer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2020-05-10"),
		salary: 160000,
	},
	{
		firstName: "Sara",
		lastName: "Mladenović",
		email: "sara.mladenovic@techfirm.rs",
		phone: "+381 64 012 3456",
		department: "DevOps",
		role: "Junior DevOps Engineer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2023-02-20"),
		salary: 110000,
	},
	// QA/Testing (2)
	{
		firstName: "Ivana",
		lastName: "Tomić",
		email: "ivana.tomic@techfirm.rs",
		phone: "+381 64 123 7890",
		department: "QA",
		role: "QA Lead",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2020-08-01"),
		salary: 150000,
	},
	{
		firstName: "Đorđe",
		lastName: "Lazić",
		email: "djordje.lazic@techfirm.rs",
		phone: "+381 64 234 8901",
		department: "QA",
		role: "QA Engineer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2022-05-15"),
		salary: 120000,
	},
	// Design (2)
	{
		firstName: "Tamara",
		lastName: "Vuković",
		email: "tamara.vukovic@techfirm.rs",
		phone: "+381 64 345 9012",
		department: "Design",
		role: "Senior UI/UX Designer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2019-06-01"),
		salary: 155000,
	},
	{
		firstName: "Nemanja",
		lastName: "Stefanović",
		email: "nemanja.stefanovic@techfirm.rs",
		phone: "+381 64 456 0123",
		department: "Design",
		role: "UI Designer",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2021-11-01"),
		salary: 115000,
	},
	// Product Management (2)
	{
		firstName: "Marija",
		lastName: "Kostić",
		email: "marija.kostic@techfirm.rs",
		phone: "+381 64 567 1234",
		department: "Product",
		role: "Product Manager",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2020-01-15"),
		salary: 190000,
	},
	{
		firstName: "Vladimir",
		lastName: "Milić",
		email: "vladimir.milic@techfirm.rs",
		phone: "+381 64 678 2345",
		department: "Product",
		role: "Associate Product Manager",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2022-09-01"),
		salary: 130000,
	},
	// HR (2)
	{
		firstName: "Snežana",
		lastName: "Pavlović",
		email: "snezana.pavlovic@techfirm.rs",
		phone: "+381 64 789 3456",
		department: "HR",
		role: "HR Manager",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2019-04-01"),
		salary: 145000,
	},
	{
		firstName: "Bojan",
		lastName: "Janković",
		email: "bojan.jankovic@techfirm.rs",
		phone: "+381 64 890 4567",
		department: "HR",
		role: "HR Specialist",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2021-03-15"),
		salary: 105000,
	},
	// Marketing (2)
	{
		firstName: "Katarina",
		lastName: "Ristić",
		email: "katarina.ristic@techfirm.rs",
		phone: "+381 64 901 5678",
		department: "Marketing",
		role: "Marketing Manager",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2020-07-01"),
		salary: 140000,
	},
	{
		firstName: "Aleksandar",
		lastName: "Mitić",
		email: "aleksandar.mitic@techfirm.rs",
		phone: "+381 64 012 6789",
		department: "Marketing",
		role: "Digital Marketing Specialist",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2022-04-01"),
		salary: 100000,
	},
	// Sales (2)
	{
		firstName: "Dragana",
		lastName: "Stanković",
		email: "dragana.stankovic@techfirm.rs",
		phone: "+381 64 123 7890",
		department: "Sales",
		role: "Sales Manager",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2019-09-01"),
		salary: 165000,
	},
	{
		firstName: "Marko",
		lastName: "Đukić",
		email: "marko.djukic@techfirm.rs",
		phone: "+381 64 234 8901",
		department: "Sales",
		role: "Sales Representative",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2021-05-01"),
		salary: 110000,
	},
	// Support (2)
	{
		firstName: "Jovana",
		lastName: "Novaković",
		email: "jovana.novakovic@techfirm.rs",
		phone: "+381 64 345 9012",
		department: "Support",
		role: "Support Team Lead",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2020-10-01"),
		salary: 125000,
	},
	{
		firstName: "Stefan",
		lastName: "Milosavljević",
		email: "stefan.milosavljevic@techfirm.rs",
		phone: "+381 64 456 0123",
		department: "Support",
		role: "Customer Support Specialist",
		employmentType: "Full-time",
		status: "Active",
		startDate: new Date("2022-11-01"),
		salary: 85000,
	},
	// On Leave (1)
	{
		firstName: "Maja",
		lastName: "Radosavljević",
		email: "maja.radosavljevic@techfirm.rs",
		phone: "+381 64 567 1234",
		department: "Development",
		role: "Full Stack Developer",
		employmentType: "Full-time",
		status: "On Leave",
		startDate: new Date("2021-01-15"),
		salary: 145000,
	},
	// Contractor (1)
	{
		firstName: "Dejan",
		lastName: "Vasić",
		email: "dejan.vasic@techfirm.rs",
		phone: "+381 64 678 2345",
		department: "Development",
		role: "Senior Full Stack Developer",
		employmentType: "Contractor",
		status: "Active",
		startDate: new Date("2023-01-01"),
		endDate: new Date("2024-12-31"),
		salary: 200000,
	},
];

type EmployeesSeedResult = {
	inserted: number;
	skipped: number;
};

export async function seedEmployees(
	db: DashboardDatabase,
): Promise<EmployeesSeedResult> {
	let existingEmployees: Array<{ email: string }>;
	try {
		existingEmployees = await db
			.select({ email: employees.email })
			.from(employees);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorString = String(error).toLowerCase();

		// Proveri različite formate grešaka koje PostgreSQL vraća kada tabela ne postoji
		if (
			errorMessage.includes("does not exist") ||
			errorMessage.includes("relation") ||
			errorMessage.includes("table") ||
			errorMessage.includes("Failed query") ||
			errorString.includes("does not exist") ||
			errorString.includes("relation") ||
			(errorString.includes("employees") && errorString.includes("exist"))
		) {
			throw new Error(
				"Tabela 'employees' ne postoji u bazi podataka. Molimo pokrenite migracije pre pokretanja seed skripte:\n" +
					"  bun run db:migrate\n" +
					"  ili\n" +
					"  cd apps/dashboard && bun run db:migrate\n\n" +
					`Originalna greška: ${errorMessage}`,
			);
		}
		throw error;
	}

	const existingEmails = new Set(
		existingEmployees.map((emp) => emp.email.toLowerCase()),
	);

	const employeesToInsert = EMPLOYEES_DATA.filter(
		(emp) => !existingEmails.has(emp.email.toLowerCase()),
	);

	if (employeesToInsert.length === 0) {
		return {
			inserted: 0,
			skipped: EMPLOYEES_DATA.length,
		};
	}

	await db.transaction(async (tx) => {
		await Promise.all(
			employeesToInsert.map((emp) => {
				// Normalize optional values to null instead of undefined
				const phoneValue = emp.phone ? emp.phone : null;
				const endDateValue = emp.endDate ? emp.endDate : null;
				const salaryValue = emp.salary ? emp.salary.toString() : null;

				const values = {
					firstName: emp.firstName,
					lastName: emp.lastName,
					email: emp.email,
					phone: phoneValue,
					department: emp.department,
					role: emp.role,
					employmentType: emp.employmentType,
					status: emp.status,
					startDate: emp.startDate,
					endDate: endDateValue,
					salary: salaryValue,
				};

				return tx
					.insert(employees)
					.values(values)
					.onConflictDoUpdate({
						target: employees.email,
						set: {
							firstName: emp.firstName,
							lastName: emp.lastName,
							phone: phoneValue,
							department: emp.department,
							role: emp.role,
							employmentType: emp.employmentType,
							status: emp.status,
							startDate: emp.startDate,
							endDate: endDateValue,
							salary: salaryValue,
							updatedAt: new Date(),
						},
					});
			}),
		);
	});

	return {
		inserted: employeesToInsert.length,
		skipped: EMPLOYEES_DATA.length - employeesToInsert.length,
	};
}
