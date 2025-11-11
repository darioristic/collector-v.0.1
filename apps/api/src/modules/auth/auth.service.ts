import { randomBytes } from "node:crypto";

import { and, eq, isNull, sql } from "drizzle-orm";
import { compare, hash } from "bcryptjs";

import { db as defaultDb, type AppDatabase } from "../../db";
import {
  authSessions,
  companies,
  companyUsers,
  passwordResetTokens
} from "../../db/schema/auth.schema";
import { roles, userRoles, users } from "../../db/schema/settings.schema";
import type {
  AuthPayload,
  AuthSession,
  AuthUser,
  ForgotPasswordInput,
  ForgotPasswordPayload,
  LoginInput,
  RegisterInput,
  RequestMetadata,
  ResetPasswordInput
} from "./auth.types";
import { normalizeEmail, slugify } from "./auth.utils";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dana
const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 60 minuta
const SALT_ROUNDS = 12;

export class AuthServiceError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) {
    super(message);
    this.name = "AuthServiceError";
  }
}

type DatabaseClient = AppDatabase;

export class AuthService {
  constructor(private readonly database: AppDatabase = defaultDb) {}

  async register(input: RegisterInput, metadata: RequestMetadata): Promise<AuthPayload> {
    const email = normalizeEmail(input.email);
    const fullName = input.fullName.trim();

    if (!fullName) {
      throw new AuthServiceError(400, "INVALID_NAME", "Ime i prezime su obavezni.");
    }

    const existingUser = await this.database
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new AuthServiceError(409, "USER_EXISTS", "Korisnik sa ovom email adresom već postoji.");
    }

    const hashedPassword = await hash(input.password, SALT_ROUNDS);

