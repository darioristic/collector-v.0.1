import type { NextApiRequest, NextApiResponse } from "next";

const DEFAULT_API_BASE = "http://localhost:4000/api";

function getApiBaseUrl() {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    const raw = configured && configured.length > 0 ? configured : DEFAULT_API_BASE;
    const withoutTrailingSlash = raw.endsWith("/") ? raw.slice(0, -1) : raw;
    return withoutTrailingSlash.toLowerCase().endsWith("/api")
        ? withoutTrailingSlash
        : `${withoutTrailingSlash}/api`;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const apiBase = getApiBaseUrl();
	const { id } = req.query;

	if (!id || Array.isArray(id)) {
		res.status(400).json({ error: "Invalid quote id" });
		return;
	}

	const upstreamUrl = `${apiBase}/sales/quotes/${id}`;

	try {
		let fetchOptions: RequestInit = {
			method: req.method,
			headers: {
				Accept: "application/json",
			},
		};

		if (req.method === "PATCH" || req.method === "PUT") {
			fetchOptions = {
				...fetchOptions,
				headers: {
					...fetchOptions.headers,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(req.body ?? {}),
			};
		}

		const response = await fetch(upstreamUrl, fetchOptions);
		const body = await response.text();

		res.status(response.status);
		res.setHeader(
			"Content-Type",
			response.headers.get("Content-Type") ?? "application/json",
		);
		res.send(body);
	} catch (error) {
		console.error(`[pages/api/quotes/${id}] proxy failed`, error);
		res.status(502).json({ error: "Quote proxy request failed" });
	}
}
