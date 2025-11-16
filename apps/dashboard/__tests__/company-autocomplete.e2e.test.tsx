import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompanyAutocomplete } from "@/components/forms/CompanyAutocomplete";
import type { Account } from "@crm/types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
		refresh: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		prefetch: vi.fn(),
	}),
}));

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

const mockCompanies: Account[] = [
	{
		id: "1",
		name: "Acme Corporation",
		type: "customer",
		email: "contact@acme.com",
		phone: "+1234567890",
		website: null,
		taxId: "TAX001",
		country: "US",
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
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		name: "Beta Industries",
		type: "customer",
		email: "info@beta.com",
		phone: null,
		website: "https://beta.com",
		taxId: "TAX002",
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
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
];

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("CompanyAutocomplete E2E Tests", () => {
	beforeEach(() => {
		mockFetch.mockClear();
		mockPush.mockClear();
		vi.clearAllMocks();
	});

	it("should complete full user flow: search, select company", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => mockCompanies,
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		expect(button).toBeInTheDocument();

		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		expect(input).toHaveFocus();

		await userEvent.type(input, "Acme", { delay: 50 });

        await waitFor(
            () => {
                expect(screen.getByText(/Acme Corporation/i)).toBeInTheDocument();
            },
            { timeout: 3000 }
        );

        const companyItem = screen.getByText(/Acme Corporation/i).closest("div");
		if (companyItem) {
			await userEvent.click(companyItem);

			await waitFor(() => {
				expect(onChange).toHaveBeenCalledWith("1");
			});

			expect(screen.queryByText("Acme Corporation")).not.toBeInTheDocument();
		}
	});

    it("should complete full user flow: search non-existent company, open create modal", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "NewTech Inc", { delay: 50 });

		await waitFor(
			() => {
				expect(screen.getByText(/Create "NewTech Inc"/i)).toBeInTheDocument();
			},
			{ timeout: 3000 }
		);

        const createButton = screen.getByText(/Create "NewTech Inc"/i).closest("div");
        if (createButton) {
            await userEvent.click(createButton);

            await waitFor(() => {
                expect(screen.getByText("Create Customer")).toBeInTheDocument();
            });

            const nameInput = screen.getByLabelText("Company name");
            expect(nameInput).toHaveValue("NewTech Inc");
        }
    });

	it("should handle user typing quickly and debounce requests", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => mockCompanies.filter((c) => c.name.includes("Beta")),
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");

		await userEvent.type(input, "Beta", { delay: 10 });

		await waitFor(
			() => {
				const calls = mockFetch.mock.calls.filter((call) =>
					call[0]?.toString().includes("/api/accounts")
				);
				expect(calls.length).toBeLessThanOrEqual(2);
			},
			{ timeout: 1000 }
		);

		await waitFor(
			() => {
				expect(screen.getByText("Beta Industries")).toBeInTheDocument();
			},
			{ timeout: 3000 }
		);
	});

	it("should show selected company after selection and reopen", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => mockCompanies,
		});

		const onChange = vi.fn();
		const { rerender } = render(
			<CompanyAutocomplete value={undefined} onChange={onChange} />,
			{
				wrapper: createWrapper(),
			}
		);

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "Acme", { delay: 50 });

        await waitFor(
            () => {
                expect(screen.getByText(/Acme Corporation/i)).toBeInTheDocument();
            },
            { timeout: 3000 }
        );

		const companyItem = screen.getByText("Acme Corporation").closest("div");
		if (companyItem) {
			await userEvent.click(companyItem);
		}

		rerender(<CompanyAutocomplete value="1" onChange={onChange} />);

		await waitFor(() => {
			expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
		});
	});

	it("should handle edge case: empty search query", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => [],
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "A", { delay: 50 });

		await waitFor(() => {
			expect(screen.queryByText(/Create/i)).not.toBeInTheDocument();
		});

		await userEvent.clear(input);
		await userEvent.type(input, "ABC", { delay: 50 });

		await waitFor(
			() => {
				expect(screen.getByText(/Create "ABC"/i)).toBeInTheDocument();
			},
			{ timeout: 3000 }
		);
	});

	it("should handle keyboard navigation", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => mockCompanies,
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "A", { delay: 50 });

		await waitFor(
			() => {
				expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
			},
			{ timeout: 3000 }
		);

		await userEvent.keyboard("{ArrowDown}");
		await userEvent.keyboard("{Enter}");

		await waitFor(() => {
			expect(onChange).toHaveBeenCalled();
		});
	});
});
