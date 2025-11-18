import * as LucideIcons from "lucide-react";

// Re-export all lucide icons
export const Icons = {
  ...LucideIcons,
  // Alias for MoreVertical (MoreVertical is already in lucide-react)
  MoreVertical: LucideIcons.MoreVertical,
  // Add any custom icon mappings or overrides here if needed
};

export type Icon = LucideIcons.LucideIcon;
