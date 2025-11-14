import type { AppDatabase } from "../db/index.js";
import type { createLeaveManagementService } from "../modules/hr/leave-management.service";
import type { createPayrollService } from "../modules/hr/payroll.service";
import type { createPerformanceReviewsService } from "../modules/hr/performance-reviews.service";
import type { createRecruitmentService } from "../modules/hr/recruitment.service";

declare module "fastify" {
  interface FastifyInstance {
    db: AppDatabase;
    leaveManagementService: ReturnType<typeof createLeaveManagementService>;
    payrollService: ReturnType<typeof createPayrollService>;
    performanceReviewsService: ReturnType<typeof createPerformanceReviewsService>;
    recruitmentService: ReturnType<typeof createRecruitmentService>;
  }

  interface FastifyRequest {
    db: AppDatabase;
    leaveManagementService: ReturnType<typeof createLeaveManagementService>;
    payrollService: ReturnType<typeof createPayrollService>;
    performanceReviewsService: ReturnType<typeof createPerformanceReviewsService>;
    recruitmentService: ReturnType<typeof createRecruitmentService>;
  }
}

