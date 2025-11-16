import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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

describe("CompanyAutocomplete", () => {
	beforeEach(() => {
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it("should render placeholder when no value is selected", () => {
		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText("Search or add company…")).toBeInTheDocument();
	});

	it("should display selected company name when value is provided", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockCompanies,
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value="1" onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
		});
	});

	it("should open popover when button is clicked", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockCompanies,
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		await waitFor(() => {
			expect(screen.getByPlaceholderText("Search or add company…")).toHaveFocus();
		});
	});

	it("should search for companies when user types", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => mockCompanies.filter((c) => c.name.includes("Acme")),
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "Acme", { delay: 50 });

		await waitFor(
			() => {
				expect(mockFetch).toHaveBeenCalled();
				const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
				expect(lastCall[0]).toContain("search=Acme");
			},
			{ timeout: 3000 }
		);
	});

	it("should display companies matching search query", async () => {
		const filteredCompanies = [mockCompanies[0]];
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => filteredCompanies,
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

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
	});

	it("should show 'Create' option when no companies match", async () => {
		mockFetch.mockResolvedValueOnce({
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
		await userEvent.type(input, "NewCompany", { delay: 50 });

		await waitFor(
			() => {
				expect(screen.getByText(/Create "NewCompany"/i)).toBeInTheDocument();
			},
			{ timeout: 3000 }
		);
	});

    it("should open creation modal when create option is clicked", async () => {
        mockFetch.mockResolvedValueOnce({
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
		await userEvent.type(input, "NewCompany", { delay: 50 });

		await waitFor(
			() => {
				expect(screen.getByText(/Create "NewCompany"/i)).toBeInTheDocument();
			},
			{ timeout: 3000 }
		);

        const createButton = screen.getByText(/Create "NewCompany"/i).closest("div");
        if (createButton) {
            await userEvent.click(createButton);

            await waitFor(() => {
                expect(screen.getByText("Create Customer")).toBeInTheDocument();
            });

            const nameInput = screen.getByLabelText("Company name");
            expect(nameInput).toHaveValue("NewCompany");
        }
    });

	it("should call onChange when company is selected", async () => {
		mockFetch.mockResolvedValueOnce({
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
		}
	});

	it("should display loading state while searching", async () => {
		let resolvePromise: (value: Account[]) => void;
		const promise = new Promise<Account[]>((resolve) => {
			resolvePromise = resolve;
		});

		mockFetch.mockReturnValueOnce(
			Promise.resolve({
				ok: true,
				json: async () => promise,
			})
		);

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "Test", { delay: 50 });

		await waitFor(() => {
			const loader = screen.queryByRole("status");
			expect(loader || screen.queryByTestId("loader")).toBeTruthy();
		});

		resolvePromise!([]);
	});

	it("should validate company name before showing create option", async () => {
		mockFetch.mockResolvedValueOnce({
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
		await userEvent.type(input, "Ab", { delay: 50 });

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

	it("should highlight matching text in company names", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => [mockCompanies[0]],
		});

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "Acme", { delay: 50 });

		await waitFor(
            () => {
                const companyItem = screen.getByText(/Acme Corporation/i);
                expect(companyItem).toBeInTheDocument();
                const mark = within(companyItem.parentElement!).queryByText("Acme");
                expect(mark?.tagName.toLowerCase()).toBe("mark");
            },
			{ timeout: 3000 }
		);
	});

	it("should limit visible companies to MAX_VISIBLE_ITEMS", async () => {
    const manyCompanies = Array.from({ length: 100 }, (_, i) => ({
        ...mockCompanies[0],
        id: String(i + 1),
        name: `Company ${i + 1}`,
    }));
    
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => manyCompanies,
    });

		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		await userEvent.click(button);

		const input = screen.getByPlaceholderText("Search or add company…");
		await userEvent.type(input, "Company", { delay: 50 });

		await waitFor(
			() => {
				const heading = screen.getByText(/showing first/i);
				expect(heading).toBeInTheDocument();
			},
			{ timeout: 3000 }
		);
	});

	it("should be disabled when disabled prop is true", () => {
		const onChange = vi.fn();
		render(<CompanyAutocomplete value={undefined} onChange={onChange} disabled />, {
			wrapper: createWrapper(),
		});

		const button = screen.getByRole("combobox");
		expect(button).toBeDisabled();
	});
});
