import type * as ReactNamespace from "react";

declare global {
	namespace React {
		export * from "react";
	}

	const React: typeof ReactNamespace;
}
