import { render, screen, within } from "@testing-library/react";
import type { Account } from "@crm/types";

import AccountsTable from "@/app/(protected)/accounts/accounts-table";

const createAccount = (overrides: Partial<Account>): Account => ({
  id: "00000000-0000-0000-0000-000000000100",
  name: "Example Corp",
  type: "customer",
  email: "hello@example.com",
  phone: "+1-555-0100",
  website: null,
  taxId: "RS0000999",
  country: "RS",
  createdAt: "2024-01-01T09:00:00.000Z",
  updatedAt: "2024-01-02T09:00:00.000Z",
  ...overrides
});

describe("AccountsTable", () => {
  it("renders account rows", () => {
    const accounts: Account[] = [
      createAccount({
        id: "00000000-0000-0000-0000-000000000101",
        name: "Acme Manufacturing",
        type: "customer",
        email: "contact@acme.test",
        taxId: "RS123",
        country: "RS"
      }),
      createAccount({
        id: "00000000-0000-0000-0000-000000000102",
        name: "Jane Doe",
        type: "vendor",
        email: "jane@example.test",
        phone: null,
        taxId: "RS124",
        country: "RS"
      })
    ];

    render(<AccountsTable accounts={accounts} />);

    expect(screen.getByText("Accounts Overview")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Acme Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");

    expect(within(rows[1]).getByText(/Customer/i)).toBeInTheDocument();
    expect(within(rows[2]).getByText(/Vendor/i)).toBeInTheDocument();
  });

  it("renders empty state when list is empty", () => {
    render(<AccountsTable accounts={[]} />);

    expect(
      screen.getByText("Accounts will appear here as soon as you create or import them.")
    ).toBeInTheDocument();
  });
});

