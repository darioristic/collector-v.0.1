import type { FastifyPluginAsync } from "fastify";

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
  app.get("/orders", { schema: listOrdersSchema }, listOrdersHandler);
  app.get("/orders/:id", { schema: getOrderSchema }, getOrderHandler);
  app.post("/orders", { schema: createOrderSchema }, createOrderHandler);
  app.patch("/orders/:id", { schema: updateOrderSchema }, updateOrderHandler);
  app.delete("/orders/:id", { schema: deleteOrderSchema }, deleteOrderHandler);

  // Invoice routes
  app.get("/invoices", { schema: listInvoicesSchema }, listInvoicesHandler);
  app.get("/invoices/:id", { schema: getInvoiceSchema }, getInvoiceHandler);
  app.post("/invoices", { schema: createInvoiceSchema }, createInvoiceHandler);
  app.patch("/invoices/:id", { schema: updateInvoiceSchema }, updateInvoiceHandler);
  app.delete("/invoices/:id", { schema: deleteInvoiceSchema }, deleteInvoiceHandler);

  // Payment routes
  app.get("/payments", { schema: listPaymentsSchema }, listPaymentsHandler);
  app.get("/payments/:id", { schema: getPaymentSchema }, getPaymentHandler);
  app.post("/payments", { schema: createPaymentSchema }, createPaymentHandler);
  app.delete("/payments/:id", { schema: deletePaymentSchema }, deletePaymentHandler);

  // Deal routes
  app.get("/deals", { schema: listDealsSchema }, listDealsHandler);
  app.post("/deals", { schema: createDealSchema }, createDealHandler);
};

export default salesRoutes;


