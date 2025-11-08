import type { FastifyPluginAsync } from "fastify";

import {
  activityCreateSchema,
  activityDeleteSchema,
  activityDetailSchema,
  activityListSchema,
  activityUpdateSchema,
  leadCreateSchema,
  leadDeleteSchema,
  leadDetailSchema,
  leadListSchema,
  leadUpdateSchema,
  opportunityCreateSchema,
  opportunityDeleteSchema,
  opportunityDetailSchema,
  opportunityListSchema,
  opportunityUpdateSchema
} from "./crm.schema";
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity
} from "./activities.controller";
import { createLead, deleteLead, getLead, listLeads, updateLead } from "./leads.controller";
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunity,
  listOpportunities,
  updateOpportunity
} from "./opportunities.controller";

const crmRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/leads", { schema: leadListSchema }, listLeads);
  fastify.post("/leads", { schema: leadCreateSchema }, createLead);
  fastify.get("/leads/:id", { schema: leadDetailSchema }, getLead);
  fastify.patch("/leads/:id", { schema: leadUpdateSchema }, updateLead);
  fastify.delete("/leads/:id", { schema: leadDeleteSchema }, deleteLead);

  fastify.get("/opportunities", { schema: opportunityListSchema }, listOpportunities);
  fastify.post("/opportunities", { schema: opportunityCreateSchema }, createOpportunity);
  fastify.get("/opportunities/:id", { schema: opportunityDetailSchema }, getOpportunity);
  fastify.patch("/opportunities/:id", { schema: opportunityUpdateSchema }, updateOpportunity);
  fastify.delete("/opportunities/:id", { schema: opportunityDeleteSchema }, deleteOpportunity);

  fastify.get("/activities", { schema: activityListSchema }, listActivities);
  fastify.post("/activities", { schema: activityCreateSchema }, createActivity);
  fastify.get("/activities/:id", { schema: activityDetailSchema }, getActivity);
  fastify.patch("/activities/:id", { schema: activityUpdateSchema }, updateActivity);
  fastify.delete("/activities/:id", { schema: activityDeleteSchema }, deleteActivity);
};

export default crmRoutes;


