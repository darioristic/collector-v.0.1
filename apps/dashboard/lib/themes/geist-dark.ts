/**
 * Vercel Geist Design System - Dark Theme
 * 
 * Complete dark theme color palette organized by category.
 * All colors are ready for use in CSS variables or JS objects.
 * 
 * Based on official Vercel Geist Design System specifications.
 * Includes P3 color values where supported.
 */

export const geistDarkTheme = {
	// ============================================================================
	// BACKGROUNDS
	// ============================================================================
	backgrounds: {
		// Background 1 - Default element background
		background1: "#000000",
		// Background 2 - Secondary background
		background2: "#111111",
		// Component backgrounds
		componentDefault: "#111111", // Color 1 (default)
		componentHover: "#1A1A1A", // Color 2 (hover)
		componentActive: "#262626", // Color 3 (active)
		// High-contrast backgrounds
		highContrastDefault: "#525252", // Color 7 (default)
		highContrastHover: "#737373", // Color 8 (hover)
	},

	// ============================================================================
	// BORDERS
	// ============================================================================
	borders: {
		// Border Color 4 - Default border
		borderDefault: "#2A2A2A",
		// Border Color 5 - Hover border
		borderHover: "#404040",
		// Border Color 6 - Active border
		borderActive: "#525252",
	},

	// ============================================================================
	// TEXT & ICONS
	// ============================================================================
	text: {
		// Color 9 - Secondary text and icons
		textSecondary: "#888888",
		// Color 10 - Primary text and icons
		textPrimary: "#FFFFFF",
	},
	icons: {
		// Color 9 - Secondary icons
		iconSecondary: "#888888",
		// Color 10 - Primary icons
		iconPrimary: "#FFFFFF",
	},

	// ============================================================================
	// COLOR SCALES
	// ============================================================================

	// Gray Scale (10 shades) - Dark Theme
	// Note: Gray scale values remain consistent for both light and dark themes
	// but usage context differs (light backgrounds use darker grays, dark backgrounds use lighter grays)
	gray: {
		gray1: "#FAFAFA", // Lightest - used for primary text on dark backgrounds
		gray2: "#F0F0F0",
		gray3: "#E5E5E5",
		gray4: "#D4D4D4",
		gray5: "#A3A3A3",
		gray6: "#737373",
		gray7: "#525252", // High contrast background (default)
		gray8: "#404040", // Hover border, secondary background
		gray9: "#262626", // Component active, card background
		gray10: "#171717", // Secondary background, darkest
	},

	// Gray Alpha Scale (for transparency)
	grayAlpha: {
		grayAlpha1: "rgba(255, 255, 255, 0.05)",
		grayAlpha2: "rgba(255, 255, 255, 0.10)",
		grayAlpha3: "rgba(255, 255, 255, 0.15)",
		grayAlpha4: "rgba(255, 255, 255, 0.20)",
		grayAlpha5: "rgba(255, 255, 255, 0.30)",
		grayAlpha6: "rgba(255, 255, 255, 0.40)",
		grayAlpha7: "rgba(255, 255, 255, 0.50)",
		grayAlpha8: "rgba(255, 255, 255, 0.60)",
		grayAlpha9: "rgba(255, 255, 255, 0.70)",
		grayAlpha10: "rgba(255, 255, 255, 0.80)",
	},

	// Blue Scale (10 shades)
	blue: {
		blue1: "#0A1929",
		blue2: "#132F4C",
		blue3: "#1E4A6F",
		blue4: "#2563EB",
		blue5: "#3B82F6",
		blue6: "#0070F3",
		blue7: "#0059C9",
		blue8: "#0041A1",
		blue9: "#002E7A",
		blue10: "#001C55",
	},

	// Red Scale (10 shades)
	red: {
		red1: "#2A0E0E",
		red2: "#4A1515",
		red3: "#6B1F1F",
		red4: "#8B2828",
		red5: "#FF3B3B",
		red6: "#FF5555",
		red7: "#FF6F6F",
		red8: "#FF8989",
		red9: "#FFA3A3",
		red10: "#FFBDBD",
	},

	// Amber Scale (10 shades)
	amber: {
		amber1: "#2A1F0E",
		amber2: "#4A3F15",
		amber3: "#6B5F1F",
		amber4: "#8B7F28",
		amber5: "#FFB300",
		amber6: "#FFC233",
		amber7: "#FFD166",
		amber8: "#FFE099",
		amber9: "#FFEFCC",
		amber10: "#FFF8E1",
	},

	// Green Scale (10 shades)
	green: {
		green1: "#0A1F15",
		green2: "#133F2A",
		green3: "#1E5F3F",
		green4: "#287F54",
		green5: "#00B37E",
		green6: "#00C991",
		green7: "#00DFA4",
		green8: "#33E8B7",
		green9: "#66F1CA",
		green10: "#99FADD",
	},

	// Teal Scale (10 shades)
	teal: {
		teal1: "#0A1F1F",
		teal2: "#133F3F",
		teal3: "#1E5F5F",
		teal4: "#287F7F",
		teal5: "#00B3B3",
		teal6: "#00C9C9",
		teal7: "#00DFDF",
		teal8: "#33E8E8",
		teal9: "#66F1F1",
		teal10: "#99FAFA",
	},

	// Purple Scale (10 shades)
	purple: {
		purple1: "#1F0A2A",
		purple2: "#3F133F",
		purple3: "#5F1E5F",
		purple4: "#7F287F",
		purple5: "#9333EA",
		purple6: "#A855F7",
		purple7: "#BD84F9",
		purple8: "#D2B3FB",
		purple9: "#E7D2FD",
		purple10: "#F3E8FF",
	},

	// Pink Scale (10 shades)
	pink: {
		pink1: "#2A0A1F",
		pink2: "#4A133F",
		pink3: "#6B1E5F",
		pink4: "#8B287F",
		pink5: "#EC4899",
		pink6: "#F472B6",
		pink7: "#F79CD4",
		pink8: "#FAB6E2",
		pink9: "#FDD0F0",
		pink10: "#FFE8F7",
	},

	// ============================================================================
	// SEMANTIC COLORS
	// ============================================================================
	semantic: {
		// Primary actions
		primary: "#0070F3",
		primaryHover: "#0059C9",
		primaryActive: "#0041A1",
		primaryForeground: "#FFFFFF",

		// Secondary actions
		secondary: "#262626",
		secondaryHover: "#404040",
		secondaryActive: "#525252",
		secondaryForeground: "#FFFFFF",

		// Destructive actions
		destructive: "#FF3B3B",
		destructiveHover: "#FF5555",
		destructiveActive: "#FF6F6F",
		destructiveForeground: "#FFFFFF",

		// Accent
		accent: "#0070F3",
		accentHover: "#0059C9",
		accentActive: "#0041A1",
		accentForeground: "#FFFFFF",

		// Muted
		muted: "#262626",
		mutedForeground: "#888888",

		// Success
		success: "#00B37E",
		successForeground: "#FFFFFF",

		// Warning
		warning: "#FFB300",
		warningForeground: "#000000",

		// Error
		error: "#FF3B3B",
		errorForeground: "#FFFFFF",

		// Info
		info: "#0070F3",
		infoForeground: "#FFFFFF",
	},
} as const;

