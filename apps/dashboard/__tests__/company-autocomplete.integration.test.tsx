import type { Account } from "@crm/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CompanyAutocomplete } from "@/components/forms/CompanyAutocomplete";
import { ensureResponse, getApiUrl } from "@/src/lib/fetch-utils";

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
				staleTime: 0,
			},
		},
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("CompanyAutocomplete Integration Tests", () => {
	let testAccountId: string | null = null;

	beforeAll(async () => {
		try {
			const testAccount: Account = {
				id: "",
				name: `Test Company ${Date.now()}`,
				type: "customer",
				email: `test-${Date.now()}@example.com`,
				phone: null,
				website: null,
				taxId: `TAX${Date.now()}`,
				country: "RS",
				legalName: null,
				registrationNumber: null,
				dateOfIncorporation: null,
				industry: null,
				numberOfEmployees: null,
				annualRevenueRange: null,
				legalStatus: null,
				companyType: null,
				description: null,
				socialMediaLinks: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			const response = await ensureResponse(
				fetch(getApiUrl("accounts"), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify({
						name: testAccount.name,
						type: testAccount.type,
						email: testAccount.email,
						taxId: testAccount.taxId,
						country: testAccount.country,
					}),
				}),
			);

			const created = (await response.json()) as Account;
			testAccountId = created.id;
		} catch (error) {
			console.warn("Failed to create test account:", error);
		}
	});

	afterAll(async () => {
		if (testAccountId) {
			try {
				await ensureResponse(
					fetch(getApiUrl(`accounts/${testAccountId}`), {
						method: "DELETE",
					}),
				);
			} catch (error) {
				console.warn("Failed to delete test account:", error);
			}
		}
	});

	it("should fetch companies from API when searching", async () => {
		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "Test", { delay: 50 });

		await waitFor(
			() => {
				expect(screen.queryByRole("status")).toBeTruthy();
			},
			{ timeout: 5000 },
		);

		await waitFor(
			() => {
				const results = screen.queryAllByRole("option");
				expect(results.length).toBeGreaterThan(0);
			},
			{ timeout: 5000 },
		);
	});

	it("should handle API errors gracefully", async () => {
		const originalFetch = global.fetch;
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				json: async () => ({ error: "Internal Server Error" }),
			}),
		) as unknown as typeof fetch;

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "Test", { delay: 50 });

		await waitFor(
			() => {
				expect(screen.queryByText(/No companies found/i)).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);

		global.fetch = originalFetch;
	});

	it("should debounce search requests", async () => {
		const fetchSpy = vi.spyOn(global, "fetch");

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "T", { delay: 10 });
		await userEvent.type(input, "e", { delay: 10 });
		await userEvent.type(input, "s", { delay: 10 });
		await userEvent.type(input, "t", { delay: 10 });

		await waitFor(
			() => {
				const calls = fetchSpy.mock.calls.filter((call) =>
					call[0]?.toString().includes("/api/accounts"),
				);
				expect(calls.length).toBeLessThan(4);
			},
			{ timeout: 1000 },
		);

		fetchSpy.mockRestore();
	});
});
