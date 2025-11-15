import type { FastifyPluginAsync } from "fastify";
import { createSearchPreValidation } from "../../lib/validation/search";

import {
  createAccountHandler,
  deleteAccountHandler,
  getAccountHandler,
  listContactsHandler,
  listAccountsHandler,
  updateAccountHandler
} from "./accounts.controller";
import {
  createAccountSchema,
  deleteAccountSchema,
  getAccountSchema,
  listContactsSchema,
  listAccountsSchema,
  updateAccountSchema
} from "./accounts.schema";

const accountsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/",
    { schema: listAccountsSchema, preValidation: createSearchPreValidation(255, "search") },
    listAccountsHandler
  );
  app.get("/contacts", { schema: listContactsSchema }, listContactsHandler);
  app.get("/:id", { schema: getAccountSchema }, getAccountHandler);
  app.post("/", { schema: createAccountSchema }, createAccountHandler);
  app.put("/:id", { schema: updateAccountSchema }, updateAccountHandler);
  app.delete("/:id", { schema: deleteAccountSchema }, deleteAccountHandler);
};

export default accountsRoutes;

