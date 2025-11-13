import dynamic from "next/dynamic";
import { generateMeta } from "@/lib/utils";

const FileManagerRoot = dynamic(
	() => import("./components/file-manager-root").then((mod) => ({ default: mod.FileManagerRoot })),
);

export async function generateMetadata() {
	return generateMeta({
		title: "File Manager Admin Dashboard",
		description:
			"An admin dashboard template for managing files, folders, and monitoring storage status. Perfect for building streamlined file management systems.",
		canonical: "/file-manager",
	});
}

export default function Page() {
	return <FileManagerRoot />;
}
