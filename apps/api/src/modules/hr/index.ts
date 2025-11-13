import type { FastifyPluginAsync } from "fastify";

import hrRoutes from "./hr.routes";
import { createLeaveManagementService } from "./leave-management.service";
import { createPayrollService } from "./payroll.service";
import { createPerformanceReviewsService } from "./performance-reviews.service";
import { createRecruitmentService } from "./recruitment.service";

const hrModule: FastifyPluginAsync = async (fastify) => {
  const performanceReviewsService = createPerformanceReviewsService();
  const recruitmentService = createRecruitmentService();
  const leaveManagementService = createLeaveManagementService();
  const payrollService = createPayrollService();

  if (!fastify.hasDecorator("performanceReviewsService")) {
    fastify.decorate("performanceReviewsService", performanceReviewsService);
  }

  if (!fastify.hasRequestDecorator("performanceReviewsService")) {
    fastify.decorateRequest("performanceReviewsService", {
      getter: () => performanceReviewsService
    });
  }

  if (!fastify.hasDecorator("recruitmentService")) {
    fastify.decorate("recruitmentService", recruitmentService);
  }

  if (!fastify.hasRequestDecorator("recruitmentService")) {
    fastify.decorateRequest("recruitmentService", {
      getter: () => recruitmentService
    });
  }

  if (!fastify.hasDecorator("leaveManagementService")) {
    fastify.decorate("leaveManagementService", leaveManagementService);
  }

  if (!fastify.hasRequestDecorator("leaveManagementService")) {
    fastify.decorateRequest("leaveManagementService", {
      getter: () => leaveManagementService
    });
  }

  if (!fastify.hasDecorator("payrollService")) {
    fastify.decorate("payrollService", payrollService);
  }

  if (!fastify.hasRequestDecorator("payrollService")) {
    fastify.decorateRequest("payrollService", {
      getter: () => payrollService
    });
  }

  await fastify.register(hrRoutes, { prefix: "/hr" });
};

export default hrModule;


