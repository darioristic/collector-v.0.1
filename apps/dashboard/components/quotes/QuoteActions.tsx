"use client";

import { motion } from "motion/react";
import { Loader2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";

type QuoteActionsProps = {
	onSaveDraft: () => void;
	onCancel: () => void;
	isSubmitting: boolean;
};

export function QuoteActions({ onSaveDraft, onCancel, isSubmitting }: QuoteActionsProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: 0.4 }}
			className="sticky bottom-6 z-10 flex justify-end border-t bg-background/95 p-4 pt-6 backdrop-blur-sm"
		>
			<ButtonGroup>
				<Button type="button" variant="secondary" onClick={onSaveDraft} disabled={isSubmitting}>
					<Save className="mr-2 h-4 w-4" />
					Save Draft
				</Button>
				<ButtonGroupSeparator />
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating...
						</>
					) : (
						<>
							<Plus className="mr-2 h-4 w-4" />
							Create Quote
						</>
					)}
				</Button>
			</ButtonGroup>
			<Button
				type="button"
				variant="ghost"
				onClick={onCancel}
				disabled={isSubmitting}
				className="ml-3"
			>
				Cancel
			</Button>
		</motion.div>
	);
}

