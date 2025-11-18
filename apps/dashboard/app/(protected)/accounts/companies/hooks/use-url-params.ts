import * as React from "react";

/**
 * Custom hook za rad sa URL parametrima
 * Optimizovano za Next.js aplikacije
 */
export function useURLParams() {
	const [params, setParams] = React.useState<URLSearchParams | null>(null);

	React.useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const searchParams = new URLSearchParams(window.location.search);
		setParams(searchParams);
	}, []);

	const getParam = React.useCallback(
		(key: string): string | null => {
			return params?.get(key) ?? null;
		},
		[params],
	);

	const setParam = React.useCallback((key: string, value: string | null) => {
		if (typeof window === "undefined") {
			return;
		}

		const newUrl = new URL(window.location.href);
		if (value === null) {
			newUrl.searchParams.delete(key);
		} else {
			newUrl.searchParams.set(key, value);
		}
		window.history.replaceState({}, "", newUrl.toString());

		// Update local state
		setParams(new URLSearchParams(newUrl.search));
	}, []);

	const removeParam = React.useCallback(
		(key: string) => {
			setParam(key, null);
		},
		[setParam],
	);

	const removeParams = React.useCallback((keys: string[]) => {
		if (typeof window === "undefined") {
			return;
		}

		const newUrl = new URL(window.location.href);
		keys.forEach((key) => newUrl.searchParams.delete(key));
		window.history.replaceState({}, "", newUrl.toString());

		setParams(new URLSearchParams(newUrl.search));
	}, []);

	return {
		params,
		getParam,
		setParam,
		removeParam,
		removeParams,
	};
}
