import type { FastifyReply, RouteHandler } from "fastify";

import { createHttpError, type ApiReply } from "../../lib/errors";

import type {
  Account,
  AccountContact,
  AccountCreateInput,
  AccountUpdateInput
} from "./accounts.types";

import type { AccountsRepository } from "./accounts.repository";

declare module "fastify" {
  interface FastifyInstance {
    accountsRepository: AccountsRepository;
  }

  interface FastifyRequest {
    accountsRepository: AccountsRepository;
  }
}

export type ListAccountsReply = Account[];
export type ListContactsReply = AccountContact[];
export type GetAccountParams = { id: string };
export type GetAccountReply = ApiReply<Account>;
export type CreateAccountBody = AccountCreateInput;
export type CreateAccountReply = ApiReply<Account>;
export type UpdateAccountParams = GetAccountParams;
export type UpdateAccountBody = AccountUpdateInput;
export type UpdateAccountReply = ApiReply<Account>;
export type DeleteAccountParams = GetAccountParams;
export type DeleteAccountReply = ApiReply<void>;

export const listAccountsHandler: RouteHandler<{ Reply: ListAccountsReply }> = async (request) => {
  return request.accountsRepository.list();
};

export const listContactsHandler: RouteHandler<{ Reply: ListContactsReply }> = async (request) => {
  return request.accountsRepository.listContacts();
};

export const getAccountHandler: RouteHandler<{
  Params: GetAccountParams;
  Reply: GetAccountReply;
}> = async (request, reply) => {
  const account = await request.accountsRepository.findById(request.params.id);

  if (!account) {
    return reply.status(404).send(createHttpError(404, `Account ${request.params.id} not found`));
  }

  return account;
};

export const createAccountHandler: RouteHandler<{
  Body: CreateAccountBody;
  Reply: CreateAccountReply;
}> = async (request, reply) => {
  const exists = await request.accountsRepository.findByEmail(request.body.email);

  if (exists) {
    return reply
      .status(409)
      .send(
        createHttpError(409, `Account with email ${request.body.email} already exists`, {
          error: "Conflict"
        })
      );
  }

  const account = await request.accountsRepository.create(request.body);

  return reply.status(201).send(account);
};

export const updateAccountHandler: RouteHandler<{
  Params: UpdateAccountParams;
  Body: UpdateAccountBody;
  Reply: UpdateAccountReply;
}> = async (request, reply) => {
  const updatedAccount = await request.accountsRepository.update(request.params.id, request.body);

  if (!updatedAccount) {
    return reply
      .status(404)
      .send(createHttpError(404, `Account ${request.params.id} not found`, { error: "Not Found" }));
  }

  return updatedAccount;
};

export const deleteAccountHandler: RouteHandler<{
  Params: DeleteAccountParams;
  Reply: DeleteAccountReply;
}> = async (request, reply: FastifyReply) => {
  const deleted = await request.accountsRepository.delete(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(createHttpError(404, `Account ${request.params.id} not found`, { error: "Not Found" }));
  }

  return reply.status(204).send();
};

