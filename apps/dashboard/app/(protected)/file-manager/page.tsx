import { generateMeta } from "@/lib/utils";

import { FileManagerRoot } from "./components/file-manager-root";

export async function generateMetadata() {
  return generateMeta({
    title: "File Manager Admin Dashboard",
    description:
      "An admin dashboard template for managing files, folders, and monitoring storage status. Perfect for building streamlined file management systems.",
    canonical: "/file-manager"
  });
}

export default function Page() {
  return <FileManagerRoot />;
}
