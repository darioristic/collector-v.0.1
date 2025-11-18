/**
 * Get CDN URL for assets
 * TODO: Configure this based on your CDN setup
 */
export function getCdnUrl(): string {
  // Default to empty string (relative URLs) or configure your CDN URL
  return process.env.NEXT_PUBLIC_CDN_URL || process.env.CDN_URL || "";
}
