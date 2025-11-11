import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createDeal,
  fetchDealMetadata,
  updateDealStage,
} from "@/app/(protected)/crm/deals/actions";
import { DEAL_STAGES, type DealStage } from "@/app/(protected)/crm/deals/constants";

var mockRevalidatePath: ReturnType<typeof vi.fn>;

vi.mock("next/cache", () => {
  mockRevalidatePath = vi.fn();
  return {
    revalidatePath: mockRevalidatePath,
  };
});

function createDbMock() {
  return {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    transaction: vi.fn(),
  };
}

var dbMock: ReturnType<typeof createDbMock>;

vi.mock("@/lib/db", () => {
  dbMock = createDbMock();
  dbMock.transaction.mockImplementation(async (callback) => callback(dbMock));
  return {
    db: dbMock,
  };
});

const dealSample = {
  id: "clyt6e7ym0001s1z5b8d6v8x5",
  title: "CRM Rollout",
  company: "Acme Inc.",
  owner: "Jane Doe",
  stage: "Lead",
  value: 52000,
  closeDate: new Date("2025-02-01T00:00:00Z"),
  notes: "Initial discovery completed.",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

describe("CRM deal actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a deal and triggers revalidation", async () => {
    const returningMock = vi.fn().mockResolvedValue([dealSample]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    dbMock.insert.mockReturnValue({ values: valuesMock });

    const payload = {
      title: "CRM Rollout",
      company: "Acme Inc.",
      owner: "Jane Doe",
      stage: "Lead" as DealStage,
      value: 52000,
      closeDate: new Date("2025-02-01T00:00:00Z"),
      notes: "Initial discovery completed.",
    };

    const result = await createDeal(payload);

    expect(dbMock.insert).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalledWith({
      title: payload.title,
      company: payload.company,
      owner: payload.owner,
      stage: payload.stage,
      value: payload.value,
      closeDate: payload.closeDate,
      notes: payload.notes,
    });
    expect(result).toEqual(dealSample);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/crm/deals");
  });

  it("updates deal stage and revalidates the page", async () => {
    const updatedDeal = { ...dealSample, stage: "Proposal" };
    const returningMock = vi.fn().mockResolvedValue([updatedDeal]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    dbMock.update.mockReturnValue({ set: setMock });

    const result = await updateDealStage({ id: dealSample.id, stage: "Proposal" });

    expect(dbMock.update).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith({
      stage: "Proposal",
      updatedAt: expect.any(Date),
    });
    expect(whereMock).toHaveBeenCalledWith(expect.anything());
    expect(result).toEqual(updatedDeal);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/crm/deals");
  });

  it("summarizes owners and stage counts", async () => {
    const ownersOrderBy = vi.fn().mockResolvedValue([{ owner: "Alice" }, { owner: "Bob" }]);
    const ownersGroupBy = vi.fn().mockReturnValue({ orderBy: ownersOrderBy });
    const ownersFrom = vi.fn().mockReturnValue({
      groupBy: ownersGroupBy,
      orderBy: ownersOrderBy,
    });

    const stagesGroupBy = vi.fn().mockResolvedValue([
      { stage: "Lead", total: 3 },
      { stage: "Closed Won", total: 2 },
    ]);
    const stagesFrom = vi.fn().mockReturnValue({
      groupBy: stagesGroupBy,
    });

    dbMock.select
      .mockImplementationOnce(() => ({ from: ownersFrom }))
      .mockImplementationOnce(() => ({ from: stagesFrom }));

    const metadata = await fetchDealMetadata();

    expect(metadata.owners).toEqual(["Alice", "Bob"]);
    expect(metadata.stages).toHaveLength(DEAL_STAGES.length);
    const leadSummary = metadata.stages.find((item) => item.stage === "Lead");
    const closedWonSummary = metadata.stages.find((item) => item.stage === "Closed Won");
    const negotiationSummary = metadata.stages.find((item) => item.stage === "Negotiation");

    expect(leadSummary?.count).toBe(3);
    expect(closedWonSummary?.count).toBe(2);
    expect(negotiationSummary?.count).toBe(0);
  });
});

