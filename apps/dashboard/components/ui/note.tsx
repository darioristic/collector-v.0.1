import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const noteVariants = cva(
	"flex items-start gap-3 rounded-lg border p-4 text-sm transition-colors",
	{
		variants: {
			variant: {
				default:
					"border-[var(--geist-border-1)] bg-[var(--geist-background-1)] text-[var(--geist-text-10)] [data-theme-preset='vercel']:border-[var(--geist-gray-3)] [data-theme-preset='vercel']:bg-[var(--geist-gray-1)] [data-theme-preset='vercel']:text-[var(--geist-gray-10)]",
				secondary:
					"border-[var(--geist-border-1)] bg-[var(--geist-background-2)] text-[var(--geist-text-10)] [data-theme-preset='vercel']:border-[var(--geist-gray-3)] [data-theme-preset='vercel']:bg-[var(--geist-gray-2)] [data-theme-preset='vercel']:text-[var(--geist-gray-10)]",
				warning:
					"border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 [data-theme-preset='vercel']:border-[var(--geist-amber-4)] [data-theme-preset='vercel']:bg-[var(--geist-amber-1)] [data-theme-preset='vercel']:text-[var(--geist-gray-9)]",
				error:
					"border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200 [data-theme-preset='vercel']:border-[var(--geist-red-4)] [data-theme-preset='vercel']:bg-[var(--geist-red-1)] [data-theme-preset='vercel']:text-[var(--geist-gray-9)]",
				success:
					"border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200 [data-theme-preset='vercel']:border-[var(--geist-green-4)] [data-theme-preset='vercel']:bg-[var(--geist-green-1)] [data-theme-preset='vercel']:text-[var(--geist-gray-9)]",
				info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 [data-theme-preset='vercel']:border-[var(--geist-blue-3)] [data-theme-preset='vercel']:bg-[var(--geist-blue-1)] [data-theme-preset='vercel']:text-[var(--geist-gray-9)]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface NoteProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
		VariantProps<typeof noteVariants> {
	children: React.ReactNode;
	action?: React.ReactNode;
}

function Note({ className, variant, children, action, ...props }: NoteProps) {
	return (
		<div className={cn(noteVariants({ variant }), className)} {...props}>
			<div className="flex-1 min-w-0">{children}</div>
			{action && <div className="flex-shrink-0">{action}</div>}
		</div>
	);
}

export { Note, noteVariants };
export type { NoteProps };
