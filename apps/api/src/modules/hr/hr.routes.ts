import type { FastifyPluginAsync } from "fastify";

import {
  attendanceListSchema,
  employeeCreateSchema,
  employeeListSchema,
  roleListSchema
} from "./hr.schema";
import { listAttendance } from "./attendance.controller";
import { createEmployee, listEmployees } from "./employees.controller";
import { listRoles } from "./roles.controller";
import { exportEmployeesHandler } from "./export.controller";
import {
  createPerformanceReview,
  deletePerformanceReview,
  getPerformanceReview,
  listPerformanceReviews,
  updatePerformanceReview
} from "./performance-reviews.controller";
import {
  performanceReviewCreateSchema,
  performanceReviewDeleteSchema,
  performanceReviewGetSchema,
  performanceReviewListSchema,
  performanceReviewUpdateSchema
} from "./performance-reviews.schema";
import {
  createCandidate,
  createInterview,
  deleteCandidate,
  deleteInterview,
  getCandidate,
  getInterview,
  listCandidates,
  listInterviews,
  updateCandidate,
  updateInterview
} from "./recruitment.controller";
import {
  candidateCreateSchema,
  candidateDeleteSchema,
  candidateGetSchema,
  candidateListSchema,
  candidateUpdateSchema,
  interviewCreateSchema,
  interviewDeleteSchema,
  interviewGetSchema,
  interviewListSchema,
  interviewUpdateSchema
} from "./recruitment.schema";
import {
  approveLeaveRequest,
  createLeaveRequest,
  deleteLeaveRequest,
  getLeaveRequest,
  listLeaveRequests,
  rejectLeaveRequest,
  updateLeaveRequest
} from "./leave-management.controller";
import {
  leaveRequestApproveSchema,
  leaveRequestCreateSchema,
  leaveRequestDeleteSchema,
  leaveRequestGetSchema,
  leaveRequestListSchema,
  leaveRequestRejectSchema,
  leaveRequestUpdateSchema
} from "./leave-management.schema";
import {
  createPayrollEntry,
  deletePayrollEntry,
  getPayrollEntry,
  listPayrollEntries,
  updatePayrollEntry
} from "./payroll.controller";
import {
  payrollEntryCreateSchema,
  payrollEntryDeleteSchema,
  payrollEntryGetSchema,
  payrollEntryListSchema,
  payrollEntryUpdateSchema
} from "./payroll.schema";

const hrRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/employees", { schema: employeeListSchema }, listEmployees);
  fastify.get("/employees/export", exportEmployeesHandler);
  fastify.post("/employees", { schema: employeeCreateSchema }, createEmployee);
  fastify.get("/roles", { schema: roleListSchema }, listRoles);
  fastify.get("/attendance", { schema: attendanceListSchema }, listAttendance);

  // Performance Reviews
  fastify.get(
    "/performance-reviews",
    { schema: performanceReviewListSchema },
    listPerformanceReviews
  );
  fastify.get(
    "/performance-reviews/:id",
    { schema: performanceReviewGetSchema },
    getPerformanceReview
  );
  fastify.post(
    "/performance-reviews",
    { schema: performanceReviewCreateSchema },
    createPerformanceReview
  );
  fastify.put(
    "/performance-reviews/:id",
    { schema: performanceReviewUpdateSchema },
    updatePerformanceReview
  );
  fastify.delete(
    "/performance-reviews/:id",
    { schema: performanceReviewDeleteSchema },
    deletePerformanceReview
  );

  // Recruitment - Candidates
  fastify.get("/recruitment/candidates", { schema: candidateListSchema }, listCandidates);
  fastify.get("/recruitment/candidates/:id", { schema: candidateGetSchema }, getCandidate);
  fastify.post("/recruitment/candidates", { schema: candidateCreateSchema }, createCandidate);
  fastify.put("/recruitment/candidates/:id", { schema: candidateUpdateSchema }, updateCandidate);
  fastify.delete(
    "/recruitment/candidates/:id",
    { schema: candidateDeleteSchema },
    deleteCandidate
  );

  // Recruitment - Interviews
  fastify.get("/recruitment/interviews", { schema: interviewListSchema }, listInterviews);
  fastify.get("/recruitment/interviews/:id", { schema: interviewGetSchema }, getInterview);
  fastify.post("/recruitment/interviews", { schema: interviewCreateSchema }, createInterview);
  fastify.put("/recruitment/interviews/:id", { schema: interviewUpdateSchema }, updateInterview);
  fastify.delete(
    "/recruitment/interviews/:id",
    { schema: interviewDeleteSchema },
    deleteInterview
  );

  // Leave Management
  fastify.get("/leave-requests", { schema: leaveRequestListSchema }, listLeaveRequests);
  fastify.get("/leave-requests/:id", { schema: leaveRequestGetSchema }, getLeaveRequest);
  fastify.post("/leave-requests", { schema: leaveRequestCreateSchema }, createLeaveRequest);
  fastify.put("/leave-requests/:id", { schema: leaveRequestUpdateSchema }, updateLeaveRequest);
  fastify.delete(
    "/leave-requests/:id",
    { schema: leaveRequestDeleteSchema },
    deleteLeaveRequest
  );
  fastify.post(
    "/leave-requests/:id/approve",
    { schema: leaveRequestApproveSchema },
    approveLeaveRequest
  );
  fastify.post(
    "/leave-requests/:id/reject",
    { schema: leaveRequestRejectSchema },
    rejectLeaveRequest
  );

  // Payroll
  fastify.get("/payroll", { schema: payrollEntryListSchema }, listPayrollEntries);
  fastify.get("/payroll/:id", { schema: payrollEntryGetSchema }, getPayrollEntry);
  fastify.post("/payroll", { schema: payrollEntryCreateSchema }, createPayrollEntry);
  fastify.put("/payroll/:id", { schema: payrollEntryUpdateSchema }, updatePayrollEntry);
  fastify.delete("/payroll/:id", { schema: payrollEntryDeleteSchema }, deletePayrollEntry);
};

export default hrRoutes;


