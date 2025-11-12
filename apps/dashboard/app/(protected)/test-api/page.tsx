"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/src/lib/fetch-utils";

export default function TestAPIPage() {
	const [data, setData] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function testAPI() {
			try {
				const url = getApiUrl("sales/quotes?limit=5");
				console.log("Fetching from:", url);

				const response = await fetch(url);
				console.log("Response status:", response.status);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const json = await response.json();
				console.log("Response data:", json);

				setData(json);
			} catch (err) {
				console.error("Fetch error:", err);
				setError(err instanceof Error ? err.message : String(err));
			} finally {
				setLoading(false);
			}
		}

		testAPI();
	}, []);

	return (
		<div className="container mx-auto py-8">
			<h1 className="text-2xl font-bold mb-4">API Test Page</h1>

			<div className="bg-gray-100 p-4 rounded mb-4">
				<h2 className="font-semibold mb-2">Environment Variables:</h2>
				<pre className="text-sm">
					NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || "undefined"}
				</pre>
			</div>

			{loading && <div>Loading...</div>}

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					<strong>Error:</strong> {error}
				</div>
			)}

			{data && (
				<div>
					<h2 className="font-semibold mb-2">API Response:</h2>
					<div className="bg-white p-4 rounded border">
						<p>
							<strong>Total:</strong> {data.total}
						</p>
						<p>
							<strong>Data Length:</strong> {data.data?.length || 0}
						</p>
						<h3 className="font-semibold mt-4 mb-2">First Quote:</h3>
						<pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
							{JSON.stringify(data.data?.[0], null, 2)}
						</pre>
					</div>
				</div>
			)}
		</div>
	);
}
