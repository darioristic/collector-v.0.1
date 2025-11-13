import type { FastifyReply, FastifyRequest } from "fastify";
import { OrdersService } from "./orders.service";
import { QuotesService } from "./quotes.service";
import { InvoicesService } from "./invoices.service";
import { exportService } from "../../lib/export.service";

type ExportOrdersQuery = FastifyRequest<{
	Querystring: {
		companyId?: string;
		contactId?: string;
		status?: string;
		format?: "csv";
	};
}>;

type ExportQuotesQuery = FastifyRequest<{
	Querystring: {
		companyId?: string;
		contactId?: string;
		status?: string;
		format?: "csv";
	};
}>;

type ExportInvoicesQuery = FastifyRequest<{
	Querystring: {
		customerId?: string;
		orderId?: string;
		status?: string;
		format?: "csv";
	};
}>;

export const exportOrdersHandler = async (request: ExportOrdersQuery, reply: FastifyReply) => {
	const service = new OrdersService(request.db, request.cache);
	const filters = {
		companyId: request.query.companyId,
		contactId: request.query.contactId,
		status: request.query.status as any,
		limit: 10000, // Large limit for export
		offset: 0
	};

	const result = await service.list(filters);

	// Transform to CSV-friendly format
	const csvData = result.data.map((order) => ({
		"Order Number": order.orderNumber,
		"Order Date": exportService.formatDate(order.orderDate),
		"Expected Delivery": exportService.formatDate(order.expectedDelivery),
		"Company ID": order.companyId ?? "",
		"Contact ID": order.contactId ?? "",
		Currency: order.currency,
		Subtotal: exportService.formatNumber(order.subtotal),
		Tax: exportService.formatNumber(order.tax),
		Total: exportService.formatNumber(order.total),
		Status: order.status,
		Notes: order.notes ?? "",
		"Created At": exportService.formatDate(order.createdAt),
		"Updated At": exportService.formatDate(order.updatedAt)
	}));

	const csv = exportService.toCSV(csvData);

	reply.header("Content-Type", "text/csv; charset=utf-8");
	reply.header("Content-Disposition", `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`);
	return reply.send(csv);
};

export const exportQuotesHandler = async (request: ExportQuotesQuery, reply: FastifyReply) => {
	const service = new QuotesService(request.db, request.cache);
	const filters = {
		companyId: request.query.companyId,
		contactId: request.query.contactId,
		status: request.query.status as any,
		limit: 10000,
		offset: 0
	};

	const result = await service.list(filters);

	const csvData = result.data.map((quote) => ({
		"Quote Number": quote.quoteNumber,
		"Quote Date": exportService.formatDate(quote.quoteDate),
		"Valid Until": exportService.formatDate(quote.validUntil),
		"Company ID": quote.companyId ?? "",
		"Contact ID": quote.contactId ?? "",
		Currency: quote.currency,
		Subtotal: exportService.formatNumber(quote.subtotal),
		Tax: exportService.formatNumber(quote.tax),
		Total: exportService.formatNumber(quote.total),
		Status: quote.status,
		Notes: quote.notes ?? "",
		"Created At": exportService.formatDate(quote.createdAt),
		"Updated At": exportService.formatDate(quote.updatedAt)
	}));

	const csv = exportService.toCSV(csvData);

	reply.header("Content-Type", "text/csv; charset=utf-8");
	reply.header("Content-Disposition", `attachment; filename="quotes-${new Date().toISOString().split("T")[0]}.csv"`);
	return reply.send(csv);
};

export const exportInvoicesHandler = async (request: ExportInvoicesQuery, reply: FastifyReply) => {
	const service = new InvoicesService(request.db, request.cache);
	const filters = {
		customerId: request.query.customerId,
		orderId: request.query.orderId ? Number.parseInt(request.query.orderId, 10) : undefined,
		status: request.query.status as any,
		limit: 10000,
		offset: 0
	};

	const result = await service.list(filters);

	const csvData = result.data.map((invoice) => ({
		"Invoice Number": invoice.invoiceNumber,
		"Invoice Date": exportService.formatDate(invoice.invoiceDate),
		"Due Date": exportService.formatDate(invoice.dueDate),
		"Company ID": invoice.companyId ?? "",
		"Order ID": invoice.orderId?.toString() ?? "",
		Currency: invoice.currency,
		Subtotal: exportService.formatNumber(invoice.subtotal),
		Tax: exportService.formatNumber(invoice.tax),
		Total: exportService.formatNumber(invoice.total),
		Status: invoice.status,
		Notes: invoice.notes ?? "",
		"Created At": exportService.formatDate(invoice.createdAt),
		"Updated At": exportService.formatDate(invoice.updatedAt)
	}));

	const csv = exportService.toCSV(csvData);

	reply.header("Content-Type", "text/csv; charset=utf-8");
	reply.header("Content-Disposition", `attachment; filename="invoices-${new Date().toISOString().split("T")[0]}.csv"`);
	return reply.send(csv);
};

