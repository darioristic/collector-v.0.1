import { z } from "zod";

export const teamMemberStatusValues = [
	"online",
	"offline",
	"idle",
	"invited",
] as const;

export const teamMemberStatusSchema = z.enum(teamMemberStatusValues);

export const teamMemberFormSchema = z.object({
	firstName: z.string().min(2, "Ime mora imati bar 2 karaktera."),
	lastName: z.string().min(2, "Prezime mora imati bar 2 karaktera."),
	email: z.string().email("Unesite validnu e-mail adresu."),
	role: z.string().min(2, "Uloga mora imati bar 2 karaktera."),
	status: teamMemberStatusSchema.default("invited"),
	avatarUrl: z.string().url("URL mora biti validan.").nullable().optional(),
});

export const listTeamMembersQuerySchema = z.object({
	search: z.string().min(1).optional(),
	status: teamMemberStatusSchema.optional(),
});

export const teamMemberApiSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	email: z.string().email(),
	role: z.string(),
	status: teamMemberStatusSchema,
	avatarUrl: z.string().nullable().optional(),
	userId: z.string().nullable().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const listTeamMembersResponseSchema = z.object({
	data: z.array(teamMemberApiSchema),
});

export const createTeamMemberSchema = teamMemberFormSchema.extend({
	status: teamMemberStatusSchema.optional(),
});

export const updateTeamMemberSchema = createTeamMemberSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: "Bar jedno polje mora biti prosleđeno.",
	});

export type TeamMemberStatus = z.infer<typeof teamMemberStatusSchema>;
export type TeamMemberApi = z.infer<typeof teamMemberApiSchema>;
export type ListTeamMembersQuery = z.infer<typeof listTeamMembersQuerySchema>;
export type CreateTeamMemberPayload = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberPayload = z.infer<typeof updateTeamMemberSchema>;
