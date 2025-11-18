export type PagerConfig = {
	pageHeightMm: number;
	headerHeightMm: number;
	footerHeightMm: number;
	minLastPageRows: number;
};

export type PagerItem = {
	name: string;
	quantity: number;
	price: number;
};

const mmToPx = (mm: number) => mm * 3.7795275591;

const estimateRowHeightPx = (item: PagerItem) => {
	const base = 28;
	const perLine = 16;
	const charsPerLine = 70;
	const lines = Math.max(1, Math.ceil((item.name || "").length / charsPerLine));
	return base + (lines - 1) * perLine;
};

export const paginateItems = (items: PagerItem[], cfg: PagerConfig) => {
	const pagePx = mmToPx(cfg.pageHeightMm);
	const headerPx = mmToPx(cfg.headerHeightMm);
	const footerPx = mmToPx(cfg.footerHeightMm);
	const capacityPx = Math.max(0, pagePx - headerPx - footerPx);
	const pages: number[][] = [];
	let acc = 0;
	let page: number[] = [];
	for (let i = 0; i < items.length; i++) {
		const h = estimateRowHeightPx(items[i]);
		if (acc + h > capacityPx && page.length > 0) {
			pages.push(page);
			acc = 0;
			page = [];
		}
		acc += h;
		page.push(i);
	}
	if (page.length) pages.push(page);
	if (
		pages.length > 1 &&
		pages[pages.length - 1].length < cfg.minLastPageRows
	) {
		const last = pages[pages.length - 1];
		const prev = pages[pages.length - 2];
		const moved = prev.pop();
		if (typeof moved === "number") last.unshift(moved);
	}
	return pages;
};

export const paginateByHeights = (heightsPx: number[], cfg: PagerConfig) => {
	const pagePx = mmToPx(cfg.pageHeightMm);
	const headerPx = mmToPx(cfg.headerHeightMm);
	const footerPx = mmToPx(cfg.footerHeightMm);
	const capacityPx = Math.max(0, pagePx - headerPx - footerPx);
	const pages: number[][] = [];
	let acc = 0;
	let page: number[] = [];
	for (let i = 0; i < heightsPx.length; i++) {
		const h = heightsPx[i] || 0;
		if (acc + h > capacityPx && page.length > 0) {
			pages.push(page);
			acc = 0;
			page = [];
		}
		acc += h;
		page.push(i);
	}
	if (page.length) pages.push(page);
	if (
		pages.length > 1 &&
		pages[pages.length - 1].length < cfg.minLastPageRows
	) {
		const last = pages[pages.length - 1];
		const prev = pages[pages.length - 2];
		const moved = prev.pop();
		if (typeof moved === "number") last.unshift(moved);
	}
	return pages;
};

export const paginateByHeightsWithExtras = (
	heightsPx: number[],
	cfg: PagerConfig,
	extraTopPx = 0,
	extraBottomPx = 0,
) => {
	const pagePx = mmToPx(cfg.pageHeightMm);
	const paddingPx = 40; // Account for 20px top + 20px bottom padding
	const pageFooterPx = 50; // Space for date and page number footer (only on last page now)

	// Different capacity for first, middle, and last pages
	// First and middle pages: no page footer (moved to last page only)
	// Last page: includes page footer
	// Use only 60% of measured header height to allow more items on first page
	const firstPageCapacity = Math.max(
		0,
		pagePx - paddingPx - Math.max(0, extraTopPx * 0.6),
	);
	const middlePageCapacity = Math.max(0, pagePx - paddingPx);
	const lastPageCapacity = Math.max(
		0,
		pagePx - paddingPx - pageFooterPx - Math.max(0, extraBottomPx),
	);

	const pages: number[][] = [];
	let acc = 0;
	let page: number[] = [];
	let pageNum = 0;

	for (let i = 0; i < heightsPx.length; i++) {
		const h = heightsPx[i] || 0;
		const currentCapacity =
			pageNum === 0 ? firstPageCapacity : middlePageCapacity;

		if (acc + h > currentCapacity && page.length > 0) {
			pages.push(page);
			acc = 0;
			page = [];
			pageNum++;
		}
		acc += h;
		page.push(i);
	}
	if (page.length) pages.push(page);
	if (
		pages.length > 1 &&
		pages[pages.length - 1].length < cfg.minLastPageRows
	) {
		const last = pages[pages.length - 1];
		const prev = pages[pages.length - 2];
		const moved = prev.pop();
		if (typeof moved === "number") last.unshift(moved);
	}
	return pages;
};

export const paginateFixed = (length: number, perPage: number) => {
	const pages: number[][] = [];
	for (let i = 0; i < length; i += perPage) {
		const idxs: number[] = [];
		for (let j = i; j < Math.min(i + perPage, length); j++) idxs.push(j);
		pages.push(idxs);
	}
	return pages;
};

export const buildPages = (items: PagerItem[], cfg: PagerConfig) => {
	const idxPages = paginateItems(items, cfg);
	return idxPages.map((idxs) => idxs.map((i) => items[i]));
};
