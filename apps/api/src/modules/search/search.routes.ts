import type { FastifyPluginAsync } from "fastify";
import { searchHandler, suggestionsHandler } from "./search.controller";

const searchRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		"/",
		{
			schema: {
				tags: ["search"],
				summary: "Global search",
				description: "Search across all modules (Accounts, Sales, CRM, Projects)",
				querystring: {
					type: "object",
					properties: {
						q: { type: "string", minLength: 2 },
						types: {
							type: "string",
							description: "Comma-separated list of types to search (company,contact,order,quote,invoice,project,lead)"
						},
						limit: { type: "string", pattern: "^[0-9]+$" },
						offset: { type: "string", pattern: "^[0-9]+$" }
					},
					required: ["q"]
				},
				response: {
					200: {
						type: "object",
						properties: {
							query: { type: "string" },
							results: {
								type: "array",
								items: {
									type: "object",
									properties: {
										type: {
											type: "string",
											enum: ["company", "contact", "order", "quote", "invoice", "project", "lead"]
										},
										id: { type: "string" },
										title: { type: "string" },
										description: { type: "string" },
										metadata: { type: "object" }
									}
								}
							},
							total: { type: "number" },
							limit: { type: "number" },
							offset: { type: "number" }
						}
					},
					400: {
						type: "object",
						properties: {
							error: { type: "string" },
							message: { type: "string" }
						}
					}
				}
			}
		},
		searchHandler
	);

	fastify.get(
		"/suggestions",
		{
			schema: {
				tags: ["search"],
				summary: "Get search suggestions",
				description: "Get search suggestions based on partial query",
				querystring: {
					type: "object",
					properties: {
						q: { type: "string", minLength: 2 },
						limit: { type: "string", pattern: "^[0-9]+$" }
					},
					required: ["q"]
				},
				response: {
					200: {
						type: "object",
						properties: {
							suggestions: {
								type: "array",
								items: { type: "string" }
							}
						}
					}
				}
			}
		},
		suggestionsHandler
	);
};

export default searchRoutes;

