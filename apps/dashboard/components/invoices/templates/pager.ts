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
	const paddingPx = 40; // Account for 20px top + 20px bottom padding
	const footerPx = mmToPx(cfg.footerHeightMm); // Space for footer on every page
	const headerPx = mmToPx(cfg.headerHeightMm); // Space for header on every page

	// Calculate exact capacities for each page type
	const firstPageCapacity = Math.max(
		0,
		pagePx - paddingPx - headerPx - footerPx - Math.max(0, extraTopPx * 0.6),
	);
	const middlePageCapacity = Math.max(0, pagePx - paddingPx - headerPx - footerPx);
	const lastPageCapacity = Math.max(
		0,
		pagePx - paddingPx - headerPx - footerPx - Math.max(0, extraBottomPx),
	);

	// Step 1: Best Fit Decreasing algorithm
	// Sort items by height (largest first) for better packing
	const itemsWithHeights = heightsPx.map((height, idx) => ({ idx, height }));
	itemsWithHeights.sort((a, b) => b.height - a.height); // Sort descending
	
	const pages: number[][] = [];
	
	// Place each item using Best Fit strategy
	for (const { idx: itemIdx, height: itemHeight } of itemsWithHeights) {
		let bestPageIdx = -1;
		let bestRemainingSpace = Infinity;
		
		// Find the best page where this item fits with minimum wasted space
		for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
			const page = pages[pageIdx];
			const capacity = pageIdx === 0 ? firstPageCapacity : middlePageCapacity;
			const currentHeight = page.reduce((sum, idx) => sum + (heightsPx[idx] || 0), 0);
			const remainingSpace = capacity - currentHeight;
			
			// Check if item fits and if this is the best fit (minimum wasted space)
			if (itemHeight <= remainingSpace && remainingSpace < bestRemainingSpace) {
				bestPageIdx = pageIdx;
				bestRemainingSpace = remainingSpace;
			}
		}
		
		// If we found a page where it fits, add it there
		if (bestPageIdx !== -1) {
			pages[bestPageIdx].push(itemIdx);
		} else {
			// Item doesn't fit on any existing page, create a new one
			const newPageIdx = pages.length;
			const isFirstPage = newPageIdx === 0;
			const capacity = isFirstPage ? firstPageCapacity : middlePageCapacity;
			
			// Even if item is too large, we must place it
			pages.push([itemIdx]);
		}
	}
	
	// Sort items back to original order within each page
	for (const page of pages) {
		page.sort((a, b) => a - b);
	}

	// Step 2: Aggressive optimization - multiple passes to maximize space usage
	for (let pass = 0; pass < 10; pass++) {
		let madeChanges = false;
		
		// Forward pass: move items from later pages to earlier pages
		for (let pageIdx = 0; pageIdx < pages.length - 1; pageIdx++) {
			const page = pages[pageIdx];
			let pageHeight = page.reduce((sum, idx) => sum + (heightsPx[idx] || 0), 0);
			const capacity = pageIdx === 0 ? firstPageCapacity : middlePageCapacity;
			const usagePercent = (pageHeight / capacity) * 100;
			
			// If page has less than 95% usage, try to fill from next page
			if (usagePercent < 95 && pageIdx + 1 < pages.length) {
				const nextPage = pages[pageIdx + 1];
				
				// Try to move items from next page
				for (let j = 0; j < nextPage.length; j++) {
					const itemIdx = nextPage[j];
					const itemHeight = heightsPx[itemIdx] || 0;
					const newHeight = pageHeight + itemHeight;
					
					if (newHeight <= capacity) {
						page.push(itemIdx);
						nextPage.splice(j, 1);
						j--; // Adjust index
						pageHeight = newHeight;
						madeChanges = true;
					} else {
						break;
					}
				}
				
				// Remove empty pages
				if (nextPage.length === 0 && pageIdx + 1 < pages.length - 1) {
					pages.splice(pageIdx + 1, 1);
					madeChanges = true;
				}
			}
		}
		
		// Backward pass: balance pages by moving items from full pages to empty ones
		for (let pageIdx = pages.length - 2; pageIdx >= 1; pageIdx--) {
			const page = pages[pageIdx];
			let pageHeight = page.reduce((sum, idx) => sum + (heightsPx[idx] || 0), 0);
			const capacity = middlePageCapacity;
			const usagePercent = (pageHeight / capacity) * 100;
			
			// If page is very empty (<70%), try to fill from previous page
			if (usagePercent < 70 && pageIdx > 0) {
				const prevPage = pages[pageIdx - 1];
				const prevCapacity = pageIdx - 1 === 0 ? firstPageCapacity : middlePageCapacity;
				let prevPageHeight = prevPage.reduce((sum, idx) => sum + (heightsPx[idx] || 0), 0);
				const prevUsagePercent = (prevPageHeight / prevCapacity) * 100;
				
				// Only move if previous page is reasonably full (>60%) or has many items
				if (prevUsagePercent > 60 || prevPage.length > 1) {
					// Try to move items from end of previous page
					for (let j = prevPage.length - 1; j >= 0; j--) {
						const itemIdx = prevPage[j];
						const itemHeight = heightsPx[itemIdx] || 0;
						const newHeight = pageHeight + itemHeight;
						const newPrevHeight = prevPageHeight - itemHeight;
						const newPrevUsagePercent = (newPrevHeight / prevCapacity) * 100;
						
						// Move if it fits and previous page still has reasonable usage
						if (newHeight <= capacity && (newPrevUsagePercent > 50 || prevPage.length > 1)) {
							page.unshift(itemIdx);
							prevPage.splice(j, 1);
							pageHeight = newHeight;
							prevPageHeight = newPrevHeight;
							madeChanges = true;
							
							// Stop if current page is now well-utilized
							if ((pageHeight / capacity) * 100 >= 75) break;
						} else {
							break;
						}
					}
				}
			}
		}
		
		// If no changes were made, we're done optimizing
		if (!madeChanges) break;
	}
	
	// Sort items back to original order within each page after optimization
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
