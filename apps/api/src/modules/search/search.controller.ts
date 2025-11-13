import type { FastifyReply, FastifyRequest } from "fastify";
import { SearchService } from "./search.service";
import type { SearchResult } from "./search.service";

type SearchQuery = FastifyRequest<{
	Querystring: {
		q: string;
		types?: string;
		limit?: string;
		offset?: string;
	};
}>;

type SuggestionsQuery = FastifyRequest<{
	Querystring: {
		q: string;
		limit?: string;
	};
}>;

export const searchHandler = async (request: SearchQuery, reply: FastifyReply) => {
	const query = request.query.q?.trim();

	if (!query || query.length < 2) {
		return reply.status(400).send({
			error: "Invalid query",
			message: "Search query must be at least 2 characters long"
		});
	}

	const types = request.query.types
		? (request.query.types.split(",") as SearchResult["type"][])
		: undefined;
	const limit = request.query.limit ? Number.parseInt(request.query.limit, 10) : 20;
	const offset = request.query.offset ? Number.parseInt(request.query.offset, 10) : 0;

	const service = new SearchService(request.db);
	const result = await service.search({
		query,
		types,
		limit,
		offset
	});

	return reply.status(200).send({
		query,
		results: result.results,
		total: result.total,
		limit,
		offset
	});
};

export const suggestionsHandler = async (request: SuggestionsQuery, reply: FastifyReply) => {
	const query = request.query.q?.trim();

	if (!query || query.length < 2) {
		return reply.status(200).send({ suggestions: [] });
	}

	const limit = request.query.limit ? Number.parseInt(request.query.limit, 10) : 10;

	const service = new SearchService(request.db);
	const suggestions = await service.getSuggestions(query, limit);

	return reply.status(200).send({ suggestions });
};

