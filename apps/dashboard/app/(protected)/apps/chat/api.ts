export type ChatConversation = {
	id: string;
	userId1: string;
	userId2: string;
	companyId: string;
	lastMessageAt: string | null;
	lastMessage: string | null;
	unreadCount: number;
	createdAt: string;
	updatedAt: string;
	user1: {
		id: string;
		firstName: string;
		lastName: string;
		displayName: string | null;
		email: string;
		avatarUrl: string | null;
		status: string;
	};
	user2: {
		id: string;
		firstName: string;
		lastName: string;
		displayName: string | null;
		email: string;
		avatarUrl: string | null;
		status: string;
	};
};

export type ChatMessage = {
	id: string;
	conversationId: string;
	senderId: string;
	content: string | null;
	type: "text" | "file" | "image" | "video" | "sound";
	status: "sent" | "delivered" | "read";
	fileUrl: string | null;
	fileMetadata: string | null;
	readAt: string | null;
	createdAt: string;
	updatedAt: string;
	sender: {
		id: string;
		firstName: string;
		lastName: string;
		displayName: string | null;
		email: string;
		avatarUrl: string | null;
	};
};

type GetConversationsResponse = {
	conversations: ChatConversation[];
};

type GetMessagesResponse = {
	messages: ChatMessage[];
};

type CreateConversationResponse = {
	conversation: ChatConversation;
};

type CreateMessageResponse = {
	message: ChatMessage;
};

// Chat service API calls now go through Next.js API routes
// This allows us to read httpOnly cookies on the server side
const getChatApiUrl = (path: string) => {
    return `/api/chat${path}`;
};

// Track one-time silent auth refresh attempt to avoid infinite loops
let __conversationsAuthRetry = false;

