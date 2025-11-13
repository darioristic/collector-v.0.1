"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// Wrap Dialog to suppress hydration warnings for Radix UI generated IDs
const Dialog = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>
>((props, ref) => {
	return <DialogPrimitive.Root {...props} />;
});
Dialog.displayName = "Dialog";

const DialogTrigger = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>((props, ref) => {
	return <DialogPrimitive.Trigger {...props} ref={ref} suppressHydrationWarning />;
});
DialogTrigger.displayName = DialogPrimitive.Trigger.displayName;

const DialogClose = DialogPrimitive.Close;

const DialogPortal = ({
	children,
	...props
}: DialogPrimitive.DialogPortalProps) => (
	<DialogPrimitive.Portal {...props}>{children}</DialogPrimitive.Portal>
);
DialogPortal.displayName = DialogPrimitive.Portal.displayName;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		ref={ref}
		data-slot="dialog-overlay"
		className={cn(
			"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
			className,
		)}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		data-slot="dialog-title"
		className={cn("text-lg leading-none font-semibold", className)}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		data-slot="dialog-description"
		className={cn("text-muted-foreground text-sm", className)}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const dialogTitleIdentifier =
	DialogTitle.displayName ||
	(DialogTitle as unknown as { name?: string }).name ||
	"DialogTitle";

const dialogDescriptionIdentifier =
	DialogDescription.displayName ||
	(DialogDescription as unknown as { name?: string }).name ||
	"DialogDescription";

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
	const descriptionId = React.useId();

	const hasTitle = React.useMemo(() => {
		const containsTitle = (nodes: React.ReactNode): boolean =>
			React.Children.toArray(nodes).some((child) => {
				if (!React.isValidElement(child)) {
					return false;
				}

				const element = child as React.ReactElement<{
					children?: React.ReactNode;
				}>;
				const childType = element.type as {
					displayName?: string;
					name?: string;
				};

				if (
					element.type === DialogTitle ||
					childType?.displayName === dialogTitleIdentifier ||
					childType?.name === dialogTitleIdentifier
				) {
					return true;
				}

				if (element.props?.children) {
					return containsTitle(element.props.children);
				}

				return false;
			});

		return containsTitle(children);
	}, [children]);

	const hasDescription = React.useMemo(() => {
		const containsDescription = (nodes: React.ReactNode): boolean =>
			React.Children.toArray(nodes).some((child) => {
				if (!React.isValidElement(child)) {
					return false;
				}

				const element = child as React.ReactElement<{
					children?: React.ReactNode;
				}>;
				const childType = element.type as {
					displayName?: string;
					name?: string;
				};

				if (
					element.type === DialogDescription ||
					childType?.displayName === dialogDescriptionIdentifier ||
					childType?.name === dialogDescriptionIdentifier
				) {
					return true;
				}

				if (element.props?.children) {
					return containsDescription(element.props.children);
				}

				return false;
			});

		return containsDescription(children);
	}, [children]);

	const hasAriaLabelledBy = Boolean(props["aria-labelledby"]);
	const hasAriaDescribedBy = Boolean(props["aria-describedby"]);
	const needsDescription = !hasDescription && !hasAriaDescribedBy;
	const needsTitle = !hasTitle && !hasAriaLabelledBy;

	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				ref={ref}
				data-slot="dialog-content"
				aria-describedby={needsDescription ? descriptionId : props["aria-describedby"]}
				className={cn(
					"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
					className,
				)}
				suppressHydrationWarning
				{...props}
			>
				{needsTitle ? (
					<VisuallyHidden>
						<DialogPrimitive.Title>Dialog</DialogPrimitive.Title>
					</VisuallyHidden>
				) : null}
				{needsDescription ? (
					<VisuallyHidden>
						<DialogPrimitive.Description id={descriptionId}>
							Dialog description
						</DialogPrimitive.Description>
					</VisuallyHidden>
				) : null}
				{children}
				<DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
					<XIcon />
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		</DialogPortal>
	);
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		data-slot="dialog-header"
		className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
		{...props}
	/>
);

const DialogFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		data-slot="dialog-footer"
		className={cn(
			"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
			className,
		)}
		{...props}
	/>
);

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
