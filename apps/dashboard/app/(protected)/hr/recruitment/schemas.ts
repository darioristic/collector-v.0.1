import { z } from "zod";
import type { CandidatesQueryState, InterviewsQueryState } from "./types";

export const candidateFormSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
	phone: z.string().nullable().optional(),
	position: z.string().min(1),
	status: z
		.enum(["applied", "screening", "interview", "offer", "hired", "rejected"])
		.optional(),
	source: z.string().nullable().optional(),
	resumeUrl: z.string().nullable().optional(),
});

export type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export const interviewFormSchema = z.object({
	candidateId: z.string().uuid(),
	interviewerId: z.string().uuid().nullable().optional(),
	scheduledAt: z.date(),
	type: z.enum(["phone", "video", "onsite", "technical", "hr"]),
	status: z
		.enum(["scheduled", "completed", "cancelled", "rescheduled"])
		.optional(),
	notes: z.string().nullable().optional(),
	rating: z.number().min(1).max(5).nullable().optional(),
});

export type InterviewFormValues = z.infer<typeof interviewFormSchema>;

export function parseCandidatesQueryState(
	searchParams: Record<string, string | string[] | undefined>,
): CandidatesQueryState {
	return {
		status:
			typeof searchParams.status === "string"
				? (searchParams.status as CandidatesQueryState["status"])
				: undefined,
		position:
			typeof searchParams.position === "string"
				? searchParams.position
				: undefined,
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

export function parseInterviewsQueryState(
	searchParams: Record<string, string | string[] | undefined>,
): InterviewsQueryState {
	return {
		candidateId:
			typeof searchParams.candidateId === "string"
				? searchParams.candidateId
				: undefined,
		interviewerId:
			typeof searchParams.interviewerId === "string"
				? searchParams.interviewerId
				: undefined,
		status:
			typeof searchParams.status === "string"
				? (searchParams.status as InterviewsQueryState["status"])
				: undefined,
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