    return await this.database.transaction(async (tx) => {
      const baseSlug = slugify(input.companyName);
      const uniqueSlug = await this.ensureCompanySlug(tx, baseSlug || `company-${Date.now()}`);

      const [company] = await tx
        .insert(companies)
        .values({
          name: input.companyName,
          slug: uniqueSlug,
          domain: input.companyDomain ?? null
        })
        .returning({ id: companies.id });

      if (!company) {
        throw new AuthServiceError(500, "COMPANY_CREATE_FAILED", "Kreiranje kompanije nije uspelo.");
      }

      const [userRecord] = await tx
        .insert(users)
        .values({
          email,
          name: fullName,
          status: "active",
          hashedPassword,
          defaultCompanyId: company.id
        })
        .returning({
          id: users.id,
          defaultCompanyId: users.defaultCompanyId
        });

      if (!userRecord) {
        throw new AuthServiceError(500, "USER_CREATE_FAILED", "Kreiranje korisnika nije uspelo.");
      }

      const adminRoleId = await this.ensureRoleId(tx, "admin");

      await tx
        .insert(userRoles)
        .values({
          userId: userRecord.id,
          roleId: adminRoleId
        })
        .onConflictDoNothing();

      await tx
        .insert(companyUsers)
        .values({
          companyId: company.id,
          userId: userRecord.id,
          roleId: adminRoleId,
          role: "admin"
        })
        .onConflictDoUpdate({
          target: [companyUsers.companyId, companyUsers.userId],
          set: {
            roleId: adminRoleId,
            role: "admin",
            updatedAt: sql`NOW()`
          }
        });

      await tx
        .update(companies)
        .set({
          createdBy: userRecord.id,
          updatedBy: userRecord.id,
          updatedAt: sql`NOW()`
        })
        .where(eq(companies.id, company.id));

      const session = await this.createSession(tx, {
        userId: userRecord.id,
        companyId: company.id,
        metadata
      });

      const user = await this.getUserProfile(tx, userRecord.id, company.id);

      return { user, session };
    });
  }

  async login(input: LoginInput, metadata: RequestMetadata): Promise<AuthPayload> {
    const email = normalizeEmail(input.email);

    const [userRecord] = await this.database
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        hashedPassword: users.hashedPassword,
        defaultCompanyId: users.defaultCompanyId
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userRecord) {
      throw new AuthServiceError(401, "INVALID_CREDENTIALS", "Neispravni podaci za prijavu.");
    }

    if (userRecord.status !== "active") {
      throw new AuthServiceError(403, "USER_INACTIVE", "Nalog nije aktivan.");
    }

    const passwordMatches = await compare(input.password, userRecord.hashedPassword);

    if (!passwordMatches) {
      throw new AuthServiceError(401, "INVALID_CREDENTIALS", "Neispravni podaci za prijavu.");
    }

    const companyId = await this.getPrimaryCompanyId(this.database, userRecord.id, userRecord.defaultCompanyId);

    if (!companyId) {
      throw new AuthServiceError(403, "COMPANY_ACCESS_MISSING", "Korisnik nema dodeljenu kompaniju.");
    }

    const session = await this.createSession(this.database, {
      userId: userRecord.id,
      companyId,
      metadata
    });

    const user = await this.getUserProfile(this.database, userRecord.id, companyId);

    return { user, session };
  }

  async me(token: string): Promise<AuthPayload> {
    const [sessionRecord] = await this.database
      .select({
        id: authSessions.id,
        userId: authSessions.userId,
        companyId: authSessions.companyId,
        expiresAt: authSessions.expiresAt,
        revokedAt: authSessions.revokedAt
      })
      .from(authSessions)
      .where(eq(authSessions.token, token))
      .limit(1);

    if (!sessionRecord) {
      throw new AuthServiceError(401, "SESSION_NOT_FOUND", "Sesija nije pronađena.");
    }

    if (sessionRecord.revokedAt || sessionRecord.expiresAt.getTime() <= Date.now()) {
      await this.database.delete(authSessions).where(eq(authSessions.id, sessionRecord.id));
      throw new AuthServiceError(401, "SESSION_EXPIRED", "Sesija je istekla.");
    }

    const companyId = await this.getPrimaryCompanyId(this.database, sessionRecord.userId, sessionRecord.companyId);
    const user = await this.getUserProfile(this.database, sessionRecord.userId, companyId ?? undefined);

    return {
      user,
      session: {
        token,
        expiresAt: sessionRecord.expiresAt.toISOString()
      }
    };
  }

  async logout(token: string): Promise<void> {
    if (!token) {
      throw new AuthServiceError(400, "TOKEN_REQUIRED", "Session token je obavezan.");
    }

    await this.database.delete(authSessions).where(eq(authSessions.token, token));
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordPayload> {
    const email = normalizeEmail(input.email);

    const [userRecord] = await this.database
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userRecord) {
      return {
        token: null,
        expiresAt: null
      };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.database.transaction(async (tx) => {
      await tx
        .delete(passwordResetTokens)
        .where(and(eq(passwordResetTokens.userId, userRecord.id), isNull(passwordResetTokens.usedAt)));

      await tx.insert(passwordResetTokens).values({
        userId: userRecord.id,
        token,
        expiresAt
      });
    });

    return {
      token,
      expiresAt: expiresAt.toISOString()
    };
  }

  async resetPassword(input: ResetPasswordInput, metadata: RequestMetadata): Promise<AuthPayload> {
    const token = input.token.trim();

    if (!token) {
      throw new AuthServiceError(400, "TOKEN_REQUIRED", "Token za reset lozinke je obavezan.");
    }

    const [tokenRecord] = await this.database
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        usedAt: passwordResetTokens.usedAt
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!tokenRecord) {
      throw new AuthServiceError(400, "TOKEN_INVALID", "Token za reset lozinke nije validan.");
    }

    if (tokenRecord.usedAt) {
      throw new AuthServiceError(400, "TOKEN_USED", "Token je već iskorišćen.");
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new AuthServiceError(400, "TOKEN_EXPIRED", "Token za reset lozinke je istekao.");
    }

    const hashedPassword = await hash(input.password, SALT_ROUNDS);

    return await this.database.transaction(async (tx) => {
      await tx
        .update(passwordResetTokens)
        .set({
          usedAt: sql`NOW()`
        })
        .where(eq(passwordResetTokens.id, tokenRecord.id));

      await tx
        .update(users)
        .set({
          hashedPassword,
          updatedAt: sql`NOW()`
        })
        .where(eq(users.id, tokenRecord.userId));

      await tx.delete(authSessions).where(eq(authSessions.userId, tokenRecord.userId));

      const companyId = await this.getPrimaryCompanyId(tx, tokenRecord.userId, null);

      const session = await this.createSession(tx, {
        userId: tokenRecord.userId,
        companyId,
        metadata
      });

      const user = await this.getUserProfile(tx, tokenRecord.userId, companyId ?? undefined);

      return { user, session };
    });
  }

  private async ensureRoleId(database: DatabaseClient, roleKeyValue: string): Promise<string> {
    const [role] = await database
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, roleKeyValue))
      .limit(1);

    if (!role) {
      throw new AuthServiceError(500, "ROLE_NOT_FOUND", `Uloga ${roleKeyValue} nije pronađena.`);
    }

    return role.id;
  }

  private async ensureCompanySlug(database: DatabaseClient, baseSlug: string): Promise<string> {
    let candidate = baseSlug.length > 0 ? baseSlug : "company";
    let attempt = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await database
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.slug, candidate))
        .limit(1);

      if (existing.length === 0) {
        return candidate;
      }

      attempt += 1;
      candidate = `${baseSlug}-${attempt}`;
    }
  }

  private async getPrimaryCompanyId(
    database: DatabaseClient,
    userId: string,
    preferredCompanyId: string | null | undefined
  ): Promise<string | null> {
    if (preferredCompanyId) {
      const [membership] = await database
        .select({ companyId: companyUsers.companyId })
        .from(companyUsers)
        .where(and(eq(companyUsers.userId, userId), eq(companyUsers.companyId, preferredCompanyId)))
        .limit(1);

      if (membership) {
        return preferredCompanyId;
      }
    }

    const [firstMembership] = await database
      .select({ companyId: companyUsers.companyId })
      .from(companyUsers)
      .where(eq(companyUsers.userId, userId))
      .limit(1);

    return firstMembership?.companyId ?? null;
  }

  private async createSession(
    database: DatabaseClient,
    params: { userId: string; companyId: string | null; metadata?: RequestMetadata }
  ): Promise<AuthSession> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await database.insert(authSessions).values({
      userId: params.userId,
      companyId: params.companyId ?? null,
      token,
      expiresAt,
      ipAddress: params.metadata?.ipAddress ?? null,
      userAgent: params.metadata?.userAgent ?? null
    });

    return {
      token,
      expiresAt: expiresAt.toISOString()
    };
  }

  private async getUserProfile(
    database: DatabaseClient,
    userId: string,
    companyId?: string | null
  ): Promise<AuthUser> {
    const [userRecord] = await database
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        defaultCompanyId: users.defaultCompanyId
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRecord) {
      throw new AuthServiceError(404, "USER_NOT_FOUND", "Korisnik nije pronađen.");
    }

    const targetCompanyId = companyId ?? userRecord.defaultCompanyId;
    let company: AuthUser["company"] = null;

    if (targetCompanyId) {
      const [membership] = await database
        .select({
          companyId: companyUsers.companyId,
          role: companyUsers.role,
          companyName: companies.name,
          companySlug: companies.slug,
          companyDomain: companies.domain
        })
        .from(companyUsers)
        .innerJoin(companies, eq(companies.id, companyUsers.companyId))
        .where(and(eq(companyUsers.userId, userId), eq(companyUsers.companyId, targetCompanyId)))
        .limit(1);

      if (membership) {
        company = {
          id: membership.companyId,
          name: membership.companyName,
          slug: membership.companySlug,
          domain: membership.companyDomain,
          role: membership.role
        };
      }
    }

    return {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      status: userRecord.status,
      defaultCompanyId: userRecord.defaultCompanyId,
      company
    };
  }
}


