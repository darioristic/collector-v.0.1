import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "../../db";
import { employees, performanceReviews, users } from "../../db/schema";

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName?: string;
  reviewDate: string;
  periodStart: string;
  periodEnd: string;
  reviewerId: string | null;
  reviewerName?: string | null;
  rating: number | null;
  comments: string | null;
  goals: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReviewCreateInput {
  employeeId: string;
  reviewDate: string;
  periodStart: string;
  periodEnd: string;
  reviewerId?: string | null;
  rating?: number | null;
  comments?: string | null;
  goals?: string | null;
}

export interface PerformanceReviewUpdateInput {
  reviewDate?: string;
  periodStart?: string;
  periodEnd?: string;
  reviewerId?: string | null;
  rating?: number | null;
  comments?: string | null;
  goals?: string | null;
}

export interface PerformanceReviewListFilters {
  employeeId?: string;
  reviewerId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PerformanceReviewListResult {
  data: PerformanceReview[];
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

type PerformanceReviewRow = {
  review: typeof performanceReviews.$inferSelect;
  employee: typeof employees.$inferSelect | null;
  reviewer: typeof users.$inferSelect | null;
};

const mapPerformanceReviewRow = (row: PerformanceReviewRow): PerformanceReview => ({
  id: row.review.id,
  employeeId: row.review.employeeId,
  employeeName: row.employee ? `${row.employee.employeeNumber}` : undefined,
  reviewDate: toIsoString(row.review.reviewDate) ?? new Date().toISOString(),
  periodStart: toIsoString(row.review.periodStart) ?? new Date().toISOString(),
  periodEnd: toIsoString(row.review.periodEnd) ?? new Date().toISOString(),
  reviewerId: row.review.reviewerId,
  reviewerName: row.reviewer?.name ?? null,
  rating: row.review.rating,
  comments: row.review.comments,
  goals: row.review.goals,
  createdAt: toIsoString(row.review.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.review.updatedAt) ?? new Date().toISOString()
});

export class PerformanceReviewsService {
  constructor(private readonly database = db) {}

  async list(filters?: PerformanceReviewListFilters): Promise<PerformanceReviewListResult> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const whereConditions = [];

    if (filters?.employeeId) {
      whereConditions.push(eq(performanceReviews.employeeId, filters.employeeId));
    }

    if (filters?.reviewerId) {
      whereConditions.push(eq(performanceReviews.reviewerId, filters.reviewerId));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          ilike(performanceReviews.comments, `%${filters.search}%`),
          ilike(performanceReviews.goals, `%${filters.search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [reviews, totalResult] = await Promise.all([
      this.database
        .select({
          review: performanceReviews,
          employee: employees,
          reviewer: users
        })
        .from(performanceReviews)
        .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
        .leftJoin(users, eq(performanceReviews.reviewerId, users.id))
        .where(whereClause)
        .orderBy(desc(performanceReviews.reviewDate))
        .limit(limit)
        .offset(offset),
      this.database
        .select({ count: performanceReviews.id })
        .from(performanceReviews)
        .where(whereClause)
    ]);

    const total = totalResult.length;

    return {
      data: reviews.map(mapPerformanceReviewRow),
      pagination: {
        total,
        limit,
        offset
      }
    };
  }

  async getById(id: string): Promise<PerformanceReview | undefined> {
    const [result] = await this.database
      .select({
        review: performanceReviews,
        employee: employees,
        reviewer: users
      })
      .from(performanceReviews)
      .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .leftJoin(users, eq(performanceReviews.reviewerId, users.id))
      .where(eq(performanceReviews.id, id))
      .limit(1);

    if (!result) {
      return undefined;
    }

    return mapPerformanceReviewRow(result);
  }

  async create(input: PerformanceReviewCreateInput): Promise<PerformanceReview> {
    const [result] = await this.database
      .insert(performanceReviews)
      .values({
        employeeId: input.employeeId,
        reviewDate: new Date(input.reviewDate),
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        reviewerId: input.reviewerId ?? null,
        rating: input.rating ?? null,
        comments: input.comments ?? null,
        goals: input.goals ?? null
      })
      .returning();

    const [review] = await this.database
      .select({
        review: performanceReviews,
        employee: employees,
        reviewer: users
      })
      .from(performanceReviews)
      .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .leftJoin(users, eq(performanceReviews.reviewerId, users.id))
      .where(eq(performanceReviews.id, result.id))
      .limit(1);

    return mapPerformanceReviewRow(review!);
  }

  async update(
    id: string,
    input: PerformanceReviewUpdateInput
  ): Promise<PerformanceReview | undefined> {
    const updateData: Partial<typeof performanceReviews.$inferInsert> = {};

    if (input.reviewDate !== undefined) {
      updateData.reviewDate = new Date(input.reviewDate);
    }
    if (input.periodStart !== undefined) {
      updateData.periodStart = new Date(input.periodStart);
    }
    if (input.periodEnd !== undefined) {
      updateData.periodEnd = new Date(input.periodEnd);
    }
    if (input.reviewerId !== undefined) {
      updateData.reviewerId = input.reviewerId;
    }
    if (input.rating !== undefined) {
      updateData.rating = input.rating;
    }
    if (input.comments !== undefined) {
      updateData.comments = input.comments;
    }
    if (input.goals !== undefined) {
      updateData.goals = input.goals;
    }

    updateData.updatedAt = new Date();

    await this.database.update(performanceReviews).set(updateData).where(eq(performanceReviews.id, id));

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database
      .delete(performanceReviews)
      .where(eq(performanceReviews.id, id))
      .returning();

    return result.length > 0;
  }
}

export function createPerformanceReviewsService() {
  return new PerformanceReviewsService();
}

