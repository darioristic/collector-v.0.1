import type { FastifyPluginAsync } from "fastify";

import {
  addTeamMemberSchema,
  createBudgetCategorySchema,
  createProjectSchema,
  createTaskSchema,
  createTeamSchema,
  createTimeEntrySchema,
  createTimelineSchema,
  deleteBudgetCategorySchema,
  deleteProjectSchema,
  deleteTaskSchema,
  deleteTeamSchema,
  deleteTimeEntrySchema,
  deleteTimelineSchema,
  getBudgetSchema,
  getProjectSchema,
  listProjectsSchema,
  listTasksSchema,
  listTeamSchema,
  listTeamsSchema,
  listTimeEntriesSchema,
  listTimelineSchema,
  removeTeamMemberSchema,
  updateBudgetCategorySchema,
  updateBudgetSchema,
  updateProjectSchema,
  updateTaskSchema,
  updateTeamSchema,
  updateTimeEntrySchema,
  updateTimelineSchema
} from "./projects.schema";
import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler
} from "./projects.controller";
import {
  createProjectTaskHandler,
  deleteProjectTaskHandler,
  listProjectTasksHandler,
  updateProjectTaskHandler
} from "./tasks.controller";
import {
  createProjectMilestoneHandler,
  deleteProjectMilestoneHandler,
  listProjectMilestonesHandler,
  updateProjectMilestoneHandler
} from "./milestones.controller";
import {
  addProjectTeamMemberHandler,
  createProjectTeamHandler,
  deleteProjectTeamHandler,
  listProjectTeamHandler,
  listProjectTeamsHandler,
  removeProjectTeamMemberHandler,
  updateProjectTeamHandler
} from "./team.controller";
import {
  createProjectTimeEntryHandler,
  deleteProjectTimeEntryHandler,
  listProjectTimeEntriesHandler,
  updateProjectTimeEntryHandler
} from "./time-entries.controller";
import {
  createBudgetCategoryHandler,
  deleteBudgetCategoryHandler,
  getProjectBudgetHandler,
  updateBudgetCategoryHandler,
  updateProjectBudgetHandler
} from "./budget.controller";
import { exportProjectsHandler } from "./export.controller";
import { exportProjectReportPDFHandler } from "./pdf-export.controller";

const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { schema: listProjectsSchema }, listProjectsHandler);
  fastify.get("/export", exportProjectsHandler);
  fastify.post("/", { schema: createProjectSchema }, createProjectHandler);

  fastify.get("/:id", { schema: getProjectSchema }, getProjectHandler);
  fastify.patch("/:id", { schema: updateProjectSchema }, updateProjectHandler);
  fastify.delete("/:id", { schema: deleteProjectSchema }, deleteProjectHandler);

  fastify.get("/:id/tasks", { schema: listTasksSchema }, listProjectTasksHandler);
  fastify.post("/:id/tasks", { schema: createTaskSchema }, createProjectTaskHandler);
  fastify.patch("/:id/tasks/:taskId", { schema: updateTaskSchema }, updateProjectTaskHandler);
  fastify.delete("/:id/tasks/:taskId", { schema: deleteTaskSchema }, deleteProjectTaskHandler);

  fastify.get("/:id/timeline", { schema: listTimelineSchema }, listProjectMilestonesHandler);
  fastify.post("/:id/timeline", { schema: createTimelineSchema }, createProjectMilestoneHandler);
  fastify.patch("/:id/timeline/:eventId", { schema: updateTimelineSchema }, updateProjectMilestoneHandler);
  fastify.delete("/:id/timeline/:eventId", { schema: deleteTimelineSchema }, deleteProjectMilestoneHandler);

  fastify.get("/:id/teams", { schema: listTeamsSchema }, listProjectTeamsHandler);
  fastify.post("/:id/teams", { schema: createTeamSchema }, createProjectTeamHandler);
  fastify.patch("/:id/teams/:teamId", { schema: updateTeamSchema }, updateProjectTeamHandler);
  fastify.delete("/:id/teams/:teamId", { schema: deleteTeamSchema }, deleteProjectTeamHandler);

  fastify.get("/:id/team", { schema: listTeamSchema }, listProjectTeamHandler);
  fastify.post("/:id/team", { schema: addTeamMemberSchema }, addProjectTeamMemberHandler);
  fastify.delete("/:id/team/:userId", { schema: removeTeamMemberSchema }, removeProjectTeamMemberHandler);

  fastify.get("/:id/time-entries", { schema: listTimeEntriesSchema }, listProjectTimeEntriesHandler);
  fastify.post("/:id/time-entries", { schema: createTimeEntrySchema }, createProjectTimeEntryHandler);
  fastify.patch("/:id/time-entries/:entryId", { schema: updateTimeEntrySchema }, updateProjectTimeEntryHandler);
  fastify.delete("/:id/time-entries/:entryId", { schema: deleteTimeEntrySchema }, deleteProjectTimeEntryHandler);

  fastify.get("/:id/budget", { schema: getBudgetSchema }, getProjectBudgetHandler);
  fastify.patch("/:id/budget", { schema: updateBudgetSchema }, updateProjectBudgetHandler);
  fastify.post("/:id/budget/categories", { schema: createBudgetCategorySchema }, createBudgetCategoryHandler);
  fastify.patch(
    "/:id/budget/categories/:categoryId",
    { schema: updateBudgetCategorySchema },
    updateBudgetCategoryHandler
  );
  fastify.delete(
    "/:id/budget/categories/:categoryId",
    { schema: deleteBudgetCategorySchema },
    deleteBudgetCategoryHandler
  );

  // PDF Export route
  fastify.get("/:id/report/pdf", exportProjectReportPDFHandler);
};

export default projectsRoutes;


