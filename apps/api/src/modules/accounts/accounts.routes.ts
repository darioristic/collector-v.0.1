import type { FastifyPluginAsync } from "fastify";

import {
  createAccountHandler,
  deleteAccountHandler,
  getAccountHandler,
  listAccountsHandler,
  updateAccountHandler
} from "./accounts.controller";
import {
  createAccountSchema,
  deleteAccountSchema,
  getAccountSchema,
  listAccountsSchema,
  updateAccountSchema
} from "./accounts.schema";

const accountsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { schema: listAccountsSchema }, listAccountsHandler);
  app.get("/:id", { schema: getAccountSchema }, getAccountHandler);
  app.post("/", { schema: createAccountSchema }, createAccountHandler);
  app.put("/:id", { schema: updateAccountSchema }, updateAccountHandler);
  app.delete("/:id", { schema: deleteAccountSchema }, deleteAccountHandler);
};

export default accountsRoutes;

