import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InvoiceNotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="mb-2 text-2xl font-bold">Invoice not found</h1>
				<p className="text-muted-foreground mb-4">
					The invoice you're looking for doesn't exist or the link has expired.
				</p>
				<Button asChild variant="outline">
					<Link href="/finance">Go back</Link>
				</Button>
			</div>
		</div>
	);
}

