import type { NextApiRequest, NextApiResponse } from "next";

const DEFAULT_API_BASE = "http://localhost:4000/api";

function getApiBaseUrl() {
	const configured = process.env.NEXT_PUBLIC_API_URL;
	if (!configured) {
		return DEFAULT_API_BASE;
	}

	return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const apiBase = getApiBaseUrl();

	switch (req.method) {
		case "GET": {
			const upstreamUrl = new URL(`${apiBase}/sales/quotes`);
			Object.entries(req.query).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					value.forEach((v) => upstreamUrl.searchParams.append(key, v));
				} else if (typeof value === "string") {
					upstreamUrl.searchParams.append(key, value);
				}
			});

			try {
				const response = await fetch(upstreamUrl.toString(), {
					headers: {
						Accept: "application/json",
					},
					cache: "no-store",
				});

				const body = await response.text();
				res.status(response.status);
				res.setHeader(
					"Content-Type",
					response.headers.get("Content-Type") ?? "application/json",
				);
				res.send(body);
			} catch (error) {
				console.error("[pages/api/quotes] GET proxy failed", error);
				res.status(502).json({ error: "Failed to fetch quotes" });
			}
			return;
		}
		case "POST": {
			try {
				const response = await fetch(`${apiBase}/sales/quotes`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(req.body ?? {}),
				});

				const body = await response.text();
				res.status(response.status);
				res.setHeader(
					"Content-Type",
					response.headers.get("Content-Type") ?? "application/json",
				);
				res.send(body);
			} catch (error) {
				console.error("[pages/api/quotes] POST proxy failed", error);
				res.status(502).json({ error: "Failed to create quote" });
			}
			return;
		}
		default: {
			res.setHeader("Allow", ["GET", "POST"]);
			res.status(405).json({ error: "Method Not Allowed" });
		}
	}
}
