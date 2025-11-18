import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center justify-center rounded-md border font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none gap-1 transition-[color,box-shadow] overflow-hidden",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
				warning:
					"border border-orange-400 bg-orange-50 text-orange-800 [a&]:hover:bg-orange-500/90 focus-visible:ring-orange-500/20 dark:focus-visible:ring-orange-500/40 dark:bg-orange-900/70 dark:text-white/80",
				info: "border border-blue-400 bg-blue-50 text-blue-800 [a&]:hover:bg-blue-500/90 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-500/40 dark:bg-blue-900/70 dark:text-white/80",
				success:
					"border border-green-400 bg-green-50 text-green-800 [a&]:hover:bg-green-500/90 focus-visible:ring-green-500/20 dark:focus-visible:ring-green-500/40 dark:bg-green-900/70 dark:text-white/80",
				destructive:
					"border border-red-400 bg-red-50 text-red-800 [a&]:hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-900/70 dark:text-white/80",
				outline:
					"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
				// Geist variants - Gray
				gray: "[data-theme-preset='vercel']:!bg-[var(--geist-gray-6)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				"gray-subtle":
					"[data-theme-preset='vercel']:!bg-[var(--geist-gray-2)] [data-theme-preset='vercel']:!text-[var(--geist-gray-9)] [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Blue
				blue: "[data-theme-preset='vercel']:!bg-[var(--geist-blue-6)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				"blue-subtle":
					"[data-theme-preset='vercel']:!bg-[var(--geist-blue-1)] [data-theme-preset='vercel']:!text-[var(--geist-blue-10)] [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Purple
				purple:
					"[data-theme-preset='vercel']:!bg-[var(--geist-purple-5)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				"purple-subtle":
					"[data-theme-preset='vercel']:!bg-[var(--geist-purple-1)] [data-theme-preset='vercel']:!text-[var(--geist-gray-9)] [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Amber
				amber:
					"[data-theme-preset='vercel']:!bg-[var(--geist-amber-5)] [data-theme-preset='vercel']:!text-[var(--geist-gray-10)] [data-theme-preset='vercel']:!border-transparent",
				"amber-subtle":
					"[data-theme-preset='vercel']:!bg-[var(--geist-amber-1)] [data-theme-preset='vercel']:!text-[var(--geist-gray-9)] [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Red
				red: "[data-theme-preset='vercel']:!bg-[var(--geist-red-5)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				"red-subtle":
					"[data-theme-preset='vercel']:!bg-[var(--geist-red-1)] [data-theme-preset='vercel']:!text-[var(--geist-gray-9)] [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Pink
				pink: "[data-theme-preset='vercel']:!bg-[var(--geist-pink-5)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				"pink-subtle":
					"[data-theme-preset='vercel']:!bg-[var(--geist-pink-1)] [data-theme-preset='vercel']:!text-[var(--geist-gray-9)] [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Green
				green:
					"[data-theme-preset='vercel']:!bg-[var(--geist-green-5)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				"green-subtle":
					"[data-theme-preset='vercel']:!bg-[var(--geist-green-1)] [data-theme-preset='vercel']:!text-[var(--geist-gray-9)] [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Teal
				teal: "[data-theme-preset='vercel']:!bg-[var(--geist-teal-5)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				"teal-subtle":
					"[data-theme-preset='vercel']:!bg-[var(--geist-teal-1)] [data-theme-preset='vercel']:!text-[var(--geist-gray-9)] [data-theme-preset='vercel']:!border-transparent",
				// Geist variant - Inverted
				inverted:
					"[data-theme-preset='vercel']:!bg-[var(--geist-gray-10)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Trial
				trial:
					"[data-theme-preset='vercel']:!bg-[var(--geist-green-5)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
				// Geist variants - Turbo
				turbo:
					"[data-theme-preset='vercel']:!bg-[var(--geist-purple-5)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:!border-transparent",
			},
			size: {
				xs: "text-[10px] px-1 py-0 [&>svg]:size-2.5",
				sm: "text-xs px-1.5 py-0.5 [&>svg]:size-3",
				md: "text-sm px-2 py-1 [&>svg]:size-3.5",
				lg: "text-base px-2.5 py-1.5 [&>svg]:size-4",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "sm",
		},
	},
);

interface BadgeProps
	extends React.ComponentProps<"span">,
		VariantProps<typeof badgeVariants> {
	asChild?: boolean;
	icon?: React.ReactNode;
}

function Badge({
	className,
	variant,
	size,
	asChild = false,
	icon,
	children,
	...props
}: BadgeProps) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		>
			{icon}
			{children}
		</Comp>
	);
}

export { Badge, badgeVariants };
export type { BadgeProps };
