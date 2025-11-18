"use client";
import { LineItemsCore, MetaCore, SummaryCore } from "@crm/ui/invoice";
import { format } from "date-fns";
import Image from "next/image";
import * as React from "react";
import MinimalTiptapEditor from "@/components/ui/custom/minimal-tiptap/minimal-tiptap";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditorContent } from "./components/editor-content";
import { LineItems } from "./components/line-items";
import { Meta } from "./components/meta";
import { Summary } from "./components/summary";
import {
	paginateByHeights,
	paginateByHeightsWithExtras,
	paginateFixed,
	paginateItems,
} from "./pager";
import type { TemplateProps } from "./types";

export function HtmlTemplate({
	invoice_number,
	issue_date,
	due_date,
	template,
	line_items,
	customer_details,
	from_details,
	payment_details,
	note_details,
	currency,
	customer_name: _customer_name,
	width = "100%",
	height: _height = "100%",
	amountBeforeDiscount = 0,
	discountTotal = 0,
	subtotal = 0,
	totalVat = 0,
	total = 0,
	editable = false,
	interactive = true,
	items_per_page,
	pagination_mode = "measured",
	scroll_snap = true,
	lazy = true,
	preview_mode = false,
	editors,
}: TemplateProps) {
	// Helpers to convert between plain text (with \n) and Tiptap JSON doc
	const stringToDoc = (input: unknown) => {
		if (input && typeof input === "object") return input as object;
		const text = typeof input === "string" ? input : "";
		const lines = text.split("\n");
		return {
			type: "doc",
			content: lines.map((line) => ({
				type: "paragraph",
				content: line ? [{ type: "text", text: line }] : [],
			})),
		} as object;
	};
	const contentToString = (content: unknown): string => {
		// Expecting Tiptap JSON: doc -> paragraphs -> text nodes (ignore marks)
		try {
			const doc = content as {
				content?: Array<{ content?: Array<{ text?: string }> }>;
			};
			if (!doc?.content) return "";
			return doc.content
				.map((p) =>
					p?.content ? p.content.map((n) => n.text ?? "").join("") : "",
				)
				.join("\n");
		} catch {
			return typeof content === "string" ? content : "";
		}
	};
	const cfg = React.useMemo(
		() =>
			({
				pageHeightMm: 297,
				headerHeightMm: 40,
				footerHeightMm: 20,
				minLastPageRows: 3,
			}) as const,
		[],
	);
	const [measuredPages, setMeasuredPages] = React.useState<number[][] | null>(
		null,
	);
	const [pages, setPages] = React.useState<Array<typeof line_items>>([]);
	const [currentPage, setCurrentPage] = React.useState(1);
	const [_dirty, setDirty] = React.useState(false);
	const pagesRefs = React.useRef<Array<HTMLDivElement | null>>([]);
	React.useEffect(() => {
		const wrapper = document.querySelector<HTMLElement>(".print-wrapper");
		if (!wrapper) return;
		const onScroll = () => {
			const tops = pagesRefs.current.map((el) => {
				if (!el) return Infinity;
				const rect = el.getBoundingClientRect();
				const parentRect = wrapper.getBoundingClientRect();
				return Math.abs(rect.top - parentRect.top);
			});
			let idx = 0;
			let min = Infinity;
			for (let i = 0; i < tops.length; i++) {
				if (tops[i] < min) {
					min = tops[i];
					idx = i;
				}
			}
			setCurrentPage(idx + 1);
		};
		wrapper.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => wrapper.removeEventListener("scroll", onScroll);
	}, [pages.length]);

	React.useEffect(() => {
		let idx = paginateItems(
			line_items.map((li) => ({
				name: li.name,
				quantity: li.quantity,
				price: li.price,
			})),
			cfg,
		);
		if (pagination_mode === "fixed" && items_per_page && items_per_page > 0) {
			idx = paginateFixed(line_items.length, items_per_page);
		}
		setMeasuredPages((p) => p ?? null);
		setPages(idx.map((idxs) => idxs.map((i) => line_items[i])));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [line_items.length, pagination_mode, items_per_page]);

	const measureRef = React.useRef<HTMLDivElement | null>(null);
	React.useEffect(() => {
		if (pagination_mode !== "measured") return;
		const el = measureRef.current;
		if (!el) return;
		const rows = Array.from(el.querySelectorAll<HTMLElement>(".li-row"));
		if (!rows.length) return;
		const heights = rows.map((r) => r.offsetHeight);
		const headerEl = el.querySelector<HTMLElement>(".measure-header");
		const footerEl = el.querySelector<HTMLElement>(".measure-footer");
		const extraTopPx = headerEl ? headerEl.offsetHeight : 0;
		const extraBottomPx = footerEl ? footerEl.offsetHeight : 0;
		const idxPages = paginateByHeightsWithExtras(
			heights,
			cfg,
			extraTopPx,
			extraBottomPx,
		);
		setMeasuredPages(idxPages);
		setPages(idxPages.map((idxs) => idxs.map((i) => line_items[i])));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [line_items, pagination_mode]);

	const PageContainer = ({
		children,
		isLast,
		pageIndex,
	}: {
		children: React.ReactNode;
		isLast?: boolean;
		pageIndex?: number;
	}) => (
		<div
			className={`${isLast ? "" : "break-after-page"} ${scroll_snap ? "snap-start" : ""} ${preview_mode ? "preview-page" : ""}`}
			style={
				preview_mode
					? {
							width: "210mm",
							minHeight: "297mm",
							background: "white",
							marginBottom: isLast ? 0 : "24px",
							boxShadow:
								"0 2px 8px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.15)",
							borderRadius: "4px",
							position: "relative",
							overflow: "hidden",
						}
					: undefined
			}
		>
			{children}
		</div>
	);

	return (
		<ScrollArea
			className={`bg-transparent w-full md:w-auto h-full print-wrapper ${scroll_snap ? "snap-y snap-mandatory" : ""} ${preview_mode ? "preview-wrapper" : ""}`}
			style={{
				width: "100%",
				maxWidth: preview_mode ? undefined : width,
				height: "100%",
				scrollSnapType: scroll_snap ? "y mandatory" : undefined,
			}}
		>
			{/* hidden measurement container */}
			<div
				ref={measureRef}
				style={{
					position: "absolute",
					left: -10000,
					top: 0,
					visibility: "hidden",
					width: "210mm",
				}}
				className={preview_mode ? "preview-page" : ""}
			>
				<div className="p-[20px]">
					<div className="measure-header mt-0">
						<Meta
							template={template}
							invoiceNumber={invoice_number}
							issueDate={issue_date}
							dueDate={due_date}
						/>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-[11px] text-[#878787] font-medium mb-2">
									{template.from_label}
								</p>
								<div className="text-[11px] leading-relaxed">
									<EditorContent content={from_details} />
								</div>
							</div>
							<div>
								<p className="text-[11px] text-[#878787] font-medium mb-2">
									To
								</p>
								<div className="text-[11px] leading-relaxed">
									<EditorContent content={customer_details} />
								</div>
							</div>
						</div>
					</div>
					<div className="mt-4">
						<LineItems
							lineItems={line_items}
							currency={currency}
							descriptionLabel={template.description_label}
							quantityLabel={template.quantity_label}
							priceLabel={template.price_label}
							totalLabel={template.total_label}
							includeVAT={template.include_vat}
							editable={false}
							interactive={false}
						/>
					</div>
					<div className="measure-footer mt-6 md:mt-8">
						<div className="flex justify-end mb-6 md:mb-8">
							<div className="w-full max-w-md">
								<SummaryCore
									includeVAT={template.include_vat}
									includeTax={template.include_tax}
									taxRate={template.tax_rate || 0}
									currency={currency}
									vatLabel={template.vat_label}
									taxLabel={template.tax_label}
									totalLabel={template.total_label}
									amountBeforeDiscount={amountBeforeDiscount}
									discountTotal={discountTotal}
									subtotal={subtotal}
									totalVat={totalVat}
									total={total}
								/>
							</div>
						</div>
						<div className="flex flex-col space-y-6 md:space-y-8">
							{note_details ? (
								<div>
									<p className="text-[11px] text-[#878787] font-mono mb-2 block">
										{template.note_label}
									</p>
									<EditorContent content={note_details} />
								</div>
							) : null}
							<div className="pt-6">
								<div className="text-[11px] text-[#878787] font-mono">
									<EditorContent content={payment_details} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div
				className={
					preview_mode
						? "flex flex-col items-center"
						: "p-4 sm:p-6 md:p-8 h-full flex flex-col"
				}
			>
				{/* Print helpers */}
				<style>{`
          @page {
            size: A4;
            margin: 20mm;
          }
          @media print {
            .break-after-page { page-break-after: always; }
            .print-wrapper { height: auto !important; overflow: visible !important; }
            .print-wrapper > div { height: auto !important; }
            .print-wrapper { width: 210mm !important; max-width: 210mm !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
				{pages.map((items, pageIndex) => {
					const isFirst = pageIndex === 0;
					const isLast = pageIndex === pages.length - 1;
					return (
						<div
							key={`page-${pageIndex}`}
							ref={(el) => (pagesRefs.current[pageIndex] = el)}
						>
							<PageContainer isLast={isLast} pageIndex={pageIndex}>
								{(!lazy || Math.abs(pageIndex + 1 - currentPage) <= 1) && (
									<div className="p-[20px] flex flex-col relative" style={{ minHeight: preview_mode ? "297mm" : "100%", height: preview_mode ? "297mm" : "auto" }}>
										{/* Header on every page */}
										<div className="mb-4 pb-4 flex-shrink-0">
											<div className="flex items-center justify-between gap-4">
												<div className="font-mono space-y-0.5">
													<div className="text-[13px]">
														<span className="text-[#878787]">Invoice No: </span>
														<span className="text-gray-900 tabular-nums">
															{invoice_number}
														</span>
													</div>
													<div className="text-[11px]">
														<span className="text-[#878787]">Issue Date: </span>
														<span className="text-gray-900 tabular-nums">
															{format(new Date(issue_date), "dd/MM/yyyy")}
														</span>
													</div>
													{due_date && (
														<div className="text-[11px]">
															<span className="text-[#878787]">Due Date: </span>
															<span className="text-gray-900 tabular-nums">
																{format(new Date(due_date), "dd/MM/yyyy")}
															</span>
														</div>
													)}
												</div>
												{template.logo_url && (
													<div className="flex-shrink-0">
														<Image
															src={template.logo_url}
															alt="Company Logo"
															width={64}
															height={64}
															className="h-16 w-16 object-contain"
														/>
													</div>
												)}
											</div>
										</div>

										<div className="flex-1 flex-shrink-0" style={{ paddingBottom: "120px" }}>
											{isFirst && (
												<>
													<div className="grid grid-cols-2 gap-8 mt-4 pl-4">
														<div>
															<p className="text-[11px] text-[#878787] font-medium mb-2">
																{template.from_label}
															</p>
															<div className="text-[11px] leading-relaxed">
																{editable && editors?.from ? (
																	<MinimalTiptapEditor
																		className="mt-0"
																		value={stringToDoc(editors.from.value)}
																		onChange={(val) => {
																			editors.from &&
																				editors.from.onChange(
																					contentToString(val),
																				);
																			setDirty(true);
																		}}
																		output="json"
																		editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap break-words"
																		hideToolbar
																		unstyled
																	/>
																) : (
																	<EditorContent content={from_details} />
																)}
															</div>
														</div>
														<div>
															<p className="text-[11px] text-[#878787] font-medium mb-2">
																To
															</p>
															<div className="text-[11px] leading-relaxed">
																{editable && editors?.customer ? (
																	<MinimalTiptapEditor
																		className="mt-0"
																		value={stringToDoc(editors.customer.value)}
																		onChange={(val) => {
																			editors.customer &&
																				editors.customer.onChange(
																					contentToString(val),
																				);
																			setDirty(true);
																		}}
																		output="json"
																		editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap break-words"
																		hideToolbar
																		unstyled
																	/>
																) : (
																	<EditorContent content={customer_details} />
																)}
															</div>
														</div>
													</div>
												</>
											)}

										<div className="mt-4">
											<LineItems
												lineItems={items}
												currency={currency}
												descriptionLabel={template.description_label}
												quantityLabel={template.quantity_label}
												priceLabel={template.price_label}
												totalLabel={template.total_label}
												includeVAT={template.include_vat}
												editable={editable}
												interactive={interactive}
												onChangeDescription={
													editors?.onLineItemDescriptionChange
												}
												onChangeQuantity={editors?.onLineItemQuantityChange}
												onChangePrice={editors?.onLineItemPriceChange}
												onChangeUnit={editors?.onLineItemUnitChange}
												onChangeVat={editors?.onLineItemVatChange}
												onChangeDiscount={editors?.onLineItemDiscountChange}
												onAddLineItem={
													isLast ? editors?.onAddLineItem : undefined
												}
												activeAutocompleteIndex={
													editors?.activeAutocompleteIndex
												}
												onAutocompleteCommit={editors?.onAutocompleteCommit}
												onDeleteLineItem={editors?.onDeleteLineItem}
												onMoveLineItem={editors?.onMoveLineItem}
											/>
										</div>

											{isLast && (
												<>
													<div className="mt-6 md:mt-8 flex justify-end mb-6 md:mb-8">
														<div>
															{editable || interactive ? (
																<Summary
																	includeVAT={template.include_vat}
																	includeTax={template.include_tax}
																	taxRate={template.tax_rate}
																	currency={currency}
																	vatLabel={template.vat_label}
																	taxLabel={template.tax_label}
																	totalLabel={template.total_label}
																	lineItems={line_items}
																	amountBeforeDiscount={amountBeforeDiscount}
																	discountTotal={discountTotal}
																	subtotal={subtotal}
																	totalVat={totalVat}
																	total={total}
																/>
															) : (
																<SummaryCore
																	includeVAT={template.include_vat}
																	includeTax={template.include_tax}
																	taxRate={template.tax_rate || 0}
																	currency={currency}
																	vatLabel={template.vat_label}
																	taxLabel={template.tax_label}
																	totalLabel={template.total_label}
																	amountBeforeDiscount={amountBeforeDiscount}
																	discountTotal={discountTotal}
																	subtotal={subtotal}
																	totalVat={totalVat}
																	total={total}
																/>
															)}
														</div>
													</div>

													<div className="flex flex-col space-y-6 md:space-y-8 mt-auto">
														<div>
															<p className="text-[11px] text-[#878787] font-mono mb-2 block">
																{template.note_label}
															</p>
															{editable && editors?.notes ? (
																<MinimalTiptapEditor
																	className="mt-0"
																	value={
																		typeof editors.notes.value === "string"
																			? stringToDoc(String(editors.notes.value))
																			: (editors.notes.value as object)
																	}
																	onChange={(val) =>
																		editors.notes && editors.notes.onChange(val)
																	}
																	output="json"
																	editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap"
																	hideToolbar
																	unstyled
																/>
															) : note_details ? (
																<EditorContent content={note_details} />
															) : null}
														</div>
													</div>
												</>
											)}
										</div>

										{/* Footer on every page */}
										<div className="absolute bottom-[30px] left-[20px] right-[20px] pt-4 border-t border-gray-200">
											<div className="text-[11px] text-[#878787] font-mono mb-3">
												{editable && editors?.payment ? (
													<MinimalTiptapEditor
														className="mt-0"
														value={stringToDoc(editors.payment.value)}
														onChange={(val) =>
															editors.payment &&
															editors.payment.onChange(contentToString(val))
														}
														output="json"
														editorContentClassName="min-h-24 font-mono text-[11px] leading-4 whitespace-pre-wrap break-words"
														hideToolbar
														unstyled
													/>
												) : (
													<EditorContent content={payment_details} />
												)}
											</div>
											<div className="flex items-center justify-between text-[10px] text-[#878787]">
												<span className="tabular-nums">
													{new Date().toLocaleDateString()}
												</span>
												<span className="tabular-nums">
													Page {pageIndex + 1} / {pages.length}
												</span>
											</div>
										</div>
									</div>
								)}
							</PageContainer>
						</div>
					);
				})}
				{/* sticky indicator of current page when scroll snapping */}
				{scroll_snap && (
					<div className="fixed bottom-4 right-4 px-3 py-1 rounded bg-white/80 shadow text-[11px] tabular-nums">
						{`Page ${currentPage} / ${pages.length}`}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
