import type { CreateTaskInput } from "./projects.types";

/**
 * Default tasks that are automatically created when a new project is created
 */
export interface ProjectTaskTemplate {
  title: string;
  description?: string;
  daysOffset: number; // Days from project start date (or creation date if start date is not set)
}

/**
 * Default task templates for new projects
 */
export const DEFAULT_PROJECT_TASKS: ProjectTaskTemplate[] = [
  {
    title: "Kickoff meeting",
    description: "Initial project kickoff meeting with stakeholders",
    daysOffset: 0
  },
  {
    title: "Requirements gathering",
    description: "Gather and document project requirements",
    daysOffset: 7
  },
  {
    title: "Project planning",
    description: "Create detailed project plan and timeline",
    daysOffset: 14
  }
];

/**
 * Generate task inputs from templates for a project
 * 
 * @param templates - Task templates to use
 * @param ownerId - Project owner ID to assign tasks to
 * @param startDate - Project start date (or creation date if not set)
 * @returns Array of task inputs ready to be created
 */
export function generateTasksFromTemplates(
  templates: ProjectTaskTemplate[],
  ownerId: string | null | undefined,
  startDate: Date | null
): CreateTaskInput[] {
  const baseDate = startDate || new Date();

  return templates.map((template) => {
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + template.daysOffset);

    return {
      title: template.title,
      description: template.description ?? null,
      status: "todo" as const,
      assigneeId: ownerId ?? undefined,
      dueDate: dueDate.toISOString()
    };
  });
}

