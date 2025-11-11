import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const url = `${backendUrl.replace(/\/$/, "")}/health`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return res.status(response.status).json({ ok: false, error: errorPayload });
    }

    const data = await response.json().catch(() => ({}));
    return res.status(200).json({ ok: true, data });
  } catch (error: any) {
    console.error("API health check failed:", error);
    return res.status(503).json({ ok: false, error: error?.message ?? "Service unavailable" });
  }
}
