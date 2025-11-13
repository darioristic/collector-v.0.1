import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "../../db";
import { recruitmentCandidates, recruitmentInterviews, users } from "../../db/schema";

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  status: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  source: string | null;
  resumeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName?: string;
  interviewerId: string | null;
  interviewerName?: string | null;
  scheduledAt: string;
  type: "phone" | "video" | "onsite" | "technical" | "hr";
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  notes: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  position: string;
  status?: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  source?: string | null;
  resumeUrl?: string | null;
}

export interface CandidateUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  position?: string;
  status?: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  source?: string | null;
  resumeUrl?: string | null;
}

export interface InterviewCreateInput {
  candidateId: string;
  interviewerId?: string | null;
  scheduledAt: string;
  type: "phone" | "video" | "onsite" | "technical" | "hr";
  status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
  notes?: string | null;
  rating?: number | null;
}

export interface InterviewUpdateInput {
  interviewerId?: string | null;
  scheduledAt?: string;
  type?: "phone" | "video" | "onsite" | "technical" | "hr";
  status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
  notes?: string | null;
  rating?: number | null;
}

export interface CandidateListFilters {
  status?: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  position?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface InterviewListFilters {
  candidateId?: string;
  interviewerId?: string;
  status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
  limit?: number;
  offset?: number;
}

export interface CandidateListResult {
  data: Candidate[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface InterviewListResult {
  data: Interview[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

const toIsoString = (value: Date | string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : value;
};

const mapCandidateRow = (row: typeof recruitmentCandidates.$inferSelect): Candidate => ({
  id: row.id,
  firstName: row.firstName,
  lastName: row.lastName,
  email: row.email,
  phone: row.phone,
  position: row.position,
  status: row.status as Candidate["status"],
  source: row.source,
  resumeUrl: row.resumeUrl,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString()
});

type InterviewRow = {
  interview: typeof recruitmentInterviews.$inferSelect;
  candidate: typeof recruitmentCandidates.$inferSelect | null;
  interviewer: typeof users.$inferSelect | null;
};

const mapInterviewRow = (row: InterviewRow): Interview => ({
  id: row.interview.id,
  candidateId: row.interview.candidateId,
  candidateName: row.candidate
    ? `${row.candidate.firstName} ${row.candidate.lastName}`
    : undefined,
  interviewerId: row.interview.interviewerId,
  interviewerName: row.interviewer?.name ?? null,
  scheduledAt: toIsoString(row.interview.scheduledAt) ?? new Date().toISOString(),
  type: row.interview.type as Interview["type"],
  status: row.interview.status as Interview["status"],
  notes: row.interview.notes,
  rating: row.interview.rating,
  createdAt: toIsoString(row.interview.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.interview.updatedAt) ?? new Date().toISOString()
});

export class RecruitmentService {
  constructor(private readonly database = db) {}

  // Candidates
  async listCandidates(filters?: CandidateListFilters): Promise<CandidateListResult> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const whereConditions = [];

    if (filters?.status) {
      whereConditions.push(eq(recruitmentCandidates.status, filters.status));
    }

    if (filters?.position) {
      whereConditions.push(ilike(recruitmentCandidates.position, `%${filters.position}%`));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          ilike(recruitmentCandidates.firstName, `%${filters.search}%`),
          ilike(recruitmentCandidates.lastName, `%${filters.search}%`),
          ilike(recruitmentCandidates.email, `%${filters.search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [candidates, totalResult] = await Promise.all([
      this.database
        .select()
        .from(recruitmentCandidates)
        .where(whereClause)
        .orderBy(desc(recruitmentCandidates.createdAt))
        .limit(limit)
        .offset(offset),
      this.database
        .select({ count: recruitmentCandidates.id })
        .from(recruitmentCandidates)
        .where(whereClause)
    ]);

    const total = totalResult.length;

    return {
      data: candidates.map(mapCandidateRow),
      pagination: {
        total,
        limit,
        offset
      }
    };
  }

  async getCandidateById(id: string): Promise<Candidate | undefined> {
    const [result] = await this.database
      .select()
      .from(recruitmentCandidates)
      .where(eq(recruitmentCandidates.id, id))
      .limit(1);

    if (!result) {
      return undefined;
    }

    return mapCandidateRow(result);
  }

  async createCandidate(input: CandidateCreateInput): Promise<Candidate> {
    const [result] = await this.database
      .insert(recruitmentCandidates)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        position: input.position,
        status: input.status ?? "applied",
        source: input.source ?? null,
        resumeUrl: input.resumeUrl ?? null
      })
      .returning();

    return mapCandidateRow(result);
  }

  async updateCandidate(id: string, input: CandidateUpdateInput): Promise<Candidate | undefined> {
    const updateData: Partial<typeof recruitmentCandidates.$inferInsert> = {};

    if (input.firstName !== undefined) {
      updateData.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      updateData.lastName = input.lastName;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.position !== undefined) {
      updateData.position = input.position;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.source !== undefined) {
      updateData.source = input.source;
    }
    if (input.resumeUrl !== undefined) {
      updateData.resumeUrl = input.resumeUrl;
    }

    updateData.updatedAt = new Date();

    await this.database
      .update(recruitmentCandidates)
      .set(updateData)
      .where(eq(recruitmentCandidates.id, id));

    return this.getCandidateById(id);
  }

  async deleteCandidate(id: string): Promise<boolean> {
    const result = await this.database
      .delete(recruitmentCandidates)
      .where(eq(recruitmentCandidates.id, id))
      .returning();

    return result.length > 0;
  }

  // Interviews
  async listInterviews(filters?: InterviewListFilters): Promise<InterviewListResult> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const whereConditions = [];

    if (filters?.candidateId) {
      whereConditions.push(eq(recruitmentInterviews.candidateId, filters.candidateId));
    }

    if (filters?.interviewerId) {
      whereConditions.push(eq(recruitmentInterviews.interviewerId, filters.interviewerId));
    }

    if (filters?.status) {
      whereConditions.push(eq(recruitmentInterviews.status, filters.status));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [interviews, totalResult] = await Promise.all([
      this.database
        .select({
          interview: recruitmentInterviews,
          candidate: recruitmentCandidates,
          interviewer: users
        })
        .from(recruitmentInterviews)
        .leftJoin(
          recruitmentCandidates,
          eq(recruitmentInterviews.candidateId, recruitmentCandidates.id)
        )
        .leftJoin(users, eq(recruitmentInterviews.interviewerId, users.id))
        .where(whereClause)
        .orderBy(desc(recruitmentInterviews.scheduledAt))
        .limit(limit)
        .offset(offset),
      this.database
        .select({ count: recruitmentInterviews.id })
        .from(recruitmentInterviews)
        .where(whereClause)
    ]);

    const total = totalResult.length;

    return {
      data: interviews.map(mapInterviewRow),
      pagination: {
        total,
        limit,
        offset
      }
    };
  }

  async getInterviewById(id: string): Promise<Interview | undefined> {
    const [result] = await this.database
      .select({
        interview: recruitmentInterviews,
        candidate: recruitmentCandidates,
        interviewer: users
      })
      .from(recruitmentInterviews)
      .leftJoin(
        recruitmentCandidates,
        eq(recruitmentInterviews.candidateId, recruitmentCandidates.id)
      )
      .leftJoin(users, eq(recruitmentInterviews.interviewerId, users.id))
      .where(eq(recruitmentInterviews.id, id))
      .limit(1);

    if (!result) {
      return undefined;
    }

    return mapInterviewRow(result);
  }

  async createInterview(input: InterviewCreateInput): Promise<Interview> {
    const [result] = await this.database
      .insert(recruitmentInterviews)
      .values({
        candidateId: input.candidateId,
        interviewerId: input.interviewerId ?? null,
        scheduledAt: new Date(input.scheduledAt),
        type: input.type,
        status: input.status ?? "scheduled",
        notes: input.notes ?? null,
        rating: input.rating ?? null
      })
      .returning();

    const [interview] = await this.database
      .select({
        interview: recruitmentInterviews,
        candidate: recruitmentCandidates,
        interviewer: users
      })
      .from(recruitmentInterviews)
      .leftJoin(
        recruitmentCandidates,
        eq(recruitmentInterviews.candidateId, recruitmentCandidates.id)
      )
      .leftJoin(users, eq(recruitmentInterviews.interviewerId, users.id))
      .where(eq(recruitmentInterviews.id, result.id))
      .limit(1);

    return mapInterviewRow(interview!);
  }

  async updateInterview(id: string, input: InterviewUpdateInput): Promise<Interview | undefined> {
    const updateData: Partial<typeof recruitmentInterviews.$inferInsert> = {};

    if (input.interviewerId !== undefined) {
      updateData.interviewerId = input.interviewerId;
    }
    if (input.scheduledAt !== undefined) {
      updateData.scheduledAt = new Date(input.scheduledAt);
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    if (input.rating !== undefined) {
      updateData.rating = input.rating;
    }

    updateData.updatedAt = new Date();

    await this.database
      .update(recruitmentInterviews)
      .set(updateData)
      .where(eq(recruitmentInterviews.id, id));

    return this.getInterviewById(id);
  }

  async deleteInterview(id: string): Promise<boolean> {
    const result = await this.database
      .delete(recruitmentInterviews)
      .where(eq(recruitmentInterviews.id, id))
      .returning();

    return result.length > 0;
  }
}

export function createRecruitmentService() {
  return new RecruitmentService();
}

