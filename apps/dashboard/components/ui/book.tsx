import { BookOpen } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface BookProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
	description?: string;
	href?: string;
}

function Book({ className, title, description, href, ...props }: BookProps) {
	const content = (
		<div
			className={cn(
				"flex items-start gap-3 rounded-lg border border-[var(--geist-border-1)] bg-[var(--geist-background-1)] p-4 transition-colors hover:border-[var(--geist-border-2)] dark:border-[var(--geist-dark-border-default)] dark:bg-[var(--geist-dark-component-default)] dark:hover:border-[var(--geist-dark-border-hover)] [data-theme-preset='vercel']:border-[var(--geist-gray-3)] [data-theme-preset='vercel']:bg-[var(--geist-gray-1)] [data-theme-preset='vercel']:hover:border-[var(--geist-gray-4)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):border-[var(--geist-dark-border-default)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):bg-[var(--geist-dark-component-default)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):hover:border-[var(--geist-dark-border-hover)]",
				href && "cursor-pointer",
				className,
			)}
			{...props}
		>
			<div className="flex-shrink-0">
				<BookOpen className="size-5 text-[var(--geist-text-10)] dark:text-[var(--geist-dark-text-primary)] [data-theme-preset='vercel']:text-[var(--geist-gray-9)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):text-[var(--geist-dark-text-primary)]" />
			</div>
			<div className="flex-1 min-w-0">
				<h3 className="text-sm font-semibold text-[var(--geist-text-10)] dark:text-[var(--geist-dark-text-primary)] [data-theme-preset='vercel']:text-[var(--geist-gray-10)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):text-[var(--geist-dark-text-primary)]">
					{title}
				</h3>
				{description && (
					<p className="mt-1 text-sm text-[var(--geist-text-9)] dark:text-[var(--geist-dark-text-secondary)] [data-theme-preset='vercel']:text-[var(--geist-gray-6)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):text-[var(--geist-dark-text-secondary)]">
						{description}
					</p>
				)}
			</div>
		</div>
	);

	if (href) {
		return (
			<a href={href} className="block no-underline">
				{content}
			</a>
		);
	}

	return content;
}

export { Book };
export type { BookProps };

