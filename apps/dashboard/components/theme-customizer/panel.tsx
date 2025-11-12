"use client";

import { Settings } from "lucide-react";
import {
	ColorModeSelector,
	ContentLayoutSelector,
	PresetSelector,
	ResetThemeButton,
	SidebarModeSelector,
	ThemeRadiusSelector,
	ThemeScaleSelector,
} from "@/components/theme-customizer/index";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

export function ThemeCustomizerPanel() {
	const isMobile = useIsMobile();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="icon" variant="ghost">
					<Settings className="animate-tada" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="me-4 w-72 p-4 shadow-xl lg:me-0"
				align={isMobile ? "center" : "end"}
			>
				<div className="grid space-y-4">
					<PresetSelector />
					<ThemeScaleSelector />
					<ThemeRadiusSelector />
					<ColorModeSelector />
					<ContentLayoutSelector />
					<SidebarModeSelector />
				</div>
				<ResetThemeButton />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