export const fetchConversations = async (): Promise<ChatConversation[]> => {
	try {
		const apiUrl = getChatApiUrl("/conversations");
		const requestUrl =
			typeof window !== "undefined"
				? new URL(apiUrl, window.location.origin).toString()
				: apiUrl;
		let response: Response;

		try {
			response = await fetch(requestUrl, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				cache: "no-store",
				credentials: "include",
			});
		} catch (fetchError) {
			const errorMessage =
				fetchError instanceof Error ? fetchError.message : String(fetchError);
			console.error("[fetchConversations] Fetch failed", {
				url: apiUrl,
				error: errorMessage,
				errorType: typeof fetchError,
				errorStack: fetchError instanceof Error ? fetchError.stack : undefined,
			});

			// Network errors (service unavailable) should be handled gracefully
			if (
				errorMessage.includes("Failed to fetch") ||
				errorMessage.includes("NetworkError") ||
				errorMessage.includes("ERR_CONNECTION_REFUSED") ||
				errorMessage.includes("connection refused")
			) {
				console.warn(
					"[fetchConversations] Chat service unavailable, conversations will not be loaded. Make sure chat service is running on port 4001.",
				);
				// Return empty array - app should work without chat service
				return [];
			}

			throw new Error(`Neuspešan zahtev ka API-ju: ${errorMessage}`);
		}

		const status = response.status;
		const statusText = response.statusText;
		const contentType = response.headers.get("content-type");
		const responseUrl = response.url || requestUrl;

		let responseText = "";
		try {
			responseText = await response.text();
		} catch (readError) {
			console.error("[fetchConversations] Failed to read response body", {
				status,
				statusText,
				url: responseUrl,
				apiUrl,
				error:
					readError instanceof Error ? readError.message : String(readError),
			});
			throw new Error(
				`Neuspešno čitanje odgovora od servera: ${readError instanceof Error ? readError.message : String(readError)}`,
			);
		}

		if (!response.ok) {
			let errorData: { error?: string; details?: unknown } = {};
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
					errorData = { error: trimmedText };
				}
			}

			const hasErrorData = Object.keys(errorData).length > 0;
			let errorMessage = errorData.error || `HTTP ${status}: ${statusText}`;

			if (errorData.details) {
				if (typeof errorData.details === "string") {
					errorMessage = `${errorMessage} - ${errorData.details}`;
				} else {
					errorMessage = `${errorMessage} - ${String(errorData.details)}`;
				}
			}

			if (!hasErrorData) {
				errorMessage = `${errorMessage} - Prazan odgovor od servera`;
			}

			// Check if this is a service unavailable error (503 or related messages)
			// Handle gracefully before logging as error
			const isServiceUnavailable =
				status === 503 ||
				statusText?.toLowerCase().includes("service unavailable") ||
				errorMessage.toLowerCase().includes("servis nije dostupan") ||
				errorMessage.toLowerCase().includes("service unavailable") ||
				errorMessage.toLowerCase().includes("nije dostupan");

			if (isServiceUnavailable) {
				// Log as warning for service unavailable (expected scenario)
				console.warn("[fetchConversations] Chat service unavailable", {
					status,
					statusText,
					url: responseUrl || apiUrl,
					apiUrl,
					errorMessage,
					timestamp: new Date().toISOString(),
				});
				// Return empty array - app should work without chat service
				return [];
			}

			// Gracefully handle server errors (5xx) by returning empty data instead of breaking UI
			if (status >= 500) {
				console.warn("[fetchConversations] Server error, returning empty conversations", {
					status,
					statusText,
					url: responseUrl || apiUrl,
					apiUrl,
					contentType,
					responseTextPreview: trimmedText?.slice(0, 200)
				});
				return [];
			}

			// Build log details for actual errors (not service unavailable)
			const logDetails: Record<string, unknown> = {
				status: typeof status === "number" ? status : "unknown",
				statusText: statusText || "unknown",
				url: responseUrl || apiUrl,
				apiUrl: apiUrl,
				contentType: contentType || "unknown",
				hasErrorData,
				errorMessage,
				timestamp: new Date().toISOString(),
			};

			if (hasErrorData && errorData && Object.keys(errorData).length > 0) {
				logDetails.errorData = errorData;
			}

			if (trimmedText) {
				logDetails.responseTextPreview =
					trimmedText.length > 200
						? `${trimmedText.substring(0, 200)}...`
						: trimmedText;
				logDetails.responseTextLength = trimmedText.length;
			} else {
				logDetails.responseTextLength = 0;
				logDetails.note = "Response body is empty";
				logDetails.responseText = "";
			}

        // Handle unauthorized by attempting silent session refresh once
        if (status === 401) {
            console.warn("[fetchConversations] Unauthorized (401). Attempting session refresh.");
            if (!__conversationsAuthRetry) {
                __conversationsAuthRetry = true;
                try {
                    const refresh = await fetch("/api/auth/me", {
                        method: "GET",
                        headers: { Accept: "application/json" },
                        cache: "no-store",
                        credentials: "include",
                    });
                    if (refresh.ok) {
                        try {
                            const retryResponse = await fetch(apiUrl, {
                                method: "GET",
                                headers: {
                                    "Content-Type": "application/json",
                                    Accept: "application/json",
                                },
                                cache: "no-store",
                                credentials: "include",
                            });
                            __conversationsAuthRetry = false;
                            if (retryResponse.ok) {
                                const retryText = await retryResponse.text();
                                const data = JSON.parse(retryText) as GetConversationsResponse;
                                return Array.isArray(data.conversations) ? data.conversations : [];
                            }
                        } catch {
                            // fall through to empty array
                        }
                    }
                } catch {
                    // ignore
                }
            }
            // Return empty array to avoid noisy logs and let UI continue
            return [];
        }

        // Log actual errors (not service unavailable)
        console.error(
            "[fetchConversations] API error response:",
            JSON.stringify(logDetails, null, 2),
        );
        console.error(
            "[fetchConversations] API error response (object):",
            logDetails,
        );

        const error = new Error(errorMessage);
        (error as Error & { status?: number }).status = status;
        throw error;
		}

		if (!contentType?.includes("application/json")) {
			// If content type is not JSON (e.g., HTML error page), don't break the UI
			console.warn("[fetchConversations] Non-JSON response received, returning empty list", {
				status,
				statusText,
				url: responseUrl,
				apiUrl,
				contentType,
				responseTextPreview: responseText.substring(0, 200),
			});
			return [];
		}

		if (!responseText || !responseText.trim()) {
			console.error("[fetchConversations] Empty response body", {
				status,
				statusText,
				url: responseUrl,
				apiUrl,
				contentType,
			});
			throw new Error("Prazan odgovor od servera");
		}

		let payload: GetConversationsResponse;
		try {
			payload = JSON.parse(responseText) as GetConversationsResponse;
		} catch (parseError) {
			console.error("[fetchConversations] Failed to parse JSON response", {
				status,
				statusText,
				url: responseUrl,
				apiUrl,
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

		if (!("conversations" in payload)) {
			console.error(
				"[fetchConversations] Missing 'conversations' field in response",
				{
					status: response.status,
					payloadKeys: Object.keys(payload),
					payload,
				},
			);
			throw new Error(
				"Neočekivan format odgovora: nedostaje polje 'conversations'",
			);
		}

		if (!Array.isArray(payload.conversations)) {
			console.error(
				"[fetchConversations] 'conversations' field is not an array",
				{
					status: response.status,
					conversationsType: typeof payload.conversations,
					conversations: payload.conversations,
				},
			);
			throw new Error(
				`Neočekivan format odgovora: 'conversations' nije niz (tip: ${typeof payload.conversations})`,
			);
		}

		return payload.conversations;
	} catch (error) {
		// If error has status property, it's already been handled and logged
		if (error instanceof Error && "status" in error) {
			const errorStatus = (error as Error & { status?: number }).status;
			const errorMessage = error.message.toLowerCase();

			// Check if this is a service unavailable error
			const isServiceUnavailable =
				errorStatus === 503 ||
				errorMessage.includes("servis nije dostupan") ||
				errorMessage.includes("service unavailable") ||
				errorMessage.includes("nije dostupan");

			if (isServiceUnavailable) {
				console.warn(
					"[fetchConversations] Chat service unavailable, returning empty array",
					{
						status: errorStatus,
						errorMessage: error.message,
					},
				);
				return [];
			}

			// For other errors with status, throw them
			throw error;
		}

		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorMessageLower = errorMessage.toLowerCase();

		// Network errors (service unavailable) should be handled gracefully
		const isNetworkError =
			errorMessageLower.includes("failed to fetch") ||
			errorMessageLower.includes("networkerror") ||
			errorMessageLower.includes("err_connection_refused") ||
			errorMessageLower.includes("connection refused") ||
			errorMessageLower.includes("servis nije dostupan") ||
			errorMessageLower.includes("service unavailable") ||
			errorMessageLower.includes("nije dostupan");

		if (isNetworkError) {
			console.warn(
				"[fetchConversations] Chat service unavailable, conversations will not be loaded. Make sure chat service is running on port 4001.",
				{
					errorMessage,
					errorType: typeof error,
				},
			);
			// Return empty array - app should work without chat service
			return [];
		}

		// Log and throw other unexpected errors
		console.error("[fetchConversations] Unexpected error", {
			error,
			errorType: typeof error,
			errorName: error instanceof Error ? error.name : undefined,
			errorMessage,
			errorStack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
};

export const fetchConversationMessages = async (
	conversationId: string,
	limit = 50,
): Promise<ChatMessage[]> => {
	try {
		const url = new URL(
			getChatApiUrl(`/conversations/${conversationId}/messages`),
			typeof window !== "undefined"
				? window.location.origin
				: "http://localhost:3000",
		);
		url.searchParams.set("limit", limit.toString());

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			cache: "no-store",
			credentials: "include",
		});

		if (!response.ok) {
			let errorData: { error?: string; message?: string; details?: string } = {};
			try {
				const text = await response.text();
				if (text) {
					errorData = JSON.parse(text) as typeof errorData;
				}
			} catch {
				// Ignore parse errors
			}

			const errorMessage =
				errorData.error ||
				errorData.message ||
				errorData.details ||
				"Preuzimanje poruka nije uspelo.";

			// Handle service unavailable (503) gracefully
			if (response.status === 503) {
				throw new Error(
					errorMessage.includes("servis nije dostupan") ||
					errorMessage.includes("service unavailable")
						? errorMessage
						: "Chat servis nije dostupan. Proverite da li je servis pokrenut na portu 4001.",
				);
			}

			// Handle unauthorized (401) with clear message
			if (response.status === 401) {
				throw new Error("Niste autorizovani. Molimo prijavite se ponovo.");
			}

			throw new Error(errorMessage);
		}

		let data: GetMessagesResponse;
		try {
			data = (await response.json()) as GetMessagesResponse;
		} catch (parseError) {
			console.error("[fetchConversationMessages] Failed to parse response:", {
				conversationId,
				error: parseError instanceof Error ? parseError.message : String(parseError),
			});
			throw new Error("Neočekivan format odgovora od servera.");
		}

		if (!data || !data.messages || !Array.isArray(data.messages)) {
			console.error("[fetchConversationMessages] Invalid response format:", {
				conversationId,
				data,
			});
			throw new Error("Neočekivan format odgovora od servera.");
		}

		return data.messages;
	} catch (error) {
		// Network errors (service unavailable) should be handled gracefully
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (
			errorMessage.includes("Failed to fetch") ||
			errorMessage.includes("NetworkError") ||
			errorMessage.includes("ERR_CONNECTION_REFUSED") ||
			errorMessage.includes("connection refused") ||
			errorMessage.includes("ECONNREFUSED")
		) {
			throw new Error(
				"Chat servis nije dostupan. Proverite da li je servis pokrenut na portu 4001.",
			);
		}
		// Re-throw other errors as-is (they already have proper messages)
		throw error;
	}
};

export const createConversation = async (
    targetUserId: string,
): Promise<ChatConversation> => {
	const apiUrl = getChatApiUrl("/conversations");
	const requestUrl =
		typeof window !== "undefined"
			? new URL(apiUrl, window.location.origin).toString()
			: apiUrl;
	let response: Response;

	try {
		response = await fetch(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ targetUserId }),
			cache: "no-store",
			credentials: "include",
		});
	} catch (fetchError) {
		const errorMessage =
			fetchError instanceof Error ? fetchError.message : String(fetchError);
		console.error("[createConversation] Fetch failed", {
			url: apiUrl,
			targetUserId,
			error: errorMessage,
			errorType: typeof fetchError,
			errorStack: fetchError instanceof Error ? fetchError.stack : undefined,
		});

		// Network errors (service unavailable) should be handled gracefully
		if (
			errorMessage.includes("Failed to fetch") ||
			errorMessage.includes("NetworkError") ||
			errorMessage.includes("ERR_CONNECTION_REFUSED") ||
			errorMessage.includes("connection refused")
		) {
			throw new Error(
				"Chat servis nije dostupan. Proverite da li je servis pokrenut.",
			);
		}

		throw new Error(`Neuspešan zahtev ka API-ju: ${errorMessage}`);
	}

	const status = response.status;
	const statusText = response.statusText;
	const contentType = response.headers.get("content-type");
	const responseUrl = response.url || requestUrl;

	let responseText = "";
	try {
		responseText = await response.text();
	} catch (readError) {
		console.error("[createConversation] Failed to read response body", {
			status,
			statusText,
			url: responseUrl,
			apiUrl,
			targetUserId,
			error: readError instanceof Error ? readError.message : String(readError),
		});
		throw new Error(
			`Neuspešno čitanje odgovora od servera: ${readError instanceof Error ? readError.message : String(readError)}`,
		);
	}

	if (!response.ok) {
		let errorData: { error?: string; details?: unknown } = {};
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
				errorData = { error: trimmedText };
			}
		}

		const hasErrorData = Object.keys(errorData).length > 0;
		let errorMessage = errorData.error || `HTTP ${status}: ${statusText}`;

		if (errorData.details) {
			if (typeof errorData.details === "string") {
				errorMessage = `${errorMessage} - ${errorData.details}`;
			} else {
				errorMessage = `${errorMessage} - ${String(errorData.details)}`;
			}
		}

		if (!hasErrorData) {
			errorMessage = `${errorMessage} - Prazan odgovor od servera`;
		}

		// Check if this is a service unavailable error (503 or related messages)
		const isServiceUnavailable =
			status === 503 ||
			statusText?.toLowerCase().includes("service unavailable") ||
			errorMessage.toLowerCase().includes("servis nije dostupan") ||
			errorMessage.toLowerCase().includes("service unavailable") ||
			errorMessage.toLowerCase().includes("nije dostupan");

		if (isServiceUnavailable) {
			// Log as warning for service unavailable (expected scenario)
			console.warn("[createConversation] Chat service unavailable", {
				status,
				statusText,
				url: responseUrl || apiUrl,
				apiUrl,
				targetUserId,
				errorMessage,
				timestamp: new Date().toISOString(),
			});
			// Throw clear error that can be handled gracefully
			throw new Error(
				"Chat servis nije dostupan. Proverite da li je servis pokrenut.",
			);
		}

		// Build log details for actual errors (not service unavailable)
		const logDetails: Record<string, unknown> = {
			status: typeof status === "number" ? status : "unknown",
			statusText: statusText || "unknown",
			url: responseUrl || apiUrl,
			apiUrl: apiUrl,
			contentType: contentType || "unknown",
			targetUserId,
			hasErrorData,
			errorMessage,
			timestamp: new Date().toISOString(),
		};

		if (hasErrorData && errorData && Object.keys(errorData).length > 0) {
			logDetails.errorData = errorData;
		}

		if (trimmedText) {
			logDetails.responseTextPreview =
				trimmedText.length > 200
					? `${trimmedText.substring(0, 200)}...`
					: trimmedText;
			logDetails.responseTextLength = trimmedText.length;
		} else {
			logDetails.responseTextLength = 0;
			logDetails.note = "Response body is empty";
			logDetails.responseText = "";
		}

		// Log actual errors (not service unavailable)
		console.error(
			"[createConversation] API error response:",
			JSON.stringify(logDetails, null, 2),
		);
		console.error(
			"[createConversation] API error response (object):",
			logDetails,
		);

		const error = new Error(errorMessage);
		(error as Error & { status?: number }).status = status;
		throw error;
	}

	if (!contentType?.includes("application/json")) {
		const errorMessage = `Očekivani JSON odgovor nije primljen. Content-Type: ${contentType || "unknown"}`;
		console.error("[createConversation] Invalid content type", {
			status,
			statusText,
			url: responseUrl,
			apiUrl,
			targetUserId,
			contentType,
			responseText: responseText.substring(0, 200),
		});
		throw new Error(errorMessage);
	}

	if (!responseText || !responseText.trim()) {
		console.error("[createConversation] Empty response body", {
			status,
			statusText,
			url: responseUrl,
			apiUrl,
			targetUserId,
			contentType,
		});
		throw new Error("Prazan odgovor od servera");
	}

	let payload: CreateConversationResponse;
	try {
		payload = JSON.parse(responseText) as CreateConversationResponse;
	} catch (parseError) {
		console.error("[createConversation] Failed to parse JSON response", {
			status,
			statusText,
			url: responseUrl,
			apiUrl,
			targetUserId,
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

	if (!("conversation" in payload)) {
		console.error(
			"[createConversation] Missing 'conversation' field in response",
			{
				status: response.status,
				payloadKeys: Object.keys(payload),
				payload,
			},
		);
		throw new Error(
			"Neočekivan format odgovora: nedostaje polje 'conversation'",
		);
	}

	return payload.conversation;
};

export const createConversationByEmail = async (
    targetEmail: string,
): Promise<ChatConversation> => {
    const apiUrl = getChatApiUrl("/conversations");
    const requestUrl =
        typeof window !== "undefined"
            ? new URL(apiUrl, window.location.origin).toString()
            : apiUrl;
    let response: Response;

    try {
        response = await fetch(requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ targetEmail }),
            cache: "no-store",
            credentials: "include",
        });
    } catch (fetchError) {
        const errorMessage =
            fetchError instanceof Error ? fetchError.message : String(fetchError);
        if (
            errorMessage.includes("Failed to fetch") ||
            errorMessage.includes("NetworkError") ||
            errorMessage.includes("ERR_CONNECTION_REFUSED") ||
            errorMessage.includes("connection refused")
        ) {
            throw new Error(
                "Chat servis nije dostupan. Proverite da li je servis pokrenut.",
            );
        }
        throw new Error(`Neuspešan zahtev ka API-ju: ${errorMessage}`);
    }

    const status = response.status;
    const statusText = response.statusText;
    let responseText = "";
    try {
        responseText = await response.text();
    } catch (readError) {
        throw new Error(
            `Neuspešno čitanje odgovora od servera: ${
                readError instanceof Error ? readError.message : String(readError)
            }`,
        );
    }

    if (!response.ok) {
        let errorData: { error?: string; details?: unknown } = {};
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
                errorData = { error: trimmedText };
            }
        }
        let errorMessage = errorData.error || `HTTP ${status}: ${statusText}`;
        if (errorData.details) {
            errorMessage = `${errorMessage} - ${String(errorData.details)}`;
        }
        const isServiceUnavailable =
            status === 503 ||
            statusText?.toLowerCase().includes("service unavailable") ||
            errorMessage.toLowerCase().includes("servis nije dostupan") ||
            errorMessage.toLowerCase().includes("service unavailable") ||
            errorMessage.toLowerCase().includes("nije dostupan");
        if (isServiceUnavailable) {
            throw new Error(
                "Chat servis nije dostupan. Proverite da li je servis pokrenut.",
            );
        }
        throw new Error(errorMessage);
    }

    if (!responseText || !responseText.trim()) {
        throw new Error("Prazan odgovor od chat servisa.");
    }
    let data: unknown;
    try {
        data = JSON.parse(responseText);
    } catch (parseError) {
        throw new Error(
            `Neuspešno parsiranje JSON odgovora od chat servisa: ${
                parseError instanceof Error ? parseError.message : String(parseError)
            }`,
        );
    }
    return data as ChatConversation;
};

