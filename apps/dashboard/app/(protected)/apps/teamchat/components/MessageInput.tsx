"use client";

import { Paperclip, Send } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
	onSend: (content: string, fileUrl?: string | null) => void;
	onFileUpload?: (file: File) => Promise<string | null>;
	disabled?: boolean;
}

export function MessageInput({
	onSend,
	onFileUpload,
	disabled,
}: MessageInputProps) {
	const [content, setContent] = React.useState("");
	const [isUploading, setIsUploading] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const { toast } = useToast();

	const handleSend = () => {
		if (!content.trim() && !disabled) {
			return;
		}
		onSend(content.trim() || "");
		setContent("");
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !onFileUpload) {
			return;
		}

		if (file.size > 15 * 1024 * 1024) {
			toast({
				title: "File too large",
				description: "File size must be less than 15 MB",
				variant: "destructive",
			});
			return;
		}

		setIsUploading(true);
		try {
			const fileUrl = await onFileUpload(file);
			if (fileUrl) {
				onSend("", fileUrl);
			}
		} catch {
			toast({
				title: "Upload failed",
				description: "Failed to upload file",
				variant: "destructive",
			});
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	return (
		<div className="flex gap-2 border-t p-4">
			<input
				ref={fileInputRef}
				type="file"
				className="hidden"
				onChange={handleFileSelect}
				disabled={disabled || isUploading}
			/>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => fileInputRef.current?.click()}
				disabled={disabled || isUploading || !onFileUpload}
			>
				<Paperclip className="size-4" />
			</Button>
			<Textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						handleSend();
					}
				}}
				placeholder="Type a message..."
				disabled={disabled || isUploading}
				className="min-h-[60px] resize-none"
			/>
			<Button
				onClick={handleSend}
				disabled={disabled || isUploading || (!content.trim() && !isUploading)}
				size="icon"
			>
				<Send className="size-4" />
			</Button>
		</div>
	);
}
