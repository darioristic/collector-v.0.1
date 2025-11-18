/**
 * Get application URL
 * TODO: Configure this based on your app URL setup
 */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  );
}
