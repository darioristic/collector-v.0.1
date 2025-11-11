/**
 * Get the full API URL for a given endpoint
 */
export function getApiUrl(endpoint: string): string {
  const defaultBaseUrl = "http://localhost:4000/api";
  const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? defaultBaseUrl).trim();
  const baseWithoutTrailingSlash =
    rawBaseUrl.endsWith("/") && rawBaseUrl.length > 1
      ? rawBaseUrl.slice(0, -1)
      : rawBaseUrl;
  const baseUrl = baseWithoutTrailingSlash.toLowerCase().endsWith("/api")
    ? baseWithoutTrailingSlash
    : `${baseWithoutTrailingSlash}/api`;

  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  // Remove /api prefix if present in endpoint (to avoid duplication)
  const finalEndpoint = cleanEndpoint.startsWith("api/") ? cleanEndpoint.slice(4) : cleanEndpoint;
  const fullUrl = `${baseUrl}/${finalEndpoint}`;

  console.log("[getApiUrl]", { endpoint, rawBaseUrl, baseUrl, fullUrl });

  return fullUrl;
}

/**
 * Ensures the fetch response is successful, otherwise throws an error
 */
export async function ensureResponse(request: Promise<Response>): Promise<Response> {
  let response: Response;

  try {
    response = await request;
  } catch (error) {
    const connectionErrorMessage =
      "Ne mogu da uspostavim vezu sa backend API-jem. Proveri da li je server pokrenut i da li je promenljiva NEXT_PUBLIC_API_URL ispravno podešena.";

    if (error instanceof TypeError) {
      throw new Error(connectionErrorMessage);
    }

    if (error instanceof Error) {
      throw new Error(error.message || connectionErrorMessage);
    }

    throw new Error(connectionErrorMessage);
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If we can't parse the error as JSON, use the default message
    }

    throw new Error(errorMessage);
  }

  return response;
}