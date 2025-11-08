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
  createDealSchema,
  createInvoiceSchema,
  createOrderSchema,
  listDealsSchema,
  listInvoicesSchema,
  listOrdersSchema
} from "./sales.schema";

const salesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/deals", { schema: listDealsSchema }, listDealsHandler);
  app.post("/deals", { schema: createDealSchema }, createDealHandler);

  app.get("/orders", { schema: listOrdersSchema }, listOrdersHandler);
  app.post("/orders", { schema: createOrderSchema }, createOrderHandler);

  app.get("/invoices", { schema: listInvoicesSchema }, listInvoicesHandler);
  app.post("/invoices", { schema: createInvoiceSchema }, createInvoiceHandler);
};

export default salesRoutes;


