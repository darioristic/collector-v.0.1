export async function resolve(specifier, context, defaultResolve) {
	if (
		typeof specifier === "string" &&
		specifier.startsWith(".") &&
		!specifier.endsWith(".js") &&
		!specifier.endsWith(".json") &&
		!specifier.endsWith(".node")
	) {
		try {
			return await defaultResolve(specifier, context, defaultResolve);
		} catch (error) {
			if (error && error.code === "ERR_MODULE_NOT_FOUND") {
				return defaultResolve(`${specifier}.js`, context, defaultResolve);
			}
			throw error;
		}
	}

	return defaultResolve(specifier, context, defaultResolve);
}

