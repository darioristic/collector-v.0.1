"use client";

export function SettingsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-6 lg:flex-row">
			<main className="flex-1">{children}</main>
		</div>
	);
}
