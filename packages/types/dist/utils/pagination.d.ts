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
export declare const paginateItems: (items: PagerItem[], cfg: PagerConfig) => number[][];
export declare const paginateByHeightsWithExtras: (heightsPx: number[], cfg: PagerConfig, extraTopPx?: number, extraBottomPx?: number) => number[][];
export declare const paginateFixed: (length: number, perPage: number) => number[][];
