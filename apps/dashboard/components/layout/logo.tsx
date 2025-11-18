"use client";

import Image from "next/image";
import { useCompanySettings } from "@/app/(protected)/settings/company/use-company-settings";

export default function Logo() {
	const { company } = useCompanySettings();
	const src = company?.logoUrl ?? "/logo.png";
	const alt = company?.name ?? "Company logo";

	return (
		<Image
			src={src}
			width={30}
			height={30}
			className="me-1 rounded-[5px] transition-all group-data-collapsible:size-7 group-data-[collapsible=icon]:size-8"
			alt={alt}
			unoptimized
		/>
	);
}
