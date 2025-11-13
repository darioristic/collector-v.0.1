/**
 * Geist Components - Vercel Design System
 * 
 * Wrapper components that provide Geist Design System components
 * compatible with the Vercel theme.
 * 
 * Usage:
 * ```tsx
 * import { Button, Stack, Badge, useToasts } from '@/components/ui/geist';
 * 
 * const toasts = useToasts();
 * 
 * <Stack direction={{ sm: 'column', md: 'row' }} gap={4} align="start" justify="space-between">
 *   <Button size="small">Upload</Button>
 *   <Button onClick={() => toasts.success('Success!')}>Show Toast</Button>
 * </Stack>
 * 
 * <Badge icon={<Shield />} size="lg" variant="blue">
 *   blue
 * </Badge>
 * ```
 */

export { Button } from "./button";
export { Stack } from "./stack";
export { Badge } from "./badge";
export { Note } from "./note";
export { Book } from "./book";
export { useToasts } from "@/hooks/use-toasts";
export type { ButtonProps } from "./button";
export type { StackProps } from "./stack";
export type { BadgeProps } from "./badge";
export type { NoteProps } from "./note";
export type { BookProps } from "./book";

