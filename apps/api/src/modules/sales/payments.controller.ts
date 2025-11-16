import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { PaymentsService } from "./payments.service.js";
import type { PaymentCreateBody, PaymentIdParams } from "./payments.schema.js";
import { PAYMENT_STATUSES, type PaymentStatus } from "@crm/types";
import { eventEmitter } from "../../lib/events/event-emitter.js";
import { invoices } from "../../db/schema/sales.schema.js";
import type { PaymentReceivedEvent } from "../../lib/events/notification-events.js";
import type { AuthenticatedRequest } from "../../types/auth.js";

type ListRequest = FastifyRequest<{
	Querystring: {
		invoiceId?: string;
		status?: string;
		limit?: string;
		offset?: string;
	};
}>;
type GetRequest = FastifyRequest<{ Params: PaymentIdParams }>;
type CreateRequest = FastifyRequest<{ Body: PaymentCreateBody }> &
	AuthenticatedRequest;
type DeleteRequest = FastifyRequest<{ Params: PaymentIdParams }>;

export const listPaymentsHandler = async (
	request: ListRequest,
	reply: FastifyReply,
) => {
	const service = new PaymentsService(request.db);
	const status = normalizePaymentStatus(request.query.status);
	const filters = {
		invoiceId: request.query.invoiceId,
		status,
		limit: request.query.limit ? Number(request.query.limit) : undefined,
		offset: request.query.offset ? Number(request.query.offset) : undefined,
	};

	const result = await service.list(filters);
	await reply.status(200).send({
		data: result.data,
		total: result.total,
		limit: filters.limit ?? 50,
		offset: filters.offset ?? 0,
	});
};

export const getPaymentHandler = async (
	request: GetRequest,
	reply: FastifyReply,
) => {
	const service = new PaymentsService(request.db);
	const payment = await service.getById(request.params.id);

	if (!payment) {
		await reply.status(404).send({
			message: "Payment not found",
		});
		return;
	}

	await reply.status(200).send({ data: payment });
};

export const createPaymentHandler = async (
	request: CreateRequest,
	reply: FastifyReply,
) => {
	const service = new PaymentsService(request.db);
	try {
		const payment = await service.create(request.body);

		// Get user and company ID from request
		const userId =
			request.user?.id ||
			(request.headers["x-user-id"] as string | undefined) ||
			"system";
		const companyId =
			request.user?.companyId ||
			(request.headers["x-company-id"] as string | undefined) ||
			payment.companyId ||
			"";

		// Emit payment received event (notification will be handled by event handler)
		// Fetch customer name from the related invoice for richer notification payload
		const [invoiceRow] = await request.db
			.select({ customerName: invoices.customerName })
			.from(invoices)
			.where(eq(invoices.id, payment.invoiceId))
			.limit(1);

		const paymentReceivedEvent: PaymentReceivedEvent = {
			userId,
			companyId,
			paymentId: payment.id,
			amount: payment.amount ? Number(payment.amount) : 0,
			currency: payment.currency || "USD",
			invoiceId: payment.invoiceId || undefined,
			customerName: invoiceRow?.customerName || undefined,
			timestamp: new Date(),
			metadata: {
				paymentId: payment.id,
				status: payment.status,
			},
		};

		eventEmitter.emit("payment.received", paymentReceivedEvent);

		await reply.status(201).send({ data: payment });
	} catch (error) {
		await reply.status(400).send({
			message:
				error instanceof Error ? error.message : "Failed to create payment",
		});
	}
};

export const deletePaymentHandler = async (
	request: DeleteRequest,
	reply: FastifyReply,
) => {
	const service = new PaymentsService(request.db);
	try {
		await service.delete(request.params.id);
		await reply.status(204).send();
	} catch (error) {
		await reply.status(404).send({
			message: error instanceof Error ? error.message : "Payment not found",
		});
	}
};

const normalizePaymentStatus = (status?: string): PaymentStatus | undefined => {
	if (!status) {
		return undefined;
	}
	return PAYMENT_STATUSES.includes(status as PaymentStatus)
		? (status as PaymentStatus)
		: undefined;
};
