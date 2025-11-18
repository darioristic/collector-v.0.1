import { z } from "zod";
import type { LeaveRequestsQueryState } from "./types";

export const leaveRequestFormSchema = z.object({
	employeeId: z.string().uuid(),
	startDate: z.date(),
	endDate: z.date(),
	reason: z.string().nullable().optional(),
	status: z.string().optional(),
});

export type LeaveRequestFormValues = z.infer<typeof leaveRequestFormSchema>;

export function parseLeaveRequestsQueryState(
	searchParams: Record<string, string | string[] | undefined>,
): LeaveRequestsQueryState {
	return {
		employeeId:
			typeof searchParams.employeeId === "string"
				? searchParams.employeeId
				: undefined,
		status:
			typeof searchParams.status === "string" ? searchParams.status : undefined,
		search:
			typeof searchParams.search === "string" ? searchParams.search : undefined,
		limit:
			typeof searchParams.limit === "string"
				? parseInt(searchParams.limit, 10)
				: undefined,
		offset:
			typeof searchParams.offset === "string"
				? parseInt(searchParams.offset, 10)
				: undefined,
	};
}
