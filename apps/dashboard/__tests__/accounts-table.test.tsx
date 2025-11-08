import { render, screen } from "@testing-library/react";
import type { Account } from "@crm/types";

import AccountsTable from "@/app/dashboard/(auth)/accounts/accounts-table";

const createAccount = (overrides: Partial<Account>): Account => ({
  id: "00000000-0000-0000-0000-000000000100",
  name: "Example Corp",
  type: "company",
  email: "hello@example.com",
  phone: "+1-555-0100",
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
        type: "company",
        email: "contact@acme.test"
      }),
      createAccount({
        id: "00000000-0000-0000-0000-000000000102",
        name: "Jane Doe",
        type: "individual",
        email: "jane@example.test",
        phone: null
      })
    ];

    render(<AccountsTable accounts={accounts} />);

    expect(screen.getByText("Accounts Overview")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Acme Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getAllByText("Company")).toHaveLength(1);
    expect(screen.getAllByText("Individual")).toHaveLength(1);
  });

  it("renders empty state when list is empty", () => {
    render(<AccountsTable accounts={[]} />);

    expect(
      screen.getByText("Accounts will appear here as soon as you create or import them.")
    ).toBeInTheDocument();
  });
});

