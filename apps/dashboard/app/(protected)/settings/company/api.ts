import type {
	CompanyResponse,
	CompanyUpsertPayload,
} from "@/lib/validations/settings/company";

const DEFAULT_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json",
} as const;

const handleResponse = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		let message = "Došlo je do greške.";
		try {
			const contentType = response.headers.get("content-type");
			if (contentType?.includes("application/json")) {
				const body = (await response.json()) as { error?: string };
				if (body?.error) {
					message = body.error;
				}
			} else {
				const text = await response.text();
				if (text) {
					message = text;
				}
			}
		} catch (error) {
			console.error("Failed to parse error response:", error);
		}
		const error = new Error(message);
		(error as Error & { status?: number }).status = response.status;
		throw error;
	}

	const contentType = response.headers.get("content-type");
	if (!contentType?.includes("application/json")) {
		throw new Error("Očekivani JSON odgovor nije primljen.");
	}

	return (await response.json()) as T;
};

export const fetchCompany = async (): Promise<CompanyResponse> => {
	try {
		const response = await fetch("/api/company", {
			method: "GET",
			headers: DEFAULT_HEADERS,
			cache: "no-store",
			credentials: "include",
		});

		if (!response.ok) {
			const status = response.status;
			const statusText = response.statusText;
			const url = response.url;

			let errorData: {
				error?: string;
				details?: string | unknown;
			} = {};
			let responseText = "";

			try {
				responseText = await response.text();
				if (responseText?.trim()) {
					try {
						errorData = JSON.parse(responseText) as typeof errorData;
					} catch {
						errorData = { error: responseText };
					}
				}
			} catch {
				// Silently handle read errors - we'll use fallback error message
			}

			const hasErrorData = Object.keys(errorData).length > 0;
			let errorMessage = errorData.error || `HTTP ${status}: ${statusText}`;

			if (errorData.details) {
				if (typeof errorData.details === "string") {
					errorMessage = `${errorMessage} - ${errorData.details}`;
				} else if (Array.isArray(errorData.details)) {
					const detailsStr = errorData.details
						.map((d: unknown) => {
							if (typeof d === "object" && d !== null && "message" in d) {
								return String(d.message);
							}
							return String(d);
						})
						.join(", ");
					errorMessage = `${errorMessage} - ${detailsStr}`;
				} else if (typeof errorData.details === "object") {
					try {
						errorMessage = `${errorMessage} - ${JSON.stringify(errorData.details)}`;
					} catch {
						errorMessage = `${errorMessage} - ${String(errorData.details)}`;
					}
				} else {
					errorMessage = `${errorMessage} - ${String(errorData.details)}`;
				}
			}

			if (!hasErrorData) {
				errorMessage = `${errorMessage} - Prazan odgovor od servera`;
			}

			const isDevelopment = process.env.NODE_ENV === "development";

			if (isDevelopment) {
				console.error("[fetchCompany] API error response", {
					status,
					statusText,
					url,
					hasErrorData,
					errorData: hasErrorData ? errorData : null,
					responseText: responseText ? responseText.substring(0, 200) : null,
				});
			}

			const error = new Error(errorMessage);
			(error as Error & { status?: number }).status = status;
			throw error;
		}

		const payload = await handleResponse<CompanyResponse>(response);
		return payload;
	} catch (error) {
		if (error instanceof Error && "status" in error) {
			throw error;
		}
		const isDevelopment = process.env.NODE_ENV === "development";
		if (isDevelopment) {
			console.error("[fetchCompany] Unexpected error", {
				error,
				errorType: typeof error,
				errorName: error instanceof Error ? error.name : undefined,
				errorMessage: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
			});
		}
		throw error;
	}
};

export const updateCompany = async (
	values: CompanyUpsertPayload,
): Promise<CompanyResponse> => {
	const response = await fetch("/api/company", {
		method: "PATCH",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify(values),
		credentials: "include",
	});

	const payload = await handleResponse<{
		success: boolean;
		data: CompanyResponse;
	}>(response);
	return payload.data;
};