export const sendMessage = async ({
	conversationId,
	content,
	type = "text",
	fileUrl,
	fileMetadata,
}: {
	conversationId: string;
	content?: string | null;
	type?: "text" | "file" | "image" | "video" | "sound";
	fileUrl?: string | null;
	fileMetadata?: string | null;
}): Promise<ChatMessage> => {
	try {
		const response = await fetch(
			getChatApiUrl(`/conversations/${conversationId}/messages`),
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					content,
					type,
					fileUrl,
					fileMetadata,
				}),
				cache: "no-store",
			},
		);

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: "Slanje poruke nije uspelo." }));
			throw new Error(error.error || "Slanje poruke nije uspelo.");
		}

		const data = (await response.json()) as CreateMessageResponse;
		return data.message;
	} catch (error) {
		// Network errors (service unavailable) should be handled gracefully
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (
			errorMessage.includes("Failed to fetch") ||
			errorMessage.includes("NetworkError") ||
			errorMessage.includes("ERR_CONNECTION_REFUSED") ||
			errorMessage.includes("connection refused")
		) {
			throw new Error(
				"Chat servis nije dostupan. Proverite da li je servis pokrenut na portu 4001.",
			);
		}
		throw error;
	}
};

export const markConversationAsRead = async (
	conversationId: string,
): Promise<void> => {
	try {
		const response = await fetch(
			getChatApiUrl(`/conversations/${conversationId}/messages/read`),
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				cache: "no-store",
				credentials: "include", // Important: send cookies with request
			},
		);

		if (!response.ok) {
			const errorData = await response
				.json()
				.catch(() => ({ error: "Označavanje poruka kao pročitanih nije uspelo." }));
			console.warn("[markConversationAsRead] Server returned error:", {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
				conversationId,
			});
			// Don't throw - just log and return
			return;
		}

		console.log("[markConversationAsRead] Successfully marked conversation as read:", conversationId);
	} catch (error) {
		// Network errors should be handled gracefully - just log and continue
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (
			errorMessage.includes("Failed to fetch") ||
			errorMessage.includes("NetworkError") ||
			errorMessage.includes("ERR_CONNECTION_REFUSED") ||
			errorMessage.includes("connection refused")
		) {
			console.warn("[markConversationAsRead] Chat service unavailable");
			return; // Don't throw, just return silently
		}
		// For other errors, just log - don't break the app
		console.error("[markConversationAsRead] Error:", error);
		// Don't re-throw - marking as read is not critical
	}
};
