"use client";

import { create } from "zustand";
import type { Deal } from "@/lib/db/schema/deals";
import type { DealStage, DealView } from "./constants";

export type ModalMode = "create" | "edit";

export interface DealFiltersState {
	stage?: DealStage;
	owner?: string;
	search: string;
}

interface DealStoreState {
	deals: Deal[];
	filters: DealFiltersState;
	view: DealView;
	isModalOpen: boolean;
	modalMode: ModalMode;
	activeDealId: string | null;
	isSaving: boolean;

	setDeals: (deals: Deal[]) => void;
	addDeal: (deal: Deal) => void;
	updateDeal: (deal: Deal) => void;
	removeDeal: (id: string) => void;
	setView: (view: DealView) => void;
	setFilters: (filters: Partial<DealFiltersState>) => void;
	resetFilters: () => void;
	setModal: (isOpen: boolean, mode?: ModalMode, dealId?: string | null) => void;
	moveDeal: (dealId: string, stage: DealStage) => void;
	setSaving: (saving: boolean) => void;
}

const initialFilters: DealFiltersState = {
	search: "",
};

export const useDealsStore = create<DealStoreState>((set) => ({
	deals: [],
	filters: initialFilters,
	view: "kanban",
	isModalOpen: false,
	modalMode: "create",
	activeDealId: null,
	isSaving: false,

	setDeals: (deals) => set(() => ({ deals })),

	addDeal: (deal) =>
		set((state) => ({
			deals: [deal, ...state.deals],
		})),

	updateDeal: (deal) =>
		set((state) => ({
			deals: state.deals.map((item) =>
				item.id === deal.id ? { ...item, ...deal } : item,
			),
		})),

	removeDeal: (id) =>
		set((state) => ({
			deals: state.deals.filter((deal) => deal.id !== id),
		})),

	setView: (view) => set(() => ({ view })),

	setFilters: (filters) =>
		set((state) => ({
			filters: {
				...state.filters,
				...filters,
				search: filters.search ?? state.filters.search ?? "",
			},
		})),

	resetFilters: () => set(() => ({ filters: { ...initialFilters } })),

	setModal: (isOpen, mode = "create", dealId = null) =>
		set(() => ({
			isModalOpen: isOpen,
			modalMode: mode,
			activeDealId: dealId,
		})),

	moveDeal: (dealId, stage) =>
		set((state) => ({
			deals: state.deals.map((deal) =>
				deal.id === dealId
					? {
							...deal,
							stage,
						}
					: deal,
			),
		})),

	setSaving: (saving) => set(() => ({ isSaving: saving })),
}));
