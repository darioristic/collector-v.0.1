import { listTeamMembersQuerySchema, type CreateTeamMemberPayload, type ListTeamMembersQuery, type TeamMemberStatus, type UpdateTeamMemberPayload } from "@/lib/validations/settings/team-members";

import type { TeamMemberApi } from "@/lib/validations/settings/team-members";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json"
} as const;

const buildQueryString = (params: ListTeamMembersQuery): string => {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  return searchParams.toString();
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = "Došlo je do greške.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export type TeamMember = Omit<TeamMemberApi, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
};

const mapTeamMember = (member: TeamMemberApi): TeamMember => ({
  ...member,
  createdAt: new Date(member.createdAt),
  updatedAt: new Date(member.updatedAt),
  fullName: `${member.firstName} ${member.lastName}`.trim()
});

export const fetchTeamMembers = async (query: ListTeamMembersQuery = {}): Promise<TeamMember[]> => {
  const parsedQuery = listTeamMembersQuerySchema.parse(query);
  const queryString = buildQueryString(parsedQuery);
  const response = await fetch(`/api/settings/team-members${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store"
  });

  const payload = await handleResponse<{ data: TeamMemberApi[] }>(response);
  return payload.data.map(mapTeamMember);
};

export const createTeamMember = async (values: CreateTeamMemberPayload): Promise<TeamMember> => {
  const response = await fetch("/api/settings/team-members", {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values)
  });

  const payload = await handleResponse<{ data: TeamMemberApi }>(response);
  return mapTeamMember(payload.data);
};

export const updateTeamMember = async (id: string, values: UpdateTeamMemberPayload): Promise<TeamMember> => {
  const response = await fetch(`/api/settings/team-members/${id}`, {
    method: "PATCH",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values)
  });

  const payload = await handleResponse<{ data: TeamMemberApi }>(response);
  return mapTeamMember(payload.data);
};

export const deleteTeamMember = async (id: string): Promise<void> => {
  const response = await fetch(`/api/settings/team-members/${id}`, {
    method: "DELETE",
    headers: DEFAULT_HEADERS
  });

  if (!response.ok && response.status !== 204) {
    let message = "Brisanje člana tima nije uspelo.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
};

export const TEAM_MEMBER_STATUSES: TeamMemberStatus[] = ["online", "offline", "idle", "invited"];

