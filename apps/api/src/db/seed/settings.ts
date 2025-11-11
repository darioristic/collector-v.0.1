import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { teamMembers } from "../schema/settings.schema";

type SeedTeamMember = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: "online" | "offline" | "idle" | "invited";
  createdAt: string;
};

const TEAM_MEMBERS: SeedTeamMember[] = [
  {
    firstName: "Jessica",
    lastName: "Wong",
    email: "jessica@example.com",
    role: "Admin",
    status: "online",
    createdAt: "2026-01-24T09:00:00.000Z"
  },
  {
    firstName: "Jason",
    lastName: "Gabriel",
    email: "jason@example.com",
    role: "Designer",
    status: "offline",
    createdAt: "2026-01-26T09:00:00.000Z"
  },
  {
    firstName: "Mona",
    lastName: "Smith",
    email: "mona@example.com",
    role: "Researcher",
    status: "idle",
    createdAt: "2026-01-27T09:00:00.000Z"
  },
  {
    firstName: "Julian",
    lastName: "Nguyen",
    email: "julian@example.com",
    role: "Marketing",
    status: "online",
    createdAt: "2025-12-12T09:00:00.000Z"
  },
  {
    firstName: "Tessa",
    lastName: "Yorker",
    email: "tessa@example.com",
    role: "Designer",
    status: "offline",
    createdAt: "2025-11-17T09:00:00.000Z"
  },
  {
    firstName: "Lana",
    lastName: "Kate",
    email: "kate@example.com",
    role: "Manager",
    status: "online",
    createdAt: "2025-10-03T09:00:00.000Z"
  },
  {
    firstName: "Han",
    lastName: "Ming",
    email: "han@example.com",
    role: "Developer",
    status: "offline",
    createdAt: "2026-01-22T09:00:00.000Z"
  },
  {
    firstName: "Casey",
    lastName: "Westlister",
    email: "casey@example.com",
    role: "Marketing",
    status: "idle",
    createdAt: "2025-10-01T09:00:00.000Z"
  }
];

export const seedSettings = async (database = defaultDb) => {
  await database.transaction(async (tx) => {
    await Promise.all(
      TEAM_MEMBERS.map((member) =>
        tx
          .insert(teamMembers)
          .values({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            role: member.role,
            status: member.status,
            createdAt: new Date(member.createdAt),
            updatedAt: sql`NOW()`
          })
          .onConflictDoUpdate({
            target: teamMembers.email,
            set: {
              firstName: member.firstName,
              lastName: member.lastName,
              role: member.role,
              status: member.status,
              updatedAt: sql`NOW()`
            }
          })
      )
    );
  });
};

