import bcrypt from "bcryptjs";
const { hash } = bcrypt;
import { eq, inArray, sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { authSessions, companies, companyUsers } from "../schema/auth.schema";
import type { roleKey } from "../schema/auth.schema";
import { roles, userRoles, users } from "../schema/settings.schema";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

type RoleSeed = {
	key: (typeof roleKey.enumValues)[number];
	name: string;
	description: string;
};

type UserSeed = {
	email: string;
	name: string;
	password: string;
	role: RoleSeed["key"];
};

const SALT_ROUNDS = 12;

const COMPANY_SEED = {
	name: "Collector Labs",
	slug: "collector-labs",
	domain: "collectorlabs.test",
};

const ROLE_DEFINITIONS: RoleSeed[] = [
	{
		key: "admin",
		name: "Administrator",
		description: "Potpuni pristup svim resursima i podešavanjima.",
	},
	{
		key: "manager",
		name: "Manager",
		description:
			"Može da upravlja timovima, korisnicima i većinom poslovnih podataka.",
	},
	{
		key: "user",
		name: "User",
		description:
			"Standardni korisnik sa osnovnim pristupom informacijama svoje kompanije.",
	},
];

const USER_DEFINITIONS: UserSeed[] = [
	{
		email: "dario@collectorlabs.test",
		name: "Dario Ristic",
		password: "Collector!2025",
		role: "admin",
	},
	{
		email: "miha@collectorlabs.test",
		name: "Miha Manager",
		password: "Collector!2025",
		role: "manager",
	},
	{
		email: "tara@collectorlabs.test",
		name: "Tara User",
		password: "Collector!2025",
		role: "user",
	},
];

export const seedAuth = async (database = defaultDb) => {
	await database.transaction(async (tx) => {
		// Ensure unique index exists for company_users table
		// This is needed for onConflictDoUpdate to work
		// First, try to drop constraint if it exists (as constraint-based unique)
		await tx.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'company_users_company_user_key'
        ) THEN
          ALTER TABLE "company_users" 
          DROP CONSTRAINT IF EXISTS "company_users_company_user_key";
        END IF;
      END $$;
    `);

		// Create unique index if it doesn't exist
		await tx.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "company_users_company_user_key" 
      ON "company_users" ("company_id", "user_id");
    `);

		await Promise.all(
			ROLE_DEFINITIONS.map((role) =>
				tx
					.insert(roles)
					.values({
						key: role.key,
						name: role.name,
						description: role.description,
					})
					.onConflictDoUpdate({
						target: roles.key,
						set: {
							name: role.name,
							description: role.description,
						},
					}),
			),
		);

		const roleRecords = await tx
			.select({
				id: roles.id,
				key: roles.key,
			})
			.from(roles)
			.where(
				inArray(
					roles.key,
					ROLE_DEFINITIONS.map((role) => role.key),
				),
			);

		const roleMap = new Map(roleRecords.map((role) => [role.key, role.id]));

		const [companyRecord] = await tx
			.insert(companies)
			.values({
				name: COMPANY_SEED.name,
				slug: COMPANY_SEED.slug,
				domain: COMPANY_SEED.domain,
			})
			.onConflictDoUpdate({
				target: companies.slug,
				set: {
					name: COMPANY_SEED.name,
					domain: COMPANY_SEED.domain,
					updatedAt: sql`NOW()`,
				},
			})
			.returning();

		if (!companyRecord) {
			throw new Error("Company seed failed to insert.");
		}

		const companyId = companyRecord.id;

		const seededUsers = [];

		for (const definition of USER_DEFINITIONS) {
			const normalizedEmail = normalizeEmail(definition.email);
			const hashed = await hash(definition.password, SALT_ROUNDS);
			const roleId = roleMap.get(definition.role);

			if (!roleId) {
				throw new Error(`Role ${definition.role} nije pronađena u bazi.`);
			}

			const [userRecord] = await tx
				.insert(users)
				.values({
					email: normalizedEmail,
					name: definition.name,
					status: "active",
					hashedPassword: hashed,
					defaultCompanyId: companyId,
				})
				.onConflictDoUpdate({
					target: users.email,
					set: {
						name: definition.name,
						status: "active",
						hashedPassword: hashed,
						defaultCompanyId: companyId,
						updatedAt: sql`NOW()`,
					},
				})
				.returning();

			if (!userRecord) {
				throw new Error(`Korisnik ${normalizedEmail} nije kreiran.`);
			}

			seededUsers.push({
				id: userRecord.id,
				email: normalizedEmail,
				roleKey: definition.role,
				roleId,
			});

			await tx
				.insert(userRoles)
				.values({
					userId: userRecord.id,
					roleId,
				})
				.onConflictDoNothing();

			await tx
				.insert(companyUsers)
				.values({
					companyId: companyId,
					userId: userRecord.id,
					roleId,
					role: definition.role,
				})
				.onConflictDoUpdate({
					target: [companyUsers.companyId, companyUsers.userId],
					set: {
						roleId,
						role: definition.role,
						updatedAt: sql`NOW()`,
					},
				});
		}

		const adminUser = seededUsers.find((user) => user.roleKey === "admin");

		if (adminUser) {
			await tx
				.update(companies)
				.set({
					createdBy: adminUser.id,
					updatedBy: adminUser.id,
					updatedAt: sql`NOW()`,
				})
				.where(eq(companies.id, companyId));
		}

		if (seededUsers.length > 0) {
			await tx.delete(authSessions).where(
				inArray(
					authSessions.userId,
					seededUsers.map((user) => user.id),
				),
			);
		}
	});
};
