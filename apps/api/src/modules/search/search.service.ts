import { ilike, or } from "drizzle-orm";
import type { AppDatabase } from "../../db/index.js";
import { accounts as companies, accountContacts as contacts } from "../../db/schema/accounts.schema.js";
import { orders } from "../../db/schema/sales.schema.js";
import { quotes } from "../../db/schema/sales.schema.js";
import { invoices } from "../../db/schema/sales.schema.js";
import { projects } from "../../db/schema/projects.schema.js";
import { leads } from "../../db/schema/crm.schema.js";

export interface SearchResult {
	type: "company" | "contact" | "order" | "quote" | "invoice" | "project" | "lead";
	id: string;
	title: string;
	description?: string;
	metadata?: Record<string, unknown>;
	score?: number;
}

export interface SearchOptions {
	query: string;
	types?: SearchResult["type"][];
	limit?: number;
	offset?: number;
}

export class SearchService {
	constructor(private database: AppDatabase) {}

	/**
	 * Search across all modules using full-text search
	 */
	async search(options: SearchOptions): Promise<{ results: SearchResult[]; total: number }> {
		const { query, types, limit = 20, offset = 0 } = options;
		const searchTerm = `%${query}%`;

		const allResults: SearchResult[] = [];

		// Search companies
		if (!types || types.includes("company")) {
			const companyResults = await this.database
				.select({
					id: companies.id,
					name: companies.name,
					email: companies.email,
					type: companies.type
				})
				.from(companies)
				.where(
					or(
						ilike(companies.name, searchTerm),
						ilike(companies.email, searchTerm),
						ilike(companies.phone, searchTerm)
					)
				)
				.limit(limit);

			for (const company of companyResults) {
				allResults.push({
					type: "company",
					id: company.id,
					title: company.name,
					description: company.email ?? undefined,
					metadata: {
						type: company.type
					}
				});
			}
		}

		// Search contacts
		if (!types || types.includes("contact")) {
			const contactResults = await this.database
				.select({
					id: contacts.id,
					firstName: contacts.firstName,
					lastName: contacts.lastName,
					email: contacts.email,
					accountId: contacts.accountId
				})
				.from(contacts)
				.where(
					or(
						ilike(contacts.firstName, searchTerm),
						ilike(contacts.lastName, searchTerm),
						ilike(contacts.email, searchTerm),
						ilike(contacts.phone, searchTerm)
					)
				)
				.limit(limit);

			for (const contact of contactResults) {
				allResults.push({
					type: "contact",
					id: contact.id,
					title: `${contact.firstName} ${contact.lastName}`,
					description: contact.email ?? undefined,
					metadata: {
						accountId: contact.accountId
					}
				});
			}
		}

		// Search orders
		if (!types || types.includes("order")) {
			const orderResults = await this.database
				.select({
					id: orders.id,
					orderNumber: orders.orderNumber,
					status: orders.status,
					notes: orders.notes
				})
				.from(orders)
				.where(
					or(
						ilike(orders.orderNumber, searchTerm),
						ilike(orders.notes, searchTerm)
					)
				)
				.limit(limit);

			for (const order of orderResults) {
				allResults.push({
					type: "order",
					id: order.id.toString(),
					title: `Order ${order.orderNumber}`,
					description: order.notes ?? undefined,
					metadata: {
						status: order.status
					}
				});
			}
		}

		// Search quotes
		if (!types || types.includes("quote")) {
			const quoteResults = await this.database
				.select({
					id: quotes.id,
					quoteNumber: quotes.quoteNumber,
					status: quotes.status,
					notes: quotes.notes
				})
				.from(quotes)
				.where(
					or(
						ilike(quotes.quoteNumber, searchTerm),
						ilike(quotes.notes, searchTerm)
					)
				)
				.limit(limit);

			for (const quote of quoteResults) {
				allResults.push({
					type: "quote",
					id: quote.id.toString(),
					title: `Quote ${quote.quoteNumber}`,
					description: quote.notes ?? undefined,
					metadata: {
						status: quote.status
					}
				});
			}
		}

		// Search invoices
		if (!types || types.includes("invoice")) {
			const invoiceResults = await this.database
				.select({
					id: invoices.id,
					invoiceNumber: invoices.invoiceNumber,
					status: invoices.status,
					notes: invoices.notes
				})
				.from(invoices)
				.where(
					or(
						ilike(invoices.invoiceNumber, searchTerm),
						ilike(invoices.notes, searchTerm)
					)
				)
				.limit(limit);

			for (const invoice of invoiceResults) {
				allResults.push({
					type: "invoice",
					id: invoice.id,
					title: `Invoice ${invoice.invoiceNumber}`,
					description: invoice.notes ?? undefined,
					metadata: {
						status: invoice.status
					}
				});
			}
		}

		// Search projects
		if (!types || types.includes("project")) {
			const projectResults = await this.database
				.select({
					id: projects.id,
					name: projects.name,
					description: projects.description,
					status: projects.status
				})
				.from(projects)
				.where(
					or(
						ilike(projects.name, searchTerm),
						ilike(projects.description, searchTerm)
					)
				)
				.limit(limit);

			for (const project of projectResults) {
				allResults.push({
					type: "project",
					id: project.id,
					title: project.name,
					description: project.description ?? undefined,
					metadata: {
						status: project.status
					}
				});
			}
		}

		// Search leads
		if (!types || types.includes("lead")) {
			const leadResults = await this.database
				.select({
					id: leads.id,
					name: leads.name,
					email: leads.email,
					status: leads.status
				})
				.from(leads)
				.where(
					or(
						ilike(leads.name, searchTerm),
						ilike(leads.email, searchTerm)
					)
				)
				.limit(limit);

			for (const lead of leadResults) {
				allResults.push({
					type: "lead",
					id: lead.id,
					title: lead.name,
					description: lead.email ?? undefined,
					metadata: {
						status: lead.status
					}
				});
			}
		}

		// Sort by relevance (simple: exact matches first, then partial)
		const sortedResults = allResults.sort((a, b) => {
			const aExact = a.title.toLowerCase() === query.toLowerCase();
			const bExact = b.title.toLowerCase() === query.toLowerCase();
			if (aExact && !bExact) return -1;
			if (!aExact && bExact) return 1;

			const aStarts = a.title.toLowerCase().startsWith(query.toLowerCase());
			const bStarts = b.title.toLowerCase().startsWith(query.toLowerCase());
			if (aStarts && !bStarts) return -1;
			if (!aStarts && bStarts) return 1;

			return 0;
		});

		// Apply pagination
		const paginatedResults = sortedResults.slice(offset, offset + limit);

		return {
			results: paginatedResults,
			total: sortedResults.length
		};
	}

	/**
	 * Get search suggestions based on query
	 */
	async getSuggestions(query: string, limit = 10): Promise<string[]> {
		if (query.length < 2) {
			return [];
		}

		const searchTerm = `%${query}%`;
		const suggestions = new Set<string>();

		// Get suggestions from companies
		const companyNames = await this.database
			.select({ name: companies.name })
			.from(companies)
			.where(ilike(companies.name, searchTerm))
			.limit(5);

		for (const company of companyNames) {
			suggestions.add(company.name);
		}

		// Get suggestions from contacts
		const contactNames = await this.database
			.select({
				firstName: contacts.firstName,
				lastName: contacts.lastName
			})
			.from(contacts)
			.where(
				or(
					ilike(contacts.firstName, searchTerm),
					ilike(contacts.lastName, searchTerm)
				)
			)
			.limit(5);

		for (const contact of contactNames) {
			suggestions.add(`${contact.firstName} ${contact.lastName}`);
		}

		// Get suggestions from projects
		const projectNames = await this.database
			.select({ name: projects.name })
			.from(projects)
			.where(ilike(projects.name, searchTerm))
			.limit(5);

		for (const project of projectNames) {
			suggestions.add(project.name);
		}

		return Array.from(suggestions).slice(0, limit);
	}
}

