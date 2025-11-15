import type { FastifyPluginAsync } from "fastify";
import type {
  ListAccountsQuery,
  ListAccountsReply,
  ListContactsReply,
  GetAccountParams,
  GetAccountWithDetailsReply,
  CreateAccountBody,
  CreateAccountReply,
  UpdateAccountParams,
  UpdateAccountBody,
  UpdateAccountReply,
  DeleteAccountParams,
  DeleteAccountReply
} from "./accounts.controller";
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
  app.get<{ Querystring: ListAccountsQuery; Reply: ListAccountsReply }>(
    "/",
    { schema: listAccountsSchema, preValidation: createSearchPreValidation(255, "search") },
    listAccountsHandler
  );
  app.get<{ Reply: ListContactsReply }>("/contacts", { schema: listContactsSchema }, listContactsHandler);
  app.get<{ Params: GetAccountParams; Reply: GetAccountWithDetailsReply }>(
    "/:id",
    { schema: getAccountSchema },
    getAccountHandler
  );
  app.post<{ Body: CreateAccountBody; Reply: CreateAccountReply }>(
    "/",
    { schema: createAccountSchema },
    createAccountHandler
  );
  app.put<{ Params: UpdateAccountParams; Body: UpdateAccountBody; Reply: UpdateAccountReply }>(
    "/:id",
    { schema: updateAccountSchema },
    updateAccountHandler
  );
  app.delete<{ Params: DeleteAccountParams; Reply: DeleteAccountReply }>(
    "/:id",
    { schema: deleteAccountSchema },
    deleteAccountHandler
  );
};

export default accountsRoutes;

