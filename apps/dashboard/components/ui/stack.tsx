import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const stackVariants = cva("", {
	variants: {
		align: {
			start: "items-start",
			center: "items-center",
			end: "items-end",
			stretch: "items-stretch",
		},
		justify: {
			start: "justify-start",
			center: "justify-center",
			end: "justify-end",
			"space-between": "justify-between",
			"space-around": "justify-around",
			"space-evenly": "justify-evenly",
		},
		gap: {
			0: "gap-0",
			1: "gap-1",
			2: "gap-2",
			3: "gap-3",
			4: "gap-4",
			5: "gap-5",
			6: "gap-6",
			8: "gap-8",
			10: "gap-10",
			12: "gap-12",
		},
	},
	defaultVariants: {
		align: "start",
		justify: "start",
		gap: 0,
	},
});

type ResponsiveDirection = {
	sm?: "row" | "column";
	md?: "row" | "column";
	lg?: "row" | "column";
	xl?: "row" | "column";
	"2xl"?: "row" | "column";
};

interface StackComponentProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "dir">,
		VariantProps<typeof stackVariants> {
	direction?: "row" | "column" | ResponsiveDirection;
}

function Stack({
	className,
	direction = "row",
	align = "start",
	justify = "start",
	gap = 0,
	children,
	...props
}: StackComponentProps) {
	// Handle responsive direction
	let directionClasses = "";
	if (typeof direction === "object" && direction !== null) {
		const responsiveClasses: string[] = [];
		// Handle sm breakpoint (mobile-first)
		if (direction.sm) {
			responsiveClasses.push(
				direction.sm === "column" ? "flex-col" : "flex-row",
			);
		}
		// Handle md breakpoint
		if (direction.md) {
			responsiveClasses.push(
				`md:${direction.md === "column" ? "flex-col" : "flex-row"}`,
			);
		}
		// Handle lg breakpoint
		if (direction.lg) {
			responsiveClasses.push(
				`lg:${direction.lg === "column" ? "flex-col" : "flex-row"}`,
			);
		}
		// Handle xl breakpoint
		if (direction.xl) {
			responsiveClasses.push(
				`xl:${direction.xl === "column" ? "flex-col" : "flex-row"}`,
			);
		}
		// Handle 2xl breakpoint
		if (direction["2xl"]) {
			responsiveClasses.push(
				`2xl:${direction["2xl"] === "column" ? "flex-col" : "flex-row"}`,
			);
		}
		directionClasses = responsiveClasses.join(" ");
	} else {
		// Handle simple string direction
		directionClasses = direction === "column" ? "flex-col" : "flex-row";
	}

	return (
		<div
			className={cn(
				"flex",
				directionClasses,
				stackVariants({ align, justify, gap }),
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export type StackProps = React.ComponentProps<typeof Stack>;

export { Stack, stackVariants };
