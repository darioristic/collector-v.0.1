"use client";

import { useThemeConfig } from "@/components/active-theme";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DEFAULT_THEME, THEMES, type ThemeType } from "@/lib/themes";

export function PresetSelector() {
	const { theme, setTheme } = useThemeConfig();

	const handlePreset = (value: ThemeType["preset"]) => {
		setTheme({ ...theme, ...DEFAULT_THEME, preset: value });
	};

	return (
		<div className="flex flex-col gap-4">
			<Label>Theme preset:</Label>
			<Select
				value={theme.preset}
				onValueChange={(value) => handlePreset(value as ThemeType["preset"])}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select a theme" />
				</SelectTrigger>
				<SelectContent align="end">
					{THEMES.map((theme) => (
						<SelectItem key={theme.name} value={theme.value}>
							<div className="flex shrink-0 gap-1">
								{theme.colors.map((color, key) => (
									<span
										key={key}
										className="size-2 rounded-full"
										style={{ backgroundColor: color }}
									></span>
								))}
							</div>
							{theme.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
