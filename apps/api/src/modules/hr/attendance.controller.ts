import type { RouteHandler } from "fastify";

import type { AttendanceRecord } from "./hr.schema";
import { mockAttendance } from "./hr.schema";

const attendanceRecords: AttendanceRecord[] = [...mockAttendance];

export type ListAttendanceReply = { data: AttendanceRecord[] };

export const listAttendance: RouteHandler<{ Reply: ListAttendanceReply }> = async () => {
  // TODO: Connect to Accounts presence tracking once available.
  return { data: attendanceRecords };
};


