import type {
	Candidate,
	CandidatesListResponse,
	CandidatesQueryState,
	Interview,
	InterviewsListResponse,
	InterviewsQueryState,
} from "./types";

const DEFAULT_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json",
} as const;

const handleResponse = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		let message = "Unexpected error.";
		try {
			const body = (await response.json()) as {
				error?: string;
				details?: unknown;
			};
			if (body?.error) {
				message = body.error;
			}
		} catch {
			// ignore
		}
		throw new Error(message);
	}

	return (await response.json()) as T;
};

const buildQueryString = (
	params: Record<string, string | number | undefined>,
) => {
	const searchParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null) {
			return;
		}
		searchParams.set(key, String(value));
	});

	return searchParams.toString();
};

// Candidates
export async function fetchCandidates(params: {
	query: CandidatesQueryState;
}): Promise<CandidatesListResponse> {
	const { query } = params;
	const queryString = buildQueryString(
		query as Record<string, string | number | undefined>,
	);
	const response = await fetch(
		`/api/hr/recruitment/candidates?${queryString}`,
		{
			method: "GET",
			headers: DEFAULT_HEADERS,
			cache: "no-store",
		},
	);
	return handleResponse<CandidatesListResponse>(response);
}

export async function getCandidateById(id: string): Promise<Candidate> {
	const response = await fetch(`/api/hr/recruitment/candidates/${id}`, {
		method: "GET",
		headers: DEFAULT_HEADERS,
		cache: "no-store",
	});
	const payload = await handleResponse<{ data: Candidate }>(response);
	return payload.data;
}

export async function createCandidate(
	values: Partial<Candidate>,
): Promise<Candidate> {
	const response = await fetch("/api/hr/recruitment/candidates", {
		method: "POST",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify(values),
	});
	const result = await handleResponse<{ data: Candidate }>(response);
	return result.data;
}

export async function updateCandidate(
	id: string,
	values: Partial<Candidate>,
): Promise<Candidate> {
	const response = await fetch(`/api/hr/recruitment/candidates/${id}`, {
		method: "PUT",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify(values),
	});
	const result = await handleResponse<{ data: Candidate }>(response);
	return result.data;
}

export async function deleteCandidate(id: string): Promise<void> {
	const response = await fetch(`/api/hr/recruitment/candidates/${id}`, {
		method: "DELETE",
		headers: DEFAULT_HEADERS,
	});
	if (!response.ok && response.status !== 204) {
		throw new Error("Unable to delete candidate.");
	}
}

// Interviews
export async function fetchInterviews(params: {
	query: InterviewsQueryState;
}): Promise<InterviewsListResponse> {
	const { query } = params;
	const queryString = buildQueryString(
		query as Record<string, string | number | undefined>,
	);
	const response = await fetch(
		`/api/hr/recruitment/interviews?${queryString}`,
		{
			method: "GET",
			headers: DEFAULT_HEADERS,
			cache: "no-store",
		},
	);
	return handleResponse<InterviewsListResponse>(response);
}

export async function getInterviewById(id: string): Promise<Interview> {
	const response = await fetch(`/api/hr/recruitment/interviews/${id}`, {
		method: "GET",
		headers: DEFAULT_HEADERS,
		cache: "no-store",
	});
	const payload = await handleResponse<{ data: Interview }>(response);
	return payload.data;
}

export async function createInterview(
	values: Partial<Interview>,
): Promise<Interview> {
	const response = await fetch("/api/hr/recruitment/interviews", {
		method: "POST",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify(values),
	});
	const result = await handleResponse<{ data: Interview }>(response);
	return result.data;
}

export async function updateInterview(
	id: string,
	values: Partial<Interview>,
): Promise<Interview> {
	const response = await fetch(`/api/hr/recruitment/interviews/${id}`, {
		method: "PUT",
		headers: DEFAULT_HEADERS,
		body: JSON.stringify(values),
	});
	const result = await handleResponse<{ data: Interview }>(response);
	return result.data;
}

export async function deleteInterview(id: string): Promise<void> {
	const response = await fetch(`/api/hr/recruitment/interviews/${id}`, {
		method: "DELETE",
		headers: DEFAULT_HEADERS,
	});
	if (!response.ok && response.status !== 204) {
		throw new Error("Unable to delete interview.");
	}
}
