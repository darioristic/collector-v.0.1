"use client";

import type { Quote } from "@crm/types";
import { FileEdit, Download, Copy, Send, X, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	useCreateQuote,
	useDeleteQuote,
	useUpdateQuote,
} from "@/src/hooks/useQuotes";

type QuoteActionsProps = {
	quote: Quote;
	onView?: (quoteId: number) => void;
	onEdit?: (quote: Quote) => void;
	onDelete?: (quoteId: number) => void;
};

const actionsByStatus: Record<string, string[]> = {
	draft: ["Edit", "Send", "Delete"],
	sent: ["View", "Resend", "Withdraw"],
	accepted: ["View", "Download PDF"],
	rejected: ["View", "Duplicate"],
};

export function QuoteActions({
	quote,
	onView,
	onEdit,
	onDelete,
}: QuoteActionsProps) {
	const { toast } = useToast();
	const updateQuote = useUpdateQuote();
	const createQuote = useCreateQuote();
	const deleteQuote = useDeleteQuote();

	const actions = actionsByStatus[quote.status] || ["View"];

	const handleAction = async (action: string) => {
		switch (action) {
			case "Edit":
				if (onEdit) {
					onEdit(quote);
				} else {
					toast({
						title: "Edit not available",
						description: "Edit handler is not configured.",
					});
				}
				break;

			case "Send":
				try {
					await updateQuote.mutateAsync({
						id: quote.id,
						input: { status: "sent" },
					});
					toast({
						title: "Quote sent",
						description: "The quote has been sent successfully.",
					});
				} catch (error) {
					toast({
						variant: "destructive",
						title: "Failed to send quote",
						description:
							error instanceof Error
								? error.message
								: "Unable to send the quote.",
					});
				}
				break;

			case "Delete":
				if (
					confirm("Are you sure you want to delete this quote?")
				) {
					try {
						await deleteQuote.mutateAsync(quote.id);
						// onDelete callback se poziva za dodatno zatvaranje drawer-a ili slično
						if (onDelete) {
							onDelete(quote.id);
						}
					} catch (error) {
						// Error handling je već u useDeleteQuote hook-u
						// Ne treba dodatni toast jer hook već prikazuje grešku
					}
				}
				break;

			case "View":
				if (onView) {
					onView(quote.id);
				}
				break;

			case "Resend":
				try {
					await updateQuote.mutateAsync({
						id: quote.id,
						input: { status: "sent" },
					});
					toast({
						title: "Quote resent",
						description: "The quote has been resent successfully.",
					});
				} catch (error) {
					toast({
						variant: "destructive",
						title: "Failed to resend quote",
						description:
							error instanceof Error
								? error.message
								: "Unable to resend the quote.",
					});
				}
				break;

			case "Withdraw":
				try {
					await updateQuote.mutateAsync({
						id: quote.id,
						input: { status: "draft" },
					});
					toast({
						title: "Quote withdrawn",
						description:
							"The quote has been withdrawn and set to draft.",
					});
				} catch (error) {
					toast({
						variant: "destructive",
						title: "Failed to withdraw quote",
						description:
							error instanceof Error
								? error.message
								: "Unable to withdraw the quote.",
					});
				}
				break;

			case "Download PDF":
				toast({
					title: "PDF download",
					description: "PDF download feature coming soon.",
				});
				break;

			case "Duplicate":
				try {
					const {
						companyId,
						contactId,
						issueDate,
						expiryDate,
						currency,
						notes,
						items,
					} = quote;

					await createQuote.mutateAsync({
						quoteNumber: "", // Backend će generisati novi
						companyId: companyId || undefined,
						contactId: contactId || undefined,
						issueDate,
						expiryDate: expiryDate || undefined,
						currency,
						notes: notes || undefined,
						items:
							items?.map((item) => ({
								productId: item.productId || undefined,
								description: item.description,
								quantity: item.quantity,
								unitPrice: item.unitPrice,
							})) || [],
					});

					toast({
						title: "Quote duplicated",
						description: "A new quote has been created from this one.",
					});
				} catch (error) {
					toast({
						variant: "destructive",
						title: "Failed to duplicate quote",
						description:
							error instanceof Error
								? error.message
								: "Unable to duplicate the quote.",
					});
				}
				break;

			default:
				toast({
					title: "Unknown action",
					description: `Action "${action}" is not implemented.`,
				});
		}
	};

	const getActionIcon = (action: string) => {
		switch (action) {
			case "Edit":
				return <FileEdit className="mr-2 h-4 w-4" />;
			case "Send":
			case "Resend":
				return <Send className="mr-2 h-4 w-4" />;
			case "Delete":
				return <Trash2 className="mr-2 h-4 w-4" />;
			case "View":
				return <Eye className="mr-2 h-4 w-4" />;
			case "Withdraw":
				return <X className="mr-2 h-4 w-4" />;
			case "Download PDF":
				return <Download className="mr-2 h-4 w-4" />;
			case "Duplicate":
				return <Copy className="mr-2 h-4 w-4" />;
			default:
				return null;
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="shadow-lg"
					type="button"
				>
					Actions
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" side="top" className="z-[100]">
				{actions.map((action) => (
					<DropdownMenuItem
						key={action}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleAction(action);
						}}
						className={
							action === "Delete"
								? "text-destructive focus:text-destructive cursor-pointer"
								: "cursor-pointer"
						}
					>
						{getActionIcon(action)}
						{action}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

