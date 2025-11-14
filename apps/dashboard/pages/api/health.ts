import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    _req: NextApiRequest,
    res: NextApiResponse,
) {
    const apiBase =
        process.env.COLLECTOR_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const url = `${apiBase.replace(/\/$/, "")}/api/health`;

	try {
		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			const errorPayload = await response.json().catch(() => ({}));
			return res
				.status(response.status)
				.json({ ok: false, error: errorPayload });
		}

		const data = await response.json().catch(() => ({}));
		return res.status(200).json({ ok: true, data });
	} catch (error: unknown) {
		console.error("API health check failed:", error);
		const message =
			error instanceof Error ? error.message : "Service unavailable";
		return res.status(503).json({ ok: false, error: message });
	}
}
