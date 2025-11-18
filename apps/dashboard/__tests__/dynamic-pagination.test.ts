import { describe, expect, it } from "vitest";
import {
	paginateByHeightsWithExtras,
	paginateFixed,
} from "../components/invoices/templates/pager";

describe("dynamic pagination", () => {
	it("paginateFixed splits into equal pages", () => {
		const pages = paginateFixed(25, 10);
		expect(pages.length).toBe(3);
		expect(pages[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		expect(pages[1]).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
		expect(pages[2]).toEqual([20, 21, 22, 23, 24]);
	});

	it("paginateByHeightsWithExtras creates more pages when extras large", () => {
		const heights = Array.from({ length: 20 }, () => 40);
		const cfg = {
			pageHeightMm: 297,
			headerHeightMm: 40,
			footerHeightMm: 20,
			minLastPageRows: 3,
		} as const;
		const pagesNoExtras = paginateByHeightsWithExtras(heights, cfg, 0, 0);
		const pagesWithExtras = paginateByHeightsWithExtras(heights, cfg, 300, 300);
		expect(pagesWithExtras.length).toBeGreaterThan(pagesNoExtras.length);
	});
});
