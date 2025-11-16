import { render, screen } from "@testing-library/react";

import { ProjectOverview } from "@/components/projects/project-overview";
import type { ProjectDetails } from "@/src/types/projects";

const createProject = (
	overrides: Partial<ProjectDetails> = {},
): ProjectDetails => ({
	id: "proj_test",
	name: "OpenShift Migration",
	description: "Migrating workloads to OpenShift.",
	customer: "T-2",
	status: "active",
	statusLabel: "Active",
	startDate: "2025-11-01T00:00:00.000Z",
	dueDate: "2026-01-15T00:00:00.000Z",
	progress: 60,
	totalTasks: 10,
	completedTasks: 6,
	remainingDays: 30,
	owner: { id: "user_1", name: "Dario Ristic", email: "dario@example.com" },
	budget: {
		currency: "EUR",
		total: 50000,
		spent: 26000,
		remaining: 24000,
		categories: [],
	},
	tasks: [],
	timeline: [],
	team: [],
	teams: [],
	timeEntries: [],
	quickStats: {
		totalTasks: 10,
		completedTasks: 6,
		remainingTasks: 4,
		remainingDays: 30,
	},
	...overrides,
});

describe("ProjectOverview", () => {
	it("renders core project information", () => {
		const project = createProject();

		render(<ProjectOverview project={project} />);

		expect(screen.getByText("OpenShift Migration")).toBeInTheDocument();
		expect(
			screen.getByText("Migrating workloads to OpenShift."),
		).toBeInTheDocument();
		expect(screen.getByText("Active")).toBeInTheDocument();
		expect(screen.getByText("Ukupno zadataka")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
		expect(screen.getByText("Završeno")).toBeInTheDocument();
		expect(screen.getByText("6")).toBeInTheDocument();
	});

	it("displays customer badge when provided", () => {
		const project = createProject({ customer: "Telekom Austria Group" });

		render(<ProjectOverview project={project} />);

		expect(screen.getByText(/Telekom Austria Group/i)).toBeInTheDocument();
	});
});