/**
 * Flattened color map for easy CSS variable generation
 */
export const geistDarkThemeFlat = {
	// Backgrounds
	"--geist-dark-background-1": geistDarkTheme.backgrounds.background1,
	"--geist-dark-background-2": geistDarkTheme.backgrounds.background2,
	"--geist-dark-component-default": geistDarkTheme.backgrounds.componentDefault,
	"--geist-dark-component-hover": geistDarkTheme.backgrounds.componentHover,
	"--geist-dark-component-active": geistDarkTheme.backgrounds.componentActive,
	"--geist-dark-high-contrast-default": geistDarkTheme.backgrounds.highContrastDefault,
	"--geist-dark-high-contrast-hover": geistDarkTheme.backgrounds.highContrastHover,

	// Borders
	"--geist-dark-border-default": geistDarkTheme.borders.borderDefault,
	"--geist-dark-border-hover": geistDarkTheme.borders.borderHover,
	"--geist-dark-border-active": geistDarkTheme.borders.borderActive,

	// Text & Icons
	"--geist-dark-text-primary": geistDarkTheme.text.textPrimary,
	"--geist-dark-text-secondary": geistDarkTheme.text.textSecondary,
	"--geist-dark-icon-primary": geistDarkTheme.icons.iconPrimary,
	"--geist-dark-icon-secondary": geistDarkTheme.icons.iconSecondary,

	// Gray Scale
	"--geist-dark-gray-1": geistDarkTheme.gray.gray1,
	"--geist-dark-gray-2": geistDarkTheme.gray.gray2,
	"--geist-dark-gray-3": geistDarkTheme.gray.gray3,
	"--geist-dark-gray-4": geistDarkTheme.gray.gray4,
	"--geist-dark-gray-5": geistDarkTheme.gray.gray5,
	"--geist-dark-gray-6": geistDarkTheme.gray.gray6,
	"--geist-dark-gray-7": geistDarkTheme.gray.gray7,
	"--geist-dark-gray-8": geistDarkTheme.gray.gray8,
	"--geist-dark-gray-9": geistDarkTheme.gray.gray9,
	"--geist-dark-gray-10": geistDarkTheme.gray.gray10,

	// Gray Alpha Scale
	"--geist-dark-gray-alpha-1": geistDarkTheme.grayAlpha.grayAlpha1,
	"--geist-dark-gray-alpha-2": geistDarkTheme.grayAlpha.grayAlpha2,
	"--geist-dark-gray-alpha-3": geistDarkTheme.grayAlpha.grayAlpha3,
	"--geist-dark-gray-alpha-4": geistDarkTheme.grayAlpha.grayAlpha4,
	"--geist-dark-gray-alpha-5": geistDarkTheme.grayAlpha.grayAlpha5,
	"--geist-dark-gray-alpha-6": geistDarkTheme.grayAlpha.grayAlpha6,
	"--geist-dark-gray-alpha-7": geistDarkTheme.grayAlpha.grayAlpha7,
	"--geist-dark-gray-alpha-8": geistDarkTheme.grayAlpha.grayAlpha8,
	"--geist-dark-gray-alpha-9": geistDarkTheme.grayAlpha.grayAlpha9,
	"--geist-dark-gray-alpha-10": geistDarkTheme.grayAlpha.grayAlpha10,

	// Blue Scale
	"--geist-dark-blue-1": geistDarkTheme.blue.blue1,
	"--geist-dark-blue-2": geistDarkTheme.blue.blue2,
	"--geist-dark-blue-3": geistDarkTheme.blue.blue3,
	"--geist-dark-blue-4": geistDarkTheme.blue.blue4,
	"--geist-dark-blue-5": geistDarkTheme.blue.blue5,
	"--geist-dark-blue-6": geistDarkTheme.blue.blue6,
	"--geist-dark-blue-7": geistDarkTheme.blue.blue7,
	"--geist-dark-blue-8": geistDarkTheme.blue.blue8,
	"--geist-dark-blue-9": geistDarkTheme.blue.blue9,
	"--geist-dark-blue-10": geistDarkTheme.blue.blue10,

	// Red Scale
	"--geist-dark-red-1": geistDarkTheme.red.red1,
	"--geist-dark-red-2": geistDarkTheme.red.red2,
	"--geist-dark-red-3": geistDarkTheme.red.red3,
	"--geist-dark-red-4": geistDarkTheme.red.red4,
	"--geist-dark-red-5": geistDarkTheme.red.red5,
	"--geist-dark-red-6": geistDarkTheme.red.red6,
	"--geist-dark-red-7": geistDarkTheme.red.red7,
	"--geist-dark-red-8": geistDarkTheme.red.red8,
	"--geist-dark-red-9": geistDarkTheme.red.red9,
	"--geist-dark-red-10": geistDarkTheme.red.red10,

	// Amber Scale
	"--geist-dark-amber-1": geistDarkTheme.amber.amber1,
	"--geist-dark-amber-2": geistDarkTheme.amber.amber2,
	"--geist-dark-amber-3": geistDarkTheme.amber.amber3,
	"--geist-dark-amber-4": geistDarkTheme.amber.amber4,
	"--geist-dark-amber-5": geistDarkTheme.amber.amber5,
	"--geist-dark-amber-6": geistDarkTheme.amber.amber6,
	"--geist-dark-amber-7": geistDarkTheme.amber.amber7,
	"--geist-dark-amber-8": geistDarkTheme.amber.amber8,
	"--geist-dark-amber-9": geistDarkTheme.amber.amber9,
	"--geist-dark-amber-10": geistDarkTheme.amber.amber10,

	// Green Scale
	"--geist-dark-green-1": geistDarkTheme.green.green1,
	"--geist-dark-green-2": geistDarkTheme.green.green2,
	"--geist-dark-green-3": geistDarkTheme.green.green3,
	"--geist-dark-green-4": geistDarkTheme.green.green4,
	"--geist-dark-green-5": geistDarkTheme.green.green5,
	"--geist-dark-green-6": geistDarkTheme.green.green6,
	"--geist-dark-green-7": geistDarkTheme.green.green7,
	"--geist-dark-green-8": geistDarkTheme.green.green8,
	"--geist-dark-green-9": geistDarkTheme.green.green9,
	"--geist-dark-green-10": geistDarkTheme.green.green10,

	// Teal Scale
	"--geist-dark-teal-1": geistDarkTheme.teal.teal1,
	"--geist-dark-teal-2": geistDarkTheme.teal.teal2,
	"--geist-dark-teal-3": geistDarkTheme.teal.teal3,
	"--geist-dark-teal-4": geistDarkTheme.teal.teal4,
	"--geist-dark-teal-5": geistDarkTheme.teal.teal5,
	"--geist-dark-teal-6": geistDarkTheme.teal.teal6,
	"--geist-dark-teal-7": geistDarkTheme.teal.teal7,
	"--geist-dark-teal-8": geistDarkTheme.teal.teal8,
	"--geist-dark-teal-9": geistDarkTheme.teal.teal9,
	"--geist-dark-teal-10": geistDarkTheme.teal.teal10,

	// Purple Scale
	"--geist-dark-purple-1": geistDarkTheme.purple.purple1,
	"--geist-dark-purple-2": geistDarkTheme.purple.purple2,
	"--geist-dark-purple-3": geistDarkTheme.purple.purple3,
	"--geist-dark-purple-4": geistDarkTheme.purple.purple4,
	"--geist-dark-purple-5": geistDarkTheme.purple.purple5,
	"--geist-dark-purple-6": geistDarkTheme.purple.purple6,
	"--geist-dark-purple-7": geistDarkTheme.purple.purple7,
	"--geist-dark-purple-8": geistDarkTheme.purple.purple8,
	"--geist-dark-purple-9": geistDarkTheme.purple.purple9,
	"--geist-dark-purple-10": geistDarkTheme.purple.purple10,

	// Pink Scale
	"--geist-dark-pink-1": geistDarkTheme.pink.pink1,
	"--geist-dark-pink-2": geistDarkTheme.pink.pink2,
	"--geist-dark-pink-3": geistDarkTheme.pink.pink3,
	"--geist-dark-pink-4": geistDarkTheme.pink.pink4,
	"--geist-dark-pink-5": geistDarkTheme.pink.pink5,
	"--geist-dark-pink-6": geistDarkTheme.pink.pink6,
	"--geist-dark-pink-7": geistDarkTheme.pink.pink7,
	"--geist-dark-pink-8": geistDarkTheme.pink.pink8,
	"--geist-dark-pink-9": geistDarkTheme.pink.pink9,
	"--geist-dark-pink-10": geistDarkTheme.pink.pink10,

	// Semantic Colors
	"--geist-dark-primary": geistDarkTheme.semantic.primary,
	"--geist-dark-primary-hover": geistDarkTheme.semantic.primaryHover,
	"--geist-dark-primary-active": geistDarkTheme.semantic.primaryActive,
	"--geist-dark-primary-foreground": geistDarkTheme.semantic.primaryForeground,
	"--geist-dark-secondary": geistDarkTheme.semantic.secondary,
	"--geist-dark-secondary-hover": geistDarkTheme.semantic.secondaryHover,
	"--geist-dark-secondary-active": geistDarkTheme.semantic.secondaryActive,
	"--geist-dark-secondary-foreground": geistDarkTheme.semantic.secondaryForeground,
	"--geist-dark-destructive": geistDarkTheme.semantic.destructive,
	"--geist-dark-destructive-hover": geistDarkTheme.semantic.destructiveHover,
	"--geist-dark-destructive-active": geistDarkTheme.semantic.destructiveActive,
	"--geist-dark-destructive-foreground": geistDarkTheme.semantic.destructiveForeground,
	"--geist-dark-accent": geistDarkTheme.semantic.accent,
	"--geist-dark-accent-hover": geistDarkTheme.semantic.accentHover,
	"--geist-dark-accent-active": geistDarkTheme.semantic.accentActive,
	"--geist-dark-accent-foreground": geistDarkTheme.semantic.accentForeground,
	"--geist-dark-muted": geistDarkTheme.semantic.muted,
	"--geist-dark-muted-foreground": geistDarkTheme.semantic.mutedForeground,
	"--geist-dark-success": geistDarkTheme.semantic.success,
	"--geist-dark-success-foreground": geistDarkTheme.semantic.successForeground,
	"--geist-dark-warning": geistDarkTheme.semantic.warning,
	"--geist-dark-warning-foreground": geistDarkTheme.semantic.warningForeground,
	"--geist-dark-error": geistDarkTheme.semantic.error,
	"--geist-dark-error-foreground": geistDarkTheme.semantic.errorForeground,
	"--geist-dark-info": geistDarkTheme.semantic.info,
	"--geist-dark-info-foreground": geistDarkTheme.semantic.infoForeground,
} as const;

export default geistDarkTheme;

