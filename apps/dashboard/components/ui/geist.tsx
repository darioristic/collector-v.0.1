/**
 * Geist Components - Vercel Design System
 * 
 * Wrapper components that provide Geist Design System components
 * compatible with the Vercel theme.
 * 
 * Usage:
 * ```tsx
 * import { Button, Stack } from '@/components/ui/geist';
 * 
 * <Stack direction={{ sm: 'column', md: 'row' }} gap={4} align="start" justify="space-between">
 *   <Button size="small">Upload</Button>
 *   <Button>Upload</Button>
 *   <Button size="large">Upload</Button>
 * </Stack>
 * ```
 */

export { Button } from "./button";
export { Stack } from "./stack";
export type { ButtonProps } from "./button";
export type { StackProps } from "./stack";

