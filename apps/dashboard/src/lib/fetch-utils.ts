/**
 * Ensures the fetch response is successful, otherwise throws an error
 */
export async function ensureResponse(response: Response): Promise<Response> {
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