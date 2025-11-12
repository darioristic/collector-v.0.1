export const DEAL_STAGES = [
	"Lead",
	"Qualified",
	"Proposal",
	"Negotiation",
	"Closed Won",
	"Closed Lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const DEAL_VIEWS = ["kanban", "table", "compact"] as const;

export type DealView = (typeof DEAL_VIEWS)[number];

export const DEAL_STAGE_DESCRIPTIONS: Record<DealStage, string> = {
	Lead: "New opportunities entering your pipeline.",
	Qualified: "Validated prospects with clear potential.",
	Proposal: "Formal offers shared and awaiting feedback.",
	Negotiation: "In active negotiations on scope or pricing.",
	"Closed Won": "Successfully closed deals.",
	"Closed Lost": "Opportunities that did not close.",
};

export const DEAL_STAGE_BADGE_CLASSNAME: Record<DealStage, string> = {
	Lead: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
	Qualified:
		"bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
	Proposal:
		"bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
	Negotiation:
		"bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300",
	"Closed Won":
		"bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
	"Closed Lost":
		"bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};
