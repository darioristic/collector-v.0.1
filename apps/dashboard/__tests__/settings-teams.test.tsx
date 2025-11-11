"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TeamsTab from "@/app/(protected)/settings/teams/teams-tab";
import type { TeamMemberApi } from "@/lib/validations/settings/team-members";

const createFetchResponse = (data: unknown, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  } as Response);

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      },
      mutations: {
        retry: false
      }
    }
  });

describe("Settings Teams Tab", () => {
  const initialMembers: TeamMemberApi[] = [
    {
      id: "member_1",
      firstName: "Jessica",
      lastName: "Wong",
      email: "jessica@example.com",
      role: "Admin",
      status: "online",
      avatarUrl: null,
      createdAt: "2026-01-24T09:00:00.000Z",
      updatedAt: "2026-01-24T09:00:00.000Z"
    },
    {
      id: "member_2",
      firstName: "Jason",
      lastName: "Gabriel",
      email: "jason@example.com",
      role: "Designer",
      status: "offline",
      avatarUrl: null,
      createdAt: "2026-01-26T09:00:00.000Z",
      updatedAt: "2026-01-26T09:00:00.000Z"
    }
  ];

  let members: TeamMemberApi[] = [];
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    members = [...initialMembers];
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url.startsWith("/api/settings/team-members") && method === "GET") {
        return createFetchResponse({ data: members });
      }

      if (url === "/api/settings/team-members" && method === "POST") {
        const payload = JSON.parse(String(init?.body ?? "{}")) as Partial<TeamMemberApi>;
        const created: TeamMemberApi = {
          id: `member_${members.length + 1}`,
          firstName: payload.firstName ?? "Nova",
          lastName: payload.lastName ?? "Osoba",
          email: payload.email ?? "novi@example.com",
          role: payload.role ?? "Member",
          status: (payload.status ?? "invited") as TeamMemberApi["status"],
          avatarUrl: payload.avatarUrl ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        members = [created, ...members];
        return createFetchResponse({ data: created }, 201);
      }

      if (url.startsWith("/api/settings/team-members/") && method === "DELETE") {
        const id = url.split("/").pop();
        members = members.filter((member) => member.id !== id);
        return createFetchResponse(null, 204);
      }

      return createFetchResponse({ error: "Unhandled request" }, 500);
    });

    global.fetch = fetchMock as typeof global.fetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <TeamsTab />
      </QueryClientProvider>
    );
    return queryClient;
  };

  it("renders team members list and triggers status filter requests", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText("Jessica Wong")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Offline/i }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => typeof url === "string" && url.includes("status=offline"))
      ).toBe(true);
    });
  });

  it("creates a new team member through the dialog flow", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText("Jessica Wong")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Add member/i }));

    const [firstNameField] = screen.getAllByLabelText(/Ime/i);
    await user.type(firstNameField, "Ana");
    await user.type(screen.getByLabelText(/^Prezime/i), "Jovanović");
    await user.type(screen.getByLabelText(/^Email/i), "ana@example.com");
    await user.type(screen.getByLabelText(/Uloga/i), "Marketing");
    await user.click(screen.getByRole("button", { name: /Dodaj člana/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/settings/team-members", expect.objectContaining({ method: "POST" })));
    await waitFor(() => expect(screen.getByText("Ana Jovanović")).toBeInTheDocument());
  });
});

