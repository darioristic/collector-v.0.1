import type { FastifyReply, RouteHandler } from "fastify";

import { createHttpError, type ApiReply } from "../../lib/errors";

import type {
  Account,
  AccountContact,
  AccountCreateInput,
  AccountUpdateInput
} from "./accounts.types";

import type { AccountsRepository, AccountWithDetails } from "./accounts.repository";

declare module "fastify" {
  interface FastifyInstance {
    accountsRepository: AccountsRepository;
  }

  interface FastifyRequest {
    accountsRepository: AccountsRepository;
  }
}

export type ListAccountsQuery = {
  search?: string;
};

export type ListAccountsReply = Account[];
export type ListContactsReply = AccountContact[];
export type GetAccountParams = { id: string };
export type GetAccountReply = ApiReply<Account>;
export type GetAccountWithDetailsReply = ApiReply<AccountWithDetails>;
export type CreateAccountBody = AccountCreateInput;
export type CreateAccountReply = ApiReply<Account>;
export type UpdateAccountParams = GetAccountParams;
export type UpdateAccountBody = AccountUpdateInput;
export type UpdateAccountReply = ApiReply<Account>;
export type DeleteAccountParams = GetAccountParams;
export type DeleteAccountReply = ApiReply<void>;

/**
 * Handler za listanje svih naloga.
 * 
 * @route GET /api/accounts
 * @param request.query.search - Opcioni search string za filtriranje po imenu ili email-u
 * @returns Lista svih naloga sortiranih po datumu kreiranja (filtrirana po search-u ako je prosleđen)
 */
export const listAccountsHandler: RouteHandler<{
  Querystring: ListAccountsQuery;
  Reply: ListAccountsReply;
}> = async (request) => {
  return request.accountsRepository.list(request.query.search);
};

/**
 * Handler za listanje svih kontakata.
 * 
 * @route GET /api/accounts/contacts
 * @returns Lista svih kontakata sa informacijama o nalozima
 */
export const listContactsHandler: RouteHandler<{ Reply: ListContactsReply }> = async (request) => {
  return request.accountsRepository.listContacts();
};

/**
 * Handler za dobijanje naloga po ID-u.
 * 
 * @route GET /api/accounts/:id
 * @param request.params.id - UUID naloga
 * @returns Detalji naloga ili 404 ako nije pronađen
 */
export const getAccountHandler: RouteHandler<{
  Params: GetAccountParams;
  Reply: GetAccountWithDetailsReply;
}> = async (request, reply) => {
  const accountWithDetails = await request.accountsRepository.findByIdWithDetails(request.params.id);

  if (!accountWithDetails) {
    return reply.status(404).send(createHttpError(404, `Account ${request.params.id} not found`));
  }

  return accountWithDetails;
};

/**
 * Helper funkcija za detekciju PostgreSQL unique constraint grešaka
 */
const isUniqueConstraintError = (error: unknown): boolean => {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    "code" in (error as Record<string, unknown>) &&
    (error as { code: string }).code === "23505"
  );
};

/**
 * Helper funkcija za detekciju da li greška je o postojanju email-a
 */
const isEmailExistsError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.includes("email") && error.message.includes("already exists");
};

/**
 * Handler za kreiranje novog naloga.
 * 
 * @route POST /api/accounts
 * @param request.body - Podaci za kreiranje naloga
 * @returns Kreirani nalog ili 409 ako nalog sa istim email-om već postoji
 */
export const createAccountHandler: RouteHandler<{
  Body: CreateAccountBody;
  Reply: CreateAccountReply;
}> = async (request, reply) => {
  try {
    // Provera da li email već postoji (optimizacija da izbegnemo DB constraint error)
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
  } catch (error) {
    // Hvatanje unique constraint grešaka iz repository-ja
    if (isUniqueConstraintError(error) || isEmailExistsError(error)) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Account with email ${request.body.email} already exists`;

      return reply.status(409).send(
        createHttpError(409, errorMessage, {
          error: "Conflict"
        })
      );
    }

    // Re-throw za error handler plugin
    throw error;
  }
};

/**
 * Handler za ažuriranje postojećeg naloga.
 * 
 * @route PUT /api/accounts/:id
 * @param request.params.id - UUID naloga
 * @param request.body - Podaci za ažuriranje (parcijalni)
 * @returns Ažurirani nalog ili 404 ako nije pronađen
 */
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

/**
 * Handler za brisanje naloga.
 * 
 * @route DELETE /api/accounts/:id
 * @param request.params.id - UUID naloga
 * @returns 204 No Content ako je uspešno obrisan ili 404 ako nije pronađen
 */
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

