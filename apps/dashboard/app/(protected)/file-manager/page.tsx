import { generateMeta } from "@/lib/utils";

import { FileUploadDialog, RecentActivity, VaultTable } from "@/app/(protected)/file-manager/components";

export async function generateMetadata() {
  return generateMeta({
    title: "File Manager Admin Dashboard",
    description:
      "An admin dashboard template for managing files, folders, and monitoring storage status. Perfect for building streamlined file management systems.",
    canonical: "/file-manager"
  });
}

export default function Page() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Vault</h1>
          <p className="text-muted-foreground text-sm">
            Pristupi najnovijim dokumentima i folderima na jednom mestu.
          </p>
        </div>
        <FileUploadDialog />
      </header>

      <RecentActivity />

      <VaultTable />
    </div>
  );
}
