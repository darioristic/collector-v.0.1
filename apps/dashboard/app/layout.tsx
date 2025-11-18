import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import type React from "react";
import { fontVariables } from "@/lib/fonts";
import GoogleAnalyticsInit from "@/lib/ga";
import { cn } from "@/lib/utils";

import "./globals.css";

import { ActiveThemeProvider } from "@/components/active-theme";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import type { ThemeType } from "@/lib/themes";
import { DEFAULT_THEME } from "@/lib/themes";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Use default theme settings - cookies will be read on client side
	// This prevents blocking server-side rendering
	const themeSettings: ThemeType = {
		...DEFAULT_THEME,
	};

	const bodyAttributes = Object.fromEntries(
		Object.entries(themeSettings)
			.filter(([_, value]) => value)
			.map(([key, value]) => [
				`data-theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
				value,
			]),
	);

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				suppressHydrationWarning
				className={cn("bg-background group/layout font-sans", fontVariables)}
				{...bodyAttributes}
			>
				<QueryProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
						enableSystem
						disableTransitionOnChange
					>
						<ActiveThemeProvider initialTheme={themeSettings}>
							{children}
							<div suppressHydrationWarning>
								<Toaster position="top-center" richColors />
							</div>
							<NextTopLoader
								color="var(--primary)"
								showSpinner={false}
								height={2}
								shadow-sm="none"
							/>
							{process.env.NODE_ENV === "production" ? (
								<GoogleAnalyticsInit />
							) : null}
						</ActiveThemeProvider>
					</ThemeProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
