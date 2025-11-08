import type { FastifyPluginAsync } from "fastify";

import { createInMemoryAccountsRepository } from "./accounts.repository";
import accountsRoutes from "./accounts.routes";

const accountsModule: FastifyPluginAsync = async (app) => {
  const repository = createInMemoryAccountsRepository();

  if (!app.hasDecorator("accountsRepository")) {
    app.decorate("accountsRepository", repository);
  }

  if (!app.hasRequestDecorator("accountsRepository")) {
    app.decorateRequest("accountsRepository", { getter: () => repository });
  }

  await app.register(accountsRoutes, { prefix: "/accounts" });
};

export default accountsModule;

