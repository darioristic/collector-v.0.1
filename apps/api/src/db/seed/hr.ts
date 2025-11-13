import { eq, inArray, sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import {
	attendanceRecords,
	employeeRoleAssignments,
	employees,
	payrollEntries,
	performanceReviews,
	recruitmentCandidates,
	recruitmentInterviews,
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
	console.log("[HR Seed] Starting HR seed process...");
	await database.transaction(async (tx) => {
		console.log("[HR Seed] Transaction started");
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

		// Create recruitment candidates
		const candidatesData = [
			{
				firstName: "Nikola",
				lastName: "Stojanović",
				email: "nikola.stojanovic@example.com",
				phone: "+381 64 123 4567",
				position: "Software Engineer",
				status: "applied" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Milica",
				lastName: "Đorđević",
				email: "milica.djordjevic@example.com",
				phone: "+381 65 234 5678",
				position: "Software Engineer",
				status: "screening" as const,
				source: "Job Board",
			},
			{
				firstName: "Luka",
				lastName: "Milošević",
				email: "luka.milosevic@example.com",
				phone: "+381 63 345 6789",
				position: "Software Engineer",
				status: "interview" as const,
				source: "Referral",
			},
			{
				firstName: "Jelena",
				lastName: "Popović",
				email: "jelena.popovic@example.com",
				phone: "+381 64 456 7890",
				position: "QA Engineer",
				status: "interview" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Stefan",
				lastName: "Lazić",
				email: "stefan.lazic@example.com",
				phone: "+381 65 567 8901",
				position: "DevOps Engineer",
				status: "offer" as const,
				source: "Job Board",
			},
			{
				firstName: "Tamara",
				lastName: "Stefanović",
				email: "tamara.stefanovic@example.com",
				phone: "+381 63 678 9012",
				position: "Product Manager",
				status: "hired" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Marko",
				lastName: "Jovanović",
				email: "marko.jovanovic@example.com",
				phone: "+381 64 789 0123",
				position: "Software Engineer",
				status: "rejected" as const,
				source: "Job Board",
			},
			{
				firstName: "Sara",
				lastName: "Milić",
				email: "sara.milic@example.com",
				phone: "+381 65 890 1234",
				position: "QA Engineer",
				status: "applied" as const,
				source: "Referral",
			},
			{
				firstName: "Nemanja",
				lastName: "Ristić",
				email: "nemanja.ristic@example.com",
				phone: "+381 63 901 2345",
				position: "Software Engineer",
				status: "screening" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Ivana",
				lastName: "Novaković",
				email: "ivana.novakovic@example.com",
				phone: "+381 64 012 3456",
				position: "Frontend Developer",
				status: "interview" as const,
				source: "Job Board",
			},
			{
				firstName: "Aleksandar",
				lastName: "Petrović",
				email: "aleksandar.petrovic@example.com",
				phone: "+381 65 123 4567",
				position: "Backend Developer",
				status: "offer" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Marija",
				lastName: "Nikolić",
				email: "marija.nikolic@example.com",
				phone: "+381 63 234 5678",
				position: "HR Specialist",
				status: "hired" as const,
				source: "Referral",
			},
			{
				firstName: "Đorđe",
				lastName: "Stanković",
				email: "djordje.stankovic@example.com",
				phone: "+381 64 345 6789",
				position: "Software Engineer",
				status: "rejected" as const,
				source: "Job Board",
			},
			{
				firstName: "Jovana",
				lastName: "Vuković",
				email: "jovana.vukovic@example.com",
				phone: "+381 65 456 7890",
				position: "QA Engineer",
				status: "applied" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Vladimir",
				lastName: "Đukić",
				email: "vladimir.djukic@example.com",
				phone: "+381 63 567 8901",
				position: "DevOps Engineer",
				status: "screening" as const,
				source: "Job Board",
			},
			{
				firstName: "Tijana",
				lastName: "Mladenović",
				email: "tijana.mladenovic@example.com",
				phone: "+381 64 678 9012",
				position: "Product Manager",
				status: "interview" as const,
				source: "Referral",
			},
			{
				firstName: "Bojan",
				lastName: "Pavlović",
				email: "bojan.pavlovic@example.com",
				phone: "+381 65 789 0123",
				position: "Software Engineer",
				status: "offer" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Nevena",
				lastName: "Krstić",
				email: "nevena.krstic@example.com",
				phone: "+381 63 890 1234",
				position: "Frontend Developer",
				status: "hired" as const,
				source: "Job Board",
			},
			{
				firstName: "Miloš",
				lastName: "Simić",
				email: "milos.simic@example.com",
				phone: "+381 64 901 2345",
				position: "Backend Developer",
				status: "rejected" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Anđela",
				lastName: "Tomić",
				email: "andjela.tomic@example.com",
				phone: "+381 65 012 3456",
				position: "QA Engineer",
				status: "applied" as const,
				source: "Referral",
			},
			{
				firstName: "Stefan",
				lastName: "Marinković",
				email: "stefan.marinkovic@example.com",
				phone: "+381 63 123 4567",
				position: "Software Engineer",
				status: "screening" as const,
				source: "Job Board",
			},
			{
				firstName: "Jelena",
				lastName: "Bogdanović",
				email: "jelena.bogdanovic@example.com",
				phone: "+381 64 234 5678",
				position: "DevOps Engineer",
				status: "interview" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Nikola",
				lastName: "Živković",
				email: "nikola.zivkovic@example.com",
				phone: "+381 65 345 6789",
				position: "Product Manager",
				status: "offer" as const,
				source: "Job Board",
			},
			{
				firstName: "Milica",
				lastName: "Lukić",
				email: "milica.lukic@example.com",
				phone: "+381 63 456 7890",
				position: "HR Specialist",
				status: "hired" as const,
				source: "Referral",
			},
			{
				firstName: "Luka",
				lastName: "Maksimović",
				email: "luka.maksimovic@example.com",
				phone: "+381 64 567 8901",
				position: "Software Engineer",
				status: "rejected" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Sara",
				lastName: "Radosavljević",
				email: "sara.radosavljevic@example.com",
				phone: "+381 65 678 9012",
				position: "Frontend Developer",
				status: "applied" as const,
				source: "Job Board",
			},
			{
				firstName: "Nemanja",
				lastName: "Mitić",
				email: "nemanja.mitic@example.com",
				phone: "+381 63 789 0123",
				position: "Backend Developer",
				status: "screening" as const,
				source: "LinkedIn",
			},
			{
				firstName: "Ivana",
				lastName: "Gavrilović",
				email: "ivana.gavrilovic@example.com",
				phone: "+381 64 890 1234",
				position: "QA Engineer",
				status: "interview" as const,
				source: "Referral",
			},
			{
				firstName: "Aleksandar",
				lastName: "Stojković",
				email: "aleksandar.stojkovic@example.com",
				phone: "+381 65 901 2345",
				position: "Software Engineer",
				status: "offer" as const,
				source: "Job Board",
			},
		];

		// Insert recruitment candidates
		console.log(`[HR Seed] Inserting ${candidatesData.length} recruitment candidates...`);
		
		// Check existing candidates
		const existingCandidates = await tx
			.select({ email: recruitmentCandidates.email })
			.from(recruitmentCandidates);

		const existingEmails = new Set(
			existingCandidates.map((c) => c.email.toLowerCase()),
		);

		const newCandidatesData = candidatesData.filter(
			(c) => !existingEmails.has(c.email.toLowerCase()),
		);

		console.log(`[HR Seed] Found ${existingCandidates.length} existing candidates, inserting ${newCandidatesData.length} new candidates`);

		let insertedCandidates = [];

		if (newCandidatesData.length > 0) {
			insertedCandidates = await tx
				.insert(recruitmentCandidates)
				.values(newCandidatesData)
				.returning();
			
			console.log(`[HR Seed] Successfully inserted ${insertedCandidates.length} candidates`);
		}

		// Get all candidates (existing + newly inserted) for interview creation
		const allCandidateEmails = candidatesData.map((c) => c.email);
		const allCandidates = allCandidateEmails.length > 0
			? await tx
					.select()
					.from(recruitmentCandidates)
					.where(inArray(recruitmentCandidates.email, allCandidateEmails))
			: [];

		console.log(`[HR Seed] Total candidates available for interviews: ${allCandidates.length}`);

		const candidateMap = new Map(
			allCandidates.map((c) => [c.email.toLowerCase(), c.id]),
		);

		// Create recruitment interviews
		const interviewsData: Array<{
			candidateEmail: string;
			interviewerEmail: string;
			scheduledAt: Date;
			type: "phone" | "video" | "onsite" | "technical" | "hr";
			status: "scheduled" | "completed" | "cancelled" | "rescheduled";
			notes?: string;
			rating?: number;
		}> = [];

		// Create interviews for candidates in interview/offer status
		const candidatesForInterviews = allCandidates.filter(
			(c) => c.status === "interview" || c.status === "offer" || c.status === "hired",
		);

		console.log(`[HR Seed] Found ${candidatesForInterviews.length} candidates eligible for interviews`);

		const interviewerEmails = Array.from(userMap.keys()).slice(0, 5);
		const interviewTypes: Array<"phone" | "video" | "onsite" | "technical" | "hr"> = [
			"phone",
			"video",
			"onsite",
			"technical",
			"hr",
		];
		const interviewStatuses: Array<"scheduled" | "completed" | "cancelled" | "rescheduled"> = [
			"scheduled",
			"completed",
			"cancelled",
			"rescheduled",
		];

		for (let i = 0; i < Math.min(25, candidatesForInterviews.length * 2); i++) {
			const candidate = candidatesForInterviews[i % candidatesForInterviews.length];
			const candidateEmail = candidate.email;
			if (!candidateEmail) continue;

			const scheduledAt = new Date();
			scheduledAt.setDate(scheduledAt.getDate() + Math.floor(Math.random() * 30) - 15);
			scheduledAt.setHours(10 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 4) * 15, 0, 0);

			const type = interviewTypes[Math.floor(Math.random() * interviewTypes.length)];
			const status =
				scheduledAt < new Date()
					? interviewStatuses[Math.floor(Math.random() * 3) + 1] // completed, cancelled, or rescheduled
					: "scheduled";

			const interviewerEmail = interviewerEmails[Math.floor(Math.random() * interviewerEmails.length)];

			interviewsData.push({
				candidateEmail,
				interviewerEmail,
				scheduledAt,
				type,
				status,
				notes:
					status === "completed"
						? `Intervju je prošao ${type === "technical" ? "odlično" : "dobro"}. Kandidat pokazuje dobre veštine.`
						: undefined,
				rating: status === "completed" ? 3 + Math.floor(Math.random() * 3) : undefined,
			});
		}

		const interviewsToInsert = [];

		for (const interview of interviewsData) {
			const candidateId = candidateMap.get(interview.candidateEmail.toLowerCase());
			const interviewerId = userMap.get(interview.interviewerEmail.toLowerCase());

			if (candidateId && interviewerId) {
				interviewsToInsert.push({
					candidateId,
					interviewerId,
					scheduledAt: interview.scheduledAt,
					type: interview.type,
					status: interview.status,
					notes: interview.notes || null,
					rating: interview.rating || null,
				});
			}
		}

		if (interviewsToInsert.length > 0) {
			await tx.insert(recruitmentInterviews).values(interviewsToInsert).onConflictDoNothing();
			console.log(`[HR Seed] Successfully inserted ${interviewsToInsert.length} interviews`);
		}

		// Create performance reviews
		const performanceReviewsData: Array<{
			employeeEmail: string;
			reviewerEmail: string;
			reviewDate: Date;
			periodStart: Date;
			periodEnd: Date;
			rating: number;
			comments: string;
			goals: string;
		}> = [];

		const activeEmployees = Array.from(employeeMap.entries()).filter(
			([email]) => !email.includes("dejan.vasic") && !email.includes("maja.radosavljevic"),
		);

		for (let i = 0; i < Math.min(25, activeEmployees.length * 3); i++) {
			const [employeeEmail, employeeId] = activeEmployees[i % activeEmployees.length];
			const managerEmail = managerMap.get(employeeEmail) || "marko.petrovic@collectorlabs.test";
			const reviewerId = userMap.get(managerEmail.toLowerCase());

			if (!reviewerId) continue;

			const reviewDate = new Date();
			reviewDate.setMonth(reviewDate.getMonth() - Math.floor(Math.random() * 12));

			const isQuarterly = Math.random() > 0.5;
			const periodStart = new Date(reviewDate);
			if (isQuarterly) {
				periodStart.setMonth(periodStart.getMonth() - 3);
			} else {
				periodStart.setMonth(periodStart.getMonth() - 12);
			}
			periodStart.setDate(1);
			periodStart.setHours(0, 0, 0, 0);

			const periodEnd = new Date(reviewDate);
			periodEnd.setHours(23, 59, 59, 999);

			const rating = 3 + Math.floor(Math.random() * 3); // 3-5 rating

			const comments = [
				"Odličan rad tokom perioda. Pokazuje visok nivo profesionalizma i posvećenosti.",
				"Konstantno prekoračuje očekivanja. Veoma produktivan i pouzdan član tima.",
				"Dobar rad sa prostorom za napredak u nekim oblastima.",
				"Izuzetno dobar performans. Preporučujem povišicu.",
				"Solidan rad, ispunjava sve obaveze na vreme.",
			][Math.floor(Math.random() * 5)];

			const goals = [
				"Poboljšati komunikaciju sa timom i preuzeti više odgovornosti u projektima.",
				"Usavršiti veštine u oblasti cloud tehnologija i DevOps praksi.",
				"Postati mentor za nove članove tima i voditi tehničke sesije.",
				"Završiti sertifikacije u oblasti AWS i Kubernetes.",
				"Povećati produktivnost i smanjiti broj bug-ova u kod-u.",
			][Math.floor(Math.random() * 5)];

			performanceReviewsData.push({
				employeeEmail,
				reviewerEmail: managerEmail.toLowerCase(),
				reviewDate,
				periodStart,
				periodEnd,
				rating,
				comments,
				goals,
			});
		}

		const performanceReviewsToInsert = [];

		for (const review of performanceReviewsData) {
			const employeeId = employeeMap.get(review.employeeEmail);
			const reviewerId = userMap.get(review.reviewerEmail);

			if (employeeId && reviewerId) {
				performanceReviewsToInsert.push({
					employeeId,
					reviewerId,
					reviewDate: review.reviewDate,
					periodStart: review.periodStart,
					periodEnd: review.periodEnd,
					rating: review.rating,
					comments: review.comments,
					goals: review.goals,
				});
			}
		}

		if (performanceReviewsToInsert.length > 0) {
			await tx.insert(performanceReviews).values(performanceReviewsToInsert);
		}

		// Expand time off requests
		const additionalTimeOffData = [
			{
				employeeEmail: "milos.radovic@collectorlabs.test",
				startDate: new Date("2025-02-01"),
				endDate: new Date("2025-02-05"),
				reason: "Godišnji odmor",
				status: "pending",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "ivana.tomic@collectorlabs.test",
				startDate: new Date("2025-01-20"),
				endDate: new Date("2025-01-22"),
				reason: "Bolovanje",
				status: "approved",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "marija.kostic@collectorlabs.test",
				startDate: new Date("2025-03-10"),
				endDate: new Date("2025-03-14"),
				reason: "Planirani odmor",
				status: "pending",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "snezana.pavlovic@collectorlabs.test",
				startDate: new Date("2025-02-15"),
				endDate: new Date("2025-02-20"),
				reason: "Godišnji odmor",
				status: "approved",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "jovana.jovanovic@collectorlabs.test",
				startDate: new Date("2025-04-01"),
				endDate: new Date("2025-04-03"),
				reason: "Personal leave",
				status: "pending",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "stefan.nikolic@collectorlabs.test",
				startDate: new Date("2025-03-01"),
				endDate: new Date("2025-03-07"),
				reason: "Godišnji odmor",
				status: "approved",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "ana.markovic@collectorlabs.test",
				startDate: new Date("2025-02-10"),
				endDate: new Date("2025-02-12"),
				reason: "Bolovanje",
				status: "rejected",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "milos.radovic@collectorlabs.test",
				startDate: new Date("2025-05-15"),
				endDate: new Date("2025-05-20"),
				reason: "Planirani odmor",
				status: "pending",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "ivana.tomic@collectorlabs.test",
				startDate: new Date("2025-04-10"),
				endDate: new Date("2025-04-12"),
				reason: "Personal leave",
				status: "approved",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
			{
				employeeEmail: "marija.kostic@collectorlabs.test",
				startDate: new Date("2025-06-01"),
				endDate: new Date("2025-06-05"),
				reason: "Godišnji odmor",
				status: "pending",
				approverEmail: "marko.petrovic@collectorlabs.test",
			},
		];

		const additionalTimeOffToInsert = [];

		for (const timeOff of additionalTimeOffData) {
			const employeeId = employeeMap.get(timeOff.employeeEmail.toLowerCase());
			const approverId = userMap.get(timeOff.approverEmail.toLowerCase()) || null;

			if (employeeId) {
				additionalTimeOffToInsert.push({
					employeeId,
					startDate: timeOff.startDate,
					endDate: timeOff.endDate,
					reason: timeOff.reason,
					status: timeOff.status,
					approvedBy: approverId,
				});
			}
		}

		if (additionalTimeOffToInsert.length > 0) {
			await tx.insert(timeOffRequests).values(additionalTimeOffToInsert).onConflictDoNothing();
		}

		// Expand payroll entries (add 2-3 more months)
		const additionalPayrollData: Array<{
			employeeId: string;
			periodStart: Date;
			periodEnd: Date;
			grossPay: number;
			netPay: number;
		}> = [];

		for (let month = 3; month < 6; month++) {
			const periodStart = new Date(today);
			periodStart.setMonth(periodStart.getMonth() - month - 1);
			periodStart.setDate(1);
			periodStart.setHours(0, 0, 0, 0);

			const periodEnd = new Date(periodStart);
			periodEnd.setMonth(periodEnd.getMonth() + 1);
			periodEnd.setDate(0);
			periodEnd.setHours(23, 59, 59, 999);

			for (const [email, employeeId] of employeeMap.entries()) {
				let grossPay = baseSalaries.get(email) || 100000;

				// Add bonuses for some months
				if (month === 4) {
					// December bonus
					grossPay = Math.round(grossPay * 1.2);
				} else if (month === 5) {
					// Some employees got raises
					if (email.includes("jovana") || email.includes("stefan")) {
						grossPay = Math.round(grossPay * 1.1);
					}
				}

				const netPay = Math.round(grossPay * 0.7); // 30% tax approximation

				additionalPayrollData.push({
					employeeId,
					periodStart,
					periodEnd,
					grossPay,
					netPay,
				});
			}
		}

		if (additionalPayrollData.length > 0) {
			await tx.insert(payrollEntries).values(additionalPayrollData).onConflictDoNothing();
		}

		console.log("[HR Seed] Transaction completed successfully");
	});
	console.log("[HR Seed] HR seed process completed");
};

