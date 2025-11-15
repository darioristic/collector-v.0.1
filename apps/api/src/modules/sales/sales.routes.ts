import type { FastifyPluginAsync } from "fastify";
import { createSearchPreValidation } from "../../lib/validation/search";

import {
  createDealHandler,
  listDealsHandler
} from "./deals.controller";
import {
  createInvoiceHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  updateInvoiceHandler,
  deleteInvoiceHandler
} from "./invoices.controller";
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderHandler,
  deleteOrderHandler
} from "./orders.controller";
import {
  listPaymentsHandler,
  getPaymentHandler,
  createPaymentHandler,
  deletePaymentHandler
} from "./payments.controller";
import {
  listQuotesHandler,
  getQuoteHandler,
  createQuoteHandler,
  updateQuoteHandler,
  deleteQuoteHandler
} from "./quotes.controller";
import {
  exportOrdersHandler,
  exportQuotesHandler,
  exportInvoicesHandler
} from "./export.controller";
import {
  exportInvoicePDFHandler,
  exportQuotePDFHandler
} from "./pdf-export.controller";
import {
  createDealSchema,
  listDealsSchema
} from "./sales.schema";
import {
  listInvoicesSchema,
  getInvoiceSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  deleteInvoiceSchema
} from "./invoices.schema";
import {
  listOrdersSchema,
  getOrderSchema,
  createOrderSchema,
  updateOrderSchema,
  deleteOrderSchema
} from "./orders.schema";
import {
  listPaymentsSchema,
  getPaymentSchema,
  createPaymentSchema,
  deletePaymentSchema
} from "./payments.schema";
import {
  listQuotesSchema,
  getQuoteSchema,
  createQuoteSchema,
  updateQuoteSchema,
  deleteQuoteSchema
} from "./quotes.schema";

const salesRoutes: FastifyPluginAsync = async (app) => {
  // Quote routes
  app.get("/quotes", { schema: listQuotesSchema }, listQuotesHandler);
  app.get("/quotes/:id", { schema: getQuoteSchema }, getQuoteHandler);
  app.post("/quotes", { schema: createQuoteSchema }, createQuoteHandler);
  app.patch("/quotes/:id", { schema: updateQuoteSchema }, updateQuoteHandler);
  app.delete("/quotes/:id", { schema: deleteQuoteSchema }, deleteQuoteHandler);

  // Order routes
  app.get<{
    Querystring: {
      companyId?: string;
      contactId?: string;
      quoteId?: string;
      status?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };
  }>(
    "/orders",
    { schema: listOrdersSchema, preValidation: createSearchPreValidation(255, "search") },
    listOrdersHandler
  );
  app.get<{ Params: { id: string } }>("/orders/:id", { schema: getOrderSchema }, getOrderHandler);
  app.post<{ Body: import("@crm/types").OrderCreateInput }>("/orders", { schema: createOrderSchema }, createOrderHandler);
  app.patch<{ Params: { id: string }; Body: import("@crm/types").OrderUpdateInput }>(
    "/orders/:id",
    { schema: updateOrderSchema },
    updateOrderHandler
  );
  app.delete<{ Params: { id: string } }>("/orders/:id", { schema: deleteOrderSchema }, deleteOrderHandler);

  // Invoice routes
  app.get<{
    Querystring: {
      customerId?: string;
      orderId?: string;
      status?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };
  }>("/invoices", { schema: listInvoicesSchema }, listInvoicesHandler);
  app.get<{ Params: { id: string } }>("/invoices/:id", { schema: getInvoiceSchema }, getInvoiceHandler);
  app.post<{ Body: import("@crm/types").InvoiceCreateInput }>(
    "/invoices",
    { schema: createInvoiceSchema },
    createInvoiceHandler
  );
  app.patch<{ Params: { id: string }; Body: import("@crm/types").InvoiceUpdateInput }>(
    "/invoices/:id",
    { schema: updateInvoiceSchema },
    updateInvoiceHandler
  );
  app.delete<{ Params: { id: string } }>("/invoices/:id", { schema: deleteInvoiceSchema }, deleteInvoiceHandler);

  // Payment routes
  app.get("/payments", { schema: listPaymentsSchema }, listPaymentsHandler);
  app.get("/payments/:id", { schema: getPaymentSchema }, getPaymentHandler);
  app.post("/payments", { schema: createPaymentSchema }, createPaymentHandler);
  app.delete("/payments/:id", { schema: deletePaymentSchema }, deletePaymentHandler);

  // Deal routes
  app.get("/deals", { schema: listDealsSchema }, listDealsHandler);
  app.post("/deals", { schema: createDealSchema }, createDealHandler);

  // Export routes
  app.get("/orders/export", exportOrdersHandler);
  app.get("/quotes/export", exportQuotesHandler);
  app.get("/invoices/export", exportInvoicesHandler);
  
  // PDF Export routes
  app.get("/quotes/:id/pdf", exportQuotePDFHandler);
  app.get("/invoices/:id/pdf", exportInvoicePDFHandler);
};

export default salesRoutes;


