"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function InvoicePreviewError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Invoice preview error:", error);
	}, [error]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="mb-2 text-2xl font-bold">Error</h1>
				<p className="text-muted-foreground mb-4">
					{error.message || "Failed to load invoice"}
				</p>
				<Button onClick={reset} variant="outline">
					Try again
				</Button>
			</div>
		</div>
	);
}

