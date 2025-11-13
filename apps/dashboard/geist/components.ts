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

export { Button } from "@/components/ui/geist";
export { Stack } from "@/components/ui/geist";
export { Badge } from "@/components/ui/geist";
export { Note } from "@/components/ui/geist";
export { Book } from "@/components/ui/geist";
export { useToasts } from "@/components/ui/geist";
export type { ButtonProps } from "@/components/ui/geist";
export type { StackProps } from "@/components/ui/geist";
export type { BadgeProps } from "@/components/ui/geist";
export type { NoteProps } from "@/components/ui/geist";
export type { BookProps } from "@/components/ui/geist";

