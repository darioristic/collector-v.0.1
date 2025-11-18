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
	notesHeightPx = 0,
) => {
	const pagePx = mmToPx(cfg.pageHeightMm);
	const paddingPx = 40;
	const footerPx = mmToPx(cfg.footerHeightMm);
	const headerPx = mmToPx(cfg.headerHeightMm);

	// Calculate capacities using actual measurements
	// extraTopPx = From/To section height (109px typically)
	// All pages (first and middle) must have the same capacity
	// Use full extraTopPx for all pages to ensure consistent spacing
	const firstPageCapacity = Math.max(
		0,
		pagePx - paddingPx - headerPx - footerPx - extraTopPx,
	);
	// Middle pages must have same capacity as first page
	const middlePageCapacity = firstPageCapacity;
	const lastPageCapacity = Math.max(
		0,
		pagePx - paddingPx - headerPx - footerPx - Math.max(0, extraBottomPx),
	);

	// Step 1: Smart packing - try to maximize each page
	const pages: number[][] = [];
	const remainingItems = heightsPx.map((_, idx) => idx);
	let isFirstPage = true;

	while (remainingItems.length > 0) {
		const capacity = isFirstPage ? firstPageCapacity : middlePageCapacity;
		const currentPage: number[] = [];
		let currentHeight = 0;
		
		// Try to pack as many items as possible on current page
		// Use multiple passes to find best combination
		for (let pass = 0; pass < 3; pass++) {
			for (let i = 0; i < remainingItems.length; i++) {
				const itemIdx = remainingItems[i];
				const itemHeight = heightsPx[itemIdx] || 0;
				
				if (currentHeight + itemHeight <= capacity) {
					currentPage.push(itemIdx);
					currentHeight += itemHeight;
					remainingItems.splice(i, 1);
					i--;
				}
			}
		}
		
		if (currentPage.length > 0) {
			pages.push(currentPage);
			isFirstPage = false;
		} else {
			// No items fit, but we must place at least one
			const itemIdx = remainingItems.shift();
			if (itemIdx !== undefined) {
				pages.push([itemIdx]);
				isFirstPage = false;
			}
		}
	}

	// Step 2: ULTRA AGGRESSIVE optimization - fill pages with single items
	// Keep optimizing until no more changes can be made
	for (let pass = 0; pass < 500; pass++) {
		let madeChanges = false;
		
		// PRIORITY 1: Find ALL pages with single items and fill them
		const singleItemPages: number[] = [];
		for (let i = 0; i < pages.length; i++) {
			if (pages[i].length === 1) {
				singleItemPages.push(i);
			}
		}
		
		// Process single-item pages
		for (const pageIdx of singleItemPages) {
			const page = pages[pageIdx];
			const singleItemIdx = page[0];
			const singleItemHeight = heightsPx[singleItemIdx] || 0;
			const capacity = pageIdx === 0 ? firstPageCapacity : middlePageCapacity;
			let availableSpace = capacity - singleItemHeight;
			
			// If there's space, try to fill it from ANY other page
			if (availableSpace > 0) {
				// Get all items from all other pages, sorted by height (smallest first for better fit)
				const allOtherItems: Array<{ itemIdx: number; height: number; sourcePageIdx: number; sourcePos: number }> = [];
				
				for (let sourcePageIdx = 0; sourcePageIdx < pages.length; sourcePageIdx++) {
					if (sourcePageIdx === pageIdx) continue;
					const sourcePage = pages[sourcePageIdx];
					
					for (let pos = 0; pos < sourcePage.length; pos++) {
						allOtherItems.push({
							itemIdx: sourcePage[pos],
							height: heightsPx[sourcePage[pos]] || 0,
							sourcePageIdx,
							sourcePos: pos
						});
					}
				}
				
				// Sort by height (smallest first) to maximize number of items we can fit
				allOtherItems.sort((a, b) => a.height - b.height);
				
				// Try to fit as many items as possible
				for (const { itemIdx, height, sourcePageIdx, sourcePos } of allOtherItems) {
					if (height <= availableSpace) {
						page.push(itemIdx);
						pages[sourcePageIdx].splice(sourcePos, 1);
						availableSpace -= height;
						madeChanges = true;
						
						// Update positions for remaining items
						for (let i = 0; i < allOtherItems.length; i++) {
							if (allOtherItems[i].sourcePageIdx === sourcePageIdx && allOtherItems[i].sourcePos > sourcePos) {
								allOtherItems[i].sourcePos--;
							}
						}
						
						if (availableSpace <= 0) break;
					}
				}
				
				// Remove empty pages
				for (let i = pages.length - 1; i >= 0; i--) {
					if (pages[i].length === 0 && i !== pages.length - 1) {
						pages.splice(i, 1);
						madeChanges = true;
					}
				}
			}
		}
		
		// PRIORITY 2: Fill any page with space from next page
		for (let pageIdx = 0; pageIdx < pages.length - 1; pageIdx++) {
			const page = pages[pageIdx];
			let pageHeight = page.reduce((sum, idx) => sum + (heightsPx[idx] || 0), 0);
			const capacity = pageIdx === 0 ? firstPageCapacity : middlePageCapacity;
			let spaceLeft = capacity - pageHeight;

			if (spaceLeft > 0 && pageIdx + 1 < pages.length) {
				const nextPage = pages[pageIdx + 1];
				
				for (let j = 0; j < nextPage.length; j++) {
					const itemIdx = nextPage[j];
					const itemHeight = heightsPx[itemIdx] || 0;

					if (itemHeight <= spaceLeft) {
						page.push(itemIdx);
						nextPage.splice(j, 1);
						j--;
						pageHeight += itemHeight;
						spaceLeft = capacity - pageHeight;
						madeChanges = true;
					}
				}
				
				if (nextPage.length === 0 && pageIdx + 1 < pages.length - 1) {
					pages.splice(pageIdx + 1, 1);
					madeChanges = true;
				}
			}
		}
		
		if (!madeChanges) break;
	}
	
	// Sort items back to original order
	for (const page of pages) {
		page.sort((a, b) => a - b);
	}

	// Step 3: Handle last page - ensure summary and notes fit
	if (pages.length > 0) {
		const lastPage = pages[pages.length - 1];
		let lastPageHeight = lastPage.reduce((sum, idx) => sum + (heightsPx[idx] || 0), 0);
		
		// Calculate total space needed: summary + payment + notes
		const totalBottomSpace = extraBottomPx + notesHeightPx;
		
		// If last page content + summary + notes would overflow, move items to new page
		if (lastPageHeight + totalBottomSpace > lastPageCapacity && lastPage.length > 1) {
			const itemsToMove: number[] = [];
			let newHeight = lastPageHeight;
			
			// Move items from end until we have space for summary + notes
			for (let i = lastPage.length - 1; i >= 0; i--) {
				const itemIdx = lastPage[i];
				const itemHeight = heightsPx[itemIdx] || 0;
				
				if ((newHeight - itemHeight) + totalBottomSpace <= lastPageCapacity && lastPage.length > 1) {
					itemsToMove.unshift(itemIdx);
					newHeight -= itemHeight;
					lastPage.pop();
				} else {
					break;
				}
			}
			
			// If we moved items, create a new page for them
			if (itemsToMove.length > 0) {
				pages.push(itemsToMove);
			}
		}
		
		// Step 3b: If notes are too long, ensure we have enough space
		// Keep moving items until notes can fit
		if (notesHeightPx > 0) {
			lastPageHeight = lastPage.reduce((sum, idx) => sum + (heightsPx[idx] || 0), 0);
			let availableSpaceForNotes = lastPageCapacity - lastPageHeight - extraBottomPx;
			const itemsMovedForNotes: number[] = [];
			
			// If notes don't fit, keep moving items until they do
			// We need at least the full notes height
			while (availableSpaceForNotes < notesHeightPx && lastPage.length > 1) {
				const lastItemIdx = lastPage[lastPage.length - 1];
				const lastItemHeight = heightsPx[lastItemIdx] || 0;
				
				// Move item
				itemsMovedForNotes.unshift(lastItemIdx);
				lastPage.pop();
				lastPageHeight -= lastItemHeight;
				availableSpaceForNotes = lastPageCapacity - lastPageHeight - extraBottomPx;
				
				// Safety check to prevent infinite loop
				if (lastPage.length === 0) break;
			}
			
			// If we moved items, create a new page for them
			if (itemsMovedForNotes.length > 0) {
				pages.push(itemsMovedForNotes);
			}
		}
	}

	// Step 4: Final optimization - try to balance pages better
	// If a middle page has very low usage, try to move items from previous page
	// BUT: Never touch the first page (pageIdx 0)
	for (let pageIdx = 2; pageIdx < pages.length - 1; pageIdx++) {
		const page = pages[pageIdx];
		let pageHeight = page.reduce((sum, idx) => sum + (heightsPx[idx] || 0), 0);
		const usagePercent = (pageHeight / middlePageCapacity) * 100;
		
		// If page has less than 40% usage, try to move items from previous page
		// Only if previous page is not the first page (pageIdx > 1 ensures prevPage is not first)
		if (usagePercent < 40 && pageIdx > 1) {
			const prevPage = pages[pageIdx - 1];
			
			// Try to move items from end of previous page to start of current page
			for (let j = prevPage.length - 1; j >= 0; j--) {
				const itemIdx = prevPage[j];
				const itemHeight = heightsPx[itemIdx] || 0;
				const newHeight = pageHeight + itemHeight;
				
				// Only move if it fits within capacity
				if (newHeight <= middlePageCapacity) {
					page.unshift(itemIdx);
					prevPage.splice(j, 1);
					pageHeight = newHeight;
				} else {
					break;
				}
			}
		}
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
