"use client";

import { FileManagerProvider } from "./file-manager-provider";
import { FileUploadDialog } from "./file-upload-dialog";
import { RecentActivity } from "./recent-activity";
import { VaultTable } from "./vault-table";

export function FileManagerRoot() {
	return (
		<FileManagerProvider>
			<div className="space-y-8">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
							Vault
						</h1>
						<p className="text-muted-foreground text-sm">
							Access your latest documents and folders in one place.
						</p>
					</div>
					<FileUploadDialog />
				</header>

				<RecentActivity />

				<VaultTable />
			</div>
		</FileManagerProvider>
	);
}
