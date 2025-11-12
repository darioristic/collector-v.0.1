"use client";

import {
	Mic,
	Paperclip,
	PlusCircleIcon,
	SendIcon,
	SmileIcon,
} from "lucide-react";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import { sendMessage } from "@/app/(protected)/apps/chat/api";
import useChatStore from "@/app/(protected)/apps/chat/useChatStore";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export function ChatFooter() {
	const [message, setMessage] = useState("");
	const [isSending, setIsSending] = useState(false);
	const { selectedChat, addMessage } = useChatStore();
	const { toast } = useToast();

	const handleSend = async (e?: FormEvent) => {
		e?.preventDefault();

		if (!selectedChat || !selectedChat.conversationId) {
			toast({
				title: "Greška",
				description: "Nema odabrane konverzacije.",
				variant: "destructive",
			});
			return;
		}

		const trimmedMessage = message.trim();
		if (!trimmedMessage && isSending) {
			return;
		}

		if (!trimmedMessage) {
			return;
		}

		setIsSending(true);

		try {
			const sentMessage = await sendMessage({
				conversationId: selectedChat.conversationId,
				content: trimmedMessage,
				type: "text",
			});

			addMessage(sentMessage);
			setMessage("");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Slanje poruke nije uspelo.";
			toast({
				title: "Greška",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setIsSending(false);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	if (!selectedChat) {
		return null;
	}

	return (
		<div className="lg:px-4">
			<form
				onSubmit={handleSend}
				className="bg-muted relative flex items-center rounded-md border"
			>
				<Input
					type="text"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={isSending}
					className="h-14 border-transparent bg-white pe-32 text-base! shadow-transparent! ring-transparent! lg:pe-56"
					placeholder="Enter message..."
				/>
				<div className="absolute end-4 flex items-center">
					<div className="block lg:hidden">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									className="size-11 rounded-full p-0"
									disabled={isSending}
								>
									<PlusCircleIcon className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem>Emoji</DropdownMenuItem>
								<DropdownMenuItem>Add File</DropdownMenuItem>
								<DropdownMenuItem>Send Voice</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div className="hidden lg:block">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="rounded-full"
										disabled={isSending}
									>
										<SmileIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">Emoji</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="rounded-full"
										disabled={isSending}
									>
										<Paperclip />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">Select File</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="rounded-full"
										disabled={isSending}
									>
										<Mic />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">Send Voice</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<Button
						type="submit"
						variant="outline"
						className="ms-3"
						disabled={isSending || !message.trim()}
					>
						<span className="hidden lg:inline">Send</span>{" "}
						<SendIcon className="inline lg:hidden" />
					</Button>
				</div>
			</form>
		</div>
	);
}
