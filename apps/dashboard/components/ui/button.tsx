import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					"bg-primary !text-white hover:bg-primary/90 dark:!text-white [data-theme-preset='vercel']:!bg-[var(--geist-blue-6)] [data-theme-preset='vercel']:!text-white [data-theme-preset='vercel']:hover:!bg-[var(--geist-blue-7)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):!bg-[var(--geist-dark-primary)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):!text-[var(--geist-dark-primary-foreground)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):hover:!bg-[var(--geist-dark-primary-hover)]",
				destructive:
					"bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 [data-theme-preset='vercel']:!bg-[var(--geist-red-5)] [data-theme-preset='vercel']:hover:!bg-[var(--geist-red-5)]/90",
				outline:
					"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 [data-theme-preset='vercel']:!border-[var(--geist-border-1)] [data-theme-preset='vercel']:hover:!border-[var(--geist-border-2)] [data-theme-preset='vercel']:!bg-[var(--geist-background-1)] [data-theme-preset='vercel']:!text-[var(--geist-text-10)]",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 [data-theme-preset='vercel']:!bg-[var(--geist-background-2)] [data-theme-preset='vercel']:!text-[var(--geist-text-10)]",
				ghost:
					"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 [data-theme-preset='vercel']:hover:!bg-[var(--geist-background-2)] [data-theme-preset='vercel']:!text-[var(--geist-text-10)]",
				link: "text-primary underline-offset-4 hover:underline [data-theme-preset='vercel']:!text-[var(--geist-blue-6)] [data-theme-preset='vercel']:is(.dark,[data-theme-mode='dark']):!text-[var(--geist-dark-primary)]",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3 text-button-14",
				sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-button-14",
				lg: "h-10 rounded-md px-6 has-[>svg]:px-4 text-button-16",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type ButtonBaseSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
type ButtonSizeProp = ButtonBaseSize | "small" | "large";

type ButtonPropsInternal = Omit<React.ComponentProps<"button">, "size"> &
	Omit<VariantProps<typeof buttonVariants>, "size"> & {
		asChild?: boolean;
		size?: ButtonSizeProp;
	};

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: ButtonPropsInternal) {
	const Comp = asChild ? Slot : "button";

	// Handle "small" and "large" sizes (Geist compatibility)
	// Map to existing size variants
	const sizeVariant: ButtonBaseSize =
		size === "small"
			? "sm"
			: size === "large"
				? "lg"
				: (size ?? "default");

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size: sizeVariant, className }))}
			suppressHydrationWarning
			{...props}
		/>
	);
}

export type ButtonProps = ButtonPropsInternal;

export { Button, buttonVariants };
