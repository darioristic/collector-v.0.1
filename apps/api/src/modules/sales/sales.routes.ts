import type { FastifyPluginAsync } from "fastify";

import {
  createDealHandler,
  listDealsHandler
} from "./deals.controller";
import {
  createInvoiceHandler,
  listInvoicesHandler
} from "./invoices.controller";
import {
  createOrderHandler,
  listOrdersHandler
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
  createDealSchema,
  createInvoiceSchema,
  createOrderSchema,
  listDealsSchema,
  listInvoicesSchema,
  listOrdersSchema
} from "./sales.schema";
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

  app.get("/deals", { schema: listDealsSchema }, listDealsHandler);
  app.post("/deals", { schema: createDealSchema }, createDealHandler);

  app.get("/orders", { schema: listOrdersSchema }, listOrdersHandler);
  app.post("/orders", { schema: createOrderSchema }, createOrderHandler);

  app.get("/invoices", { schema: listInvoicesSchema }, listInvoicesHandler);
  app.post("/invoices", { schema: createInvoiceSchema }, createInvoiceHandler);

  // Payment routes
  app.get("/payments", { schema: listPaymentsSchema }, listPaymentsHandler);
  app.get("/payments/:id", { schema: getPaymentSchema }, getPaymentHandler);
  app.post("/payments", { schema: createPaymentSchema }, createPaymentHandler);
  app.delete("/payments/:id", { schema: deletePaymentSchema }, deletePaymentHandler);
};

export default salesRoutes;


