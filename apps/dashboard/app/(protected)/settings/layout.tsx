import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SettingsLayout } from "./components/settings-layout";

export const metadata: Metadata = {
	title: "Podešavanja",
	description: "Upravljajte podešavanjima naloga i organizacije.",
};

export default function SettingsModuleLayout({
	children,
}: {
	children: ReactNode;
}) {
	return <SettingsLayout>{children}</SettingsLayout>;
}
