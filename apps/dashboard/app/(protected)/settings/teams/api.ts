import type { TeamMemberApi } from "@/lib/validations/settings/team-members";
import {
	type CreateTeamMemberPayload,
	type ListTeamMembersQuery,
	listTeamMembersQuerySchema,
	type TeamMemberStatus,
	type UpdateTeamMemberPayload,
} from "@/lib/validations/settings/team-members";

const DEFAULT_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json",
} as const;

const buildQueryString = (params: ListTeamMembersQuery): string => {
	const searchParams = new URLSearchParams();

	if (params.search) {
		searchParams.set("search", params.search);
	}

	if (params.status) {
		searchParams.set("status", params.status);
	}

	return searchParams.toString();
};

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

export type TeamMember = Omit<TeamMemberApi, "createdAt" | "updatedAt"> & {
	createdAt: Date;
	updatedAt: Date;
	fullName: string;
	userId: string | null;
};

const mapTeamMember = (member: TeamMemberApi): TeamMember => ({
	...member,
	createdAt: new Date(member.createdAt),
	updatedAt: new Date(member.updatedAt),
	fullName: `${member.firstName} ${member.lastName}`.trim(),
});

export const fetchTeamMembers = async (
	query: ListTeamMembersQuery = {},
): Promise<TeamMember[]> => {
	try {
		const parsedQuery = listTeamMembersQuerySchema.parse(query);
		const queryString = buildQueryString(parsedQuery);
		const apiUrl = `/api/settings/team-members${queryString ? `?${queryString}` : ""}`;
		let response: Response;

		try {
			response = await fetch(apiUrl, {
				method: "GET",
				headers: DEFAULT_HEADERS,
				cache: "no-store",
				credentials: "include",
			});
		} catch (fetchError) {
			console.error("[fetchTeamMembers] Fetch failed", {
				url: apiUrl,
				error: fetchError,
				errorType: typeof fetchError,
				errorMessage:
					fetchError instanceof Error ? fetchError.message : String(fetchError),
				errorStack: fetchError instanceof Error ? fetchError.stack : undefined,
			});
			throw new Error(
				`Neuspešan zahtev ka API-ju: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
			);
		}

		const contentType = response.headers.get("content-type");
		const status = response.status;
		const statusText = response.statusText;
		const url = response.url;

		// Read response body only once
		let responseText = "";
		try {
			responseText = await response.text();
		} catch (readError) {
			console.error("[fetchTeamMembers] Failed to read response body", {
				status,
				statusText,
				url,
				error:
					readError instanceof Error ? readError.message : String(readError),
			});
			throw new Error(
				`Neuspešno čitanje odgovora od servera: ${readError instanceof Error ? readError.message : String(readError)}`,
			);
		}

		if (!response.ok) {
			let errorData: {
				error?: string;
				details?: string | unknown;
				warning?: string;
			} = {};

			const trimmedText = responseText?.trim();
			if (trimmedText) {
				try {
					const parsed = JSON.parse(trimmedText);
					if (parsed && typeof parsed === "object") {
						errorData = parsed as typeof errorData;
					} else {
						errorData = { error: trimmedText };
					}
				} catch {
					// If not valid JSON, treat the entire response as error message
					errorData = { error: trimmedText };
				}
			}

			const hasErrorData = Object.keys(errorData).length > 0;
			let errorMessage = errorData.error || `HTTP ${status}: ${statusText}`;

			// Safely process errorData.details
			if (errorData.details !== undefined && errorData.details !== null) {
				try {
					const details = errorData.details;

					if (typeof details === "string") {
						errorMessage = `${errorMessage} - ${details}`;
					} else if (Array.isArray(details)) {
						// Handle array of details
						const detailsStr = details
							.map((d: unknown) => {
								if (d === null || d === undefined) {
									return "null";
								}
								if (typeof d === "object" && "message" in d) {
									return String((d as { message: unknown }).message);
								}
								if (typeof d === "object") {
									try {
										return JSON.stringify(d);
									} catch {
										return String(d);
									}
								}
								return String(d);
							})
							.filter(Boolean)
							.join(", ");
						if (detailsStr) {
							errorMessage = `${errorMessage} - ${detailsStr}`;
						}
					} else if (typeof details === "object") {
						// Handle object details - safely stringify
						try {
							// Use a replacer function to handle circular references and non-serializable values
							const detailsStr = JSON.stringify(
								details,
								(_key, value) => {
									// Skip circular references
									if (typeof value === "object" && value !== null) {
										try {
											JSON.stringify(value);
											return value;
										} catch {
											return "[Circular or non-serializable]";
										}
									}
									return value;
								},
								2,
							);
							if (detailsStr && detailsStr !== "{}") {
								errorMessage = `${errorMessage} - ${detailsStr}`;
							}
						} catch {
							// If JSON.stringify fails, try to extract useful info manually
							try {
								const detailsObj = details as Record<string, unknown>;
								const keys = Object.keys(detailsObj);
								if (keys.length > 0) {
									const detailsStr = keys
										.slice(0, 5) // Limit to first 5 keys to avoid very long messages
										.map((key) => {
											const value = detailsObj[key];
											if (value === null || value === undefined) {
												return `${key}: null`;
											}
											if (typeof value === "string") {
												return `${key}: ${value.substring(0, 100)}`; // Limit string length
											}
											if (typeof value === "object") {
												try {
													return `${key}: ${JSON.stringify(value).substring(0, 100)}`;
												} catch {
													return `${key}: [object]`;
												}
											}
											return `${key}: ${String(value)}`;
										})
										.join(", ");
									errorMessage = `${errorMessage} - ${detailsStr}`;
								} else {
									errorMessage = `${errorMessage} - ${String(details)}`;
								}
							} catch {
								// Last resort: just use string representation
								try {
									errorMessage = `${errorMessage} - ${String(details)}`;
								} catch {
									// If even String() fails, just skip details
									console.warn(
										"[fetchTeamMembers] Could not stringify error details",
									);
								}
							}
						}
					} else {
						// Handle primitive types (number, boolean, etc.)
						errorMessage = `${errorMessage} - ${String(details)}`;
					}
				} catch (detailsError) {
					// If anything fails in processing details, log and skip
					console.error(
						"[fetchTeamMembers] Error processing error details:",
						detailsError,
					);
					// Don't modify errorMessage if we can't process details
				}
			}

			// Only add "Prazan odgovor" message if errorData is truly empty (no error, no details, no warning)
			if (
				!hasErrorData ||
				(!errorData.error && !errorData.details && !errorData.warning)
			) {
				if (!errorMessage.includes("Prazan odgovor")) {
					errorMessage = `${errorMessage} - Prazan odgovor od servera`;
				}
			}

			// Always log error details in development, but with better structure
			const isDevelopment = process.env.NODE_ENV === "development";

			// Build log details with all available information
			// Initialize with safe values to avoid undefined issues
			const logDetails: Record<string, unknown> = {
				status: status ?? "unknown",
				statusText: statusText ?? "unknown",
				url: url ?? "unknown",
				contentType: contentType ?? "unknown",
				errorMessage: errorMessage ?? "Unknown error",
				hasErrorData: hasErrorData,
			};

			// Safely add error data if available
			try {
				if (errorData !== undefined && errorData !== null) {
					if (typeof errorData === "object") {
						try {
							const errorDataKeys = Object.keys(errorData);
							logDetails.errorDataKeyCount = errorDataKeys.length;

							if (errorDataKeys.length > 0) {
								// Try to safely stringify errorData
								try {
									// Use JSON.stringify with a replacer to handle circular references
									const serialized = JSON.stringify(
										errorData,
										(_key, value) => {
											// Handle circular references
											if (typeof value === "object" && value !== null) {
												try {
													JSON.stringify(value);
													return value;
												} catch {
													return "[Circular]";
												}
											}
											return value;
										},
									);
									logDetails.errorData = JSON.parse(serialized);
								} catch (stringifyError) {
									// If stringify fails, log what we can
									logDetails.errorDataKeys = errorDataKeys;
									logDetails.errorDataError =
										stringifyError instanceof Error
											? stringifyError.message
											: "Could not serialize errorData";

									// Try to extract error message if it exists
									if (
										"error" in errorData &&
										typeof errorData.error === "string"
									) {
										logDetails.errorDataErrorValue = errorData.error;
									}
								}
							} else {
								logDetails.errorData = "empty object";
							}
						} catch {
							logDetails.errorDataError = "Could not access errorData keys";
							logDetails.errorData = String(errorData);
						}
					} else {
						// Not an object, just stringify it
						logDetails.errorData = String(errorData);
					}
				} else {
					logDetails.errorData = "null or undefined";
				}
			} catch (errorDataError) {
				logDetails.errorDataError =
					errorDataError instanceof Error
						? errorDataError.message
						: "Unknown error processing errorData";
			}

			// Add response text information
			try {
				if (trimmedText && trimmedText.length > 0) {
					logDetails.responseTextPreview =
						trimmedText.length > 200
							? `${trimmedText.substring(0, 200)}...`
							: trimmedText;
					logDetails.responseTextLength = trimmedText.length;
				} else {
					logDetails.responseTextLength = 0;
					logDetails.responseBodyNote = "Response body is empty or null";
				}
			} catch (responseTextError) {
				logDetails.responseTextError =
					responseTextError instanceof Error
						? responseTextError.message
						: "Could not process response text";
			}

			// Log error details - always log, but format differently for dev/prod
			try {
				// First, log basic info directly to ensure it's always visible
				console.error("[fetchTeamMembers] API error - Basic info:", {
					status: String(status || "unknown"),
					statusText: String(statusText || "unknown"),
					url: String(url || "unknown"),
					contentType: String(contentType || "unknown"),
					errorMessage: String(errorMessage || "Unknown error"),
					hasErrorData: Boolean(hasErrorData),
				});

				if (isDevelopment) {
					// In development, try to log full details
					try {
						// Try to stringify logDetails
						const logDetailsStr = JSON.stringify(logDetails, null, 2);
						console.error(
							"[fetchTeamMembers] API error response (JSON):",
							logDetailsStr,
						);
					} catch (stringifyError) {
						// If stringify fails, log what we can
						console.error(
							"[fetchTeamMembers] Could not stringify logDetails:",
							stringifyError,
						);
						console.error(
							"[fetchTeamMembers] LogDetails keys:",
							Object.keys(logDetails),
						);
					}

					// Also log as object for easier inspection (this might show [Object] in some browsers)
					try {
						// Only log if logDetails has meaningful content
						const hasContent =
							Object.keys(logDetails).length > 0 &&
							Object.values(logDetails).some(
								(v) =>
									v !== undefined && v !== null && v !== "unknown" && v !== "",
							);
						if (hasContent) {
							console.error(
								"[fetchTeamMembers] API error response (object):",
								logDetails,
							);
						} else {
							console.error(
								"[fetchTeamMembers] API error response: Empty or invalid response from server",
								{
									status: String(status || "unknown"),
									statusText: String(statusText || "unknown"),
									url: String(url || "unknown"),
								},
							);
						}
					} catch (objectLogError) {
						console.error(
							"[fetchTeamMembers] Could not log logDetails as object:",
							objectLogError,
						);
					}
				} else {
					// In production, log a simplified version
					console.error("[fetchTeamMembers] API error:", {
						status: String(status || "unknown"),
						statusText: String(statusText || "unknown"),
						url: String(url || "unknown"),
						errorMessage:
							typeof errorMessage === "string"
								? errorMessage.substring(0, 200)
								: "Unknown error",
					});
				}
			} catch (logError) {
				// If logging fails, at least log the basic error using direct values
				console.error(
					"[fetchTeamMembers] Failed to log error details:",
					logError,
				);
				console.error("[fetchTeamMembers] Basic error info (direct):", {
					status: String(status),
					statusText: String(statusText),
					url: String(url),
					errorMessage: String(errorMessage),
				});
			}

			const error = new Error(errorMessage);
			(error as Error & { status?: number }).status = status;
			throw error;
		}

		// Success case - parse JSON response
		if (!contentType?.includes("application/json")) {
			const errorMessage = `Očekivani JSON odgovor nije primljen. Content-Type: ${contentType || "unknown"}`;
			console.error("[fetchTeamMembers] Invalid content type", {
				status,
				statusText,
				url,
				contentType,
				responseText: responseText.substring(0, 200),
			});
			throw new Error(errorMessage);
		}

		if (!responseText || !responseText.trim()) {
			console.error("[fetchTeamMembers] Empty response body", {
				status,
				statusText,
				url,
				contentType,
			});
			throw new Error("Prazan odgovor od servera");
		}

		let payload: { data: TeamMemberApi[] };
		try {
			payload = JSON.parse(responseText) as { data: TeamMemberApi[] };
		} catch (parseError) {
			console.error("[fetchTeamMembers] Failed to parse JSON response", {
				status,
				statusText,
				url,
				contentType,
				responseText: responseText.substring(0, 500),
				parseError:
					parseError instanceof Error ? parseError.message : String(parseError),
			});
			throw new Error(
				`Neuspešno parsiranje JSON odgovora: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
			);
		}

		if (!payload || typeof payload !== "object") {
			throw new Error("Neočekivan format odgovora: payload nije objekat");
		}

		if (!("data" in payload)) {
			console.error("[fetchTeamMembers] Missing 'data' field in response", {
				status: response.status,
				payloadKeys: Object.keys(payload),
				payload,
			});
			throw new Error("Neočekivan format odgovora: nedostaje polje 'data'");
		}

		if (!Array.isArray(payload.data)) {
			console.error("[fetchTeamMembers] 'data' field is not an array", {
				status: response.status,
				dataType: typeof payload.data,
				data: payload.data,
			});
			throw new Error(
				`Neočekivan format odgovora: 'data' nije niz (tip: ${typeof payload.data})`,
			);
		}

		return payload.data.map(mapTeamMember);
	} catch (error) {
		if (error instanceof Error && "status" in error) {
			throw error;
		}
		console.error("[fetchTeamMembers] Unexpected error", {
			error,
			errorType: typeof error,
			errorName: error instanceof Error ? error.name : undefined,
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
};

export const createTeamMember = async (
	values: CreateTeamMemberPayload,
): Promise<TeamMember> => {
	const response = await fetch("/api/settings/team-members", {
		method: "POST",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify(values),
		credentials: "include",
	});

	const payload = await handleResponse<{ data: TeamMemberApi }>(response);
	return mapTeamMember(payload.data);
};

export const updateTeamMember = async (
	id: string,
	values: UpdateTeamMemberPayload,
): Promise<TeamMember> => {
	const response = await fetch(`/api/settings/team-members/${id}`, {
		method: "PATCH",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify(values),
		credentials: "include",
	});

	const payload = await handleResponse<{ data: TeamMemberApi }>(response);
	return mapTeamMember(payload.data);
};

export const deleteTeamMember = async (id: string): Promise<void> => {
	const response = await fetch(`/api/settings/team-members/${id}`, {
		method: "DELETE",
		headers: DEFAULT_HEADERS,
		credentials: "include",
	});

	if (!response.ok && response.status !== 204) {
		let message = "Brisanje člana tima nije uspelo.";
		try {
			const body = (await response.json()) as { error?: string };
			if (body?.error) {
				message = body.error;
			}
		} catch {
			// ignore
		}
		throw new Error(message);
	}
};

export const TEAM_MEMBER_STATUSES: TeamMemberStatus[] = [
	"online",
	"offline",
	"idle",
	"invited",
];

export type { TeamMemberStatus };
