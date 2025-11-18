"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const invoiceFilterSchema = z.object({
	name: z.string().optional().nullable(),
	statuses: z.array(z.string()).optional().nullable(),
	customers: z.array(z.string()).optional().nullable(),
	start: z.string().optional().nullable(),
	end: z.string().optional().nullable(),
});

export async function generateInvoiceFilters(prompt: string, context: string) {
	try {
		const { object } = await generateObject({
			model: openai("gpt-4o-mini"),
			schema: invoiceFilterSchema,
			prompt: `Based on the user's search query and the following context, extract relevant invoice filters:

User query: ${prompt}

Context: ${context}

Return only the relevant filters that match the user's intent.`,
		});

		return { object };
	} catch (error) {
		console.error("Failed to generate invoice filters:", error);
		return { object: null };
	}
}
