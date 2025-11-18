/**
 * Geist Components - Vercel Design System
 *
 * This file provides the Geist Design System components API
 * compatible with the official Geist package structure.
 *
 * Usage:
 * ```tsx
 * import { Button, Stack, Badge, useToasts } from 'geist/components';
 *
 * const toasts = useToasts();
 *
 * <Button onClick={() => toasts.success('Success!')}>
 *   Show Toast
 * </Button>
 * ```
 */

export type {
	BadgeProps,
	BookProps,
	ButtonProps,
	NoteProps,
	StackProps,
} from "@/components/ui/geist";
export {
	Badge,
	Book,
	Button,
	Note,
	Stack,
	useToasts,
} from "@/components/ui/geist";
