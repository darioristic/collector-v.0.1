"use server";

import { revalidatePath } from "next/cache";

import type {
  Activity,
  ActivityCreateInput,
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  ActivityUpdateInput,
  Account,
  User
} from "@crm/types";

import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";

export type ClientActivityFilters = {
  clientId?: string;
  assignedTo?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  type?: ActivityType;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
};

export type ClientActivityMetadata = {
  clients: Array<Pick<Account, "id" | "name" | "email">>;
  assignees: Array<Pick<User, "id" | "name" | "email">>;
};

type ActivitiesEnvelope = {
  data: Activity[];
};

type ActivityEnvelope = {
  data: Activity;
};

type UsersEnvelope = {
  data: User[];
};

const ACTIVITIES_ENDPOINT = "crm/activities";
const ACCOUNTS_ENDPOINT = "accounts";
const USERS_ENDPOINT = "settings/users";
const ACTIVITIES_PAGE_PATH = "/crm/activities";

const jsonHeaders: HeadersInit = {
  "Content-Type": "application/json"
};

const buildQueryString = (filters: ClientActivityFilters): string => {
  const params = new URLSearchParams();

  if (filters.clientId) {
    params.set("clientId", filters.clientId);
  }

  if (filters.assignedTo) {
    params.set("assignedTo", filters.assignedTo);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.priority) {
    params.set("priority", filters.priority);
  }

  if (filters.type) {
    params.set("type", filters.type);
  }

  if (filters.dateFrom) {
    params.set("dateFrom", new Date(filters.dateFrom).toISOString());
  }

  if (filters.dateTo) {
    params.set("dateTo", new Date(filters.dateTo).toISOString());
  }

  if (typeof filters.limit === "number") {
    params.set("limit", String(filters.limit));
  }

  if (typeof filters.offset === "number") {
    params.set("offset", String(filters.offset));
  }

  return params.toString();
};

const parseActivitiesResponse = async (response: Response): Promise<Activity[]> => {
  const payload = (await response.json()) as ActivitiesEnvelope;
  return payload.data ?? [];
};

const parseActivityResponse = async (response: Response): Promise<Activity> => {
  const payload = (await response.json()) as ActivityEnvelope;
  return payload.data;
};

export async function fetchClientActivities(filters: ClientActivityFilters = {}): Promise<Activity[]> {
  const query = buildQueryString(filters);
  const endpoint = query ? `${ACTIVITIES_ENDPOINT}?${query}` : ACTIVITIES_ENDPOINT;

  const response = await ensureResponse(
    fetch(getApiUrl(endpoint), {
      method: "GET",
      headers: jsonHeaders,
      cache: "no-store",
      next: { revalidate: 0 }
    })
  );

  return parseActivitiesResponse(response);
}

export async function fetchClientActivityMetadata(): Promise<ClientActivityMetadata> {
  const [clientsResponse, usersResponse] = await Promise.all([
    ensureResponse(
      fetch(getApiUrl(ACCOUNTS_ENDPOINT), {
        method: "GET",
        headers: jsonHeaders,
        cache: "no-store",
        next: { revalidate: 3600 }
      })
    ),
    ensureResponse(
      fetch(getApiUrl(USERS_ENDPOINT), {
        method: "GET",
        headers: jsonHeaders,
        cache: "no-store",
        next: { revalidate: 300 }
      })
    )
  ]);

  const clientsPayload = await clientsResponse.json();
  const usersPayload = (await usersResponse.json()) as UsersEnvelope;

  const clients = Array.isArray(clientsPayload) ? clientsPayload : clientsPayload?.data ?? [];
  const assignees = usersPayload?.data ?? [];

  return {
    clients: clients.map((client: Account) => ({
      id: client.id,
      name: client.name,
      email: client.email
    })),
    assignees: assignees.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email
    }))
  };
}

export async function createClientActivity(input: ActivityCreateInput): Promise<Activity> {
  const response = await ensureResponse(
    fetch(getApiUrl(ACTIVITIES_ENDPOINT), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const activity = await parseActivityResponse(response);

  revalidatePath(ACTIVITIES_PAGE_PATH);

  return activity;
}

export async function updateClientActivity(
  id: string,
  input: ActivityUpdateInput
): Promise<Activity | undefined> {
  if (!id) {
    throw new Error("Activity id is required.");
  }

  const response = await ensureResponse(
    fetch(getApiUrl(`${ACTIVITIES_ENDPOINT}/${id}`), {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(input)
    })
  );

  const activity = await parseActivityResponse(response);

  revalidatePath(ACTIVITIES_PAGE_PATH);

  return activity;
}

export async function deleteClientActivity(id: string): Promise<void> {
  if (!id) {
    throw new Error("Activity id is required.");
  }

  await ensureResponse(
    fetch(getApiUrl(`${ACTIVITIES_ENDPOINT}/${id}`), {
      method: "DELETE",
      headers: jsonHeaders
    })
  );

  revalidatePath(ACTIVITIES_PAGE_PATH);
}

