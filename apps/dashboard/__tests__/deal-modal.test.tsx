import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DealModal from "@/app/(protected)/crm/deals/components/deal-modal";
import type { DealFormValues } from "@/app/(protected)/crm/deals/schemas";

describe("DealModal", () => {
  it("submits a new deal with parsed payload", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <DealModal
        isOpen
        mode="create"
        deal={null}
        owners={["Jane Doe"]}
        isSubmitting={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText(/Deal name/i));
    await user.type(screen.getByLabelText(/Deal name/i), "Enterprise CRM Rollout");
    await user.clear(screen.getByLabelText(/Company/i));
    await user.type(screen.getByLabelText(/Company/i), "Acme Corporation");
    await user.clear(screen.getByLabelText(/Value \(USD\)/i));
    await user.type(screen.getByLabelText(/Value \(USD\)/i), "75000");

    await user.type(screen.getByLabelText(/Close date/i), "2025-03-15");
    await user.type(
      screen.getByLabelText(/Notes/i),
      "Proposal shared. Awaiting budget approval.",
    );

    await user.click(screen.getByRole("button", { name: /Create deal/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0] as DealFormValues;

    expect(payload.title).toBe("Enterprise CRM Rollout");
    expect(payload.company).toBe("Acme Corporation");
    expect(payload.owner).toBe("Jane Doe");
    expect(payload.stage).toBe("Lead");
    expect(payload.value).toBe(75000);
    expect(payload.closeDate).toBeInstanceOf(Date);
    expect(payload.notes).toBe("Proposal shared. Awaiting budget approval.");
  });
});

