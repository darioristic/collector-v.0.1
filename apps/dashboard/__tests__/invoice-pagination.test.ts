import { describe, expect, it } from "vitest";
import { paginateItems } from "../components/invoices/templates/pager";

const cfg = {
	pageHeightMm: 297,
	headerHeightMm: 40,
	footerHeightMm: 20,
	minLastPageRows: 3,
} as const;

const makeItem = (name: string, quantity = 1, price = 1) => ({
	name,
	quantity,
	price,
});

describe("paginateItems", () => {
	it("splits 25 medium items", () => {
		const items = Array.from({ length: 25 }, (_, i) =>
			makeItem("x".repeat(250), 1, i + 1),
		);
		const pages = paginateItems(items, cfg);
		expect(pages.length).toBeGreaterThan(1);
		expect(pages.flat().length).toBe(25);
	});

	it("handles 100+ items", () => {
		const items = Array.from({ length: 120 }, (_, i) =>
			makeItem("row" + i, 1, i),
		);
		const pages = paginateItems(items, cfg);
		expect(pages.length).toBeGreaterThan(1);
		expect(pages.flat().length).toBe(120);
	});

	it("keeps continuity and no empty last page", () => {
		const items = Array.from({ length: 10 }, (_, i) => makeItem("short" + i));
		const pages = paginateItems(items, cfg);
		expect(pages.flat().join(",")).toBe(
			Array.from({ length: 10 }, (_, i) => i).join(","),
		);
		expect(pages[pages.length - 1].length).toBeGreaterThanOrEqual(1);
	});

	it("performance 1000+ items", () => {
		const items = Array.from({ length: 1200 }, (_, i) =>
			makeItem("x".repeat(((i % 5) + 1) * 40)),
		);
		const t0 = performance.now();
		const pages = paginateItems(items, cfg);
		const t1 = performance.now();
		expect(pages.flat().length).toBe(1200);
		expect(t1 - t0).toBeLessThan(500);
	});
});
