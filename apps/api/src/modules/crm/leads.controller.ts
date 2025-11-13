import type { RouteHandler } from "fastify";

import { createHttpError, type ApiDataReply } from "../../lib/errors";

import type { Lead, LeadCreateInput, LeadStatus, LeadUpdateInput } from "@crm/types";

export type ListLeadsQuery = {
  status?: LeadStatus;
  source?: string;
  q?: string;
  limit?: number;
  offset?: number;
};
type SqliteErrorLike = { code?: string };

export type ListLeadsReply = ApiDataReply<Lead[]>;
export type GetLeadParams = { id: string };
export type GetLeadReply = ApiDataReply<Lead>;
export type CreateLeadBody = LeadCreateInput;
export type CreateLeadReply = ApiDataReply<Lead>;
export type UpdateLeadParams = GetLeadParams;
export type UpdateLeadBody = LeadUpdateInput;
export type UpdateLeadReply = ApiDataReply<Lead>;
export type DeleteLeadParams = GetLeadParams;

const isUniqueConstraintError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as SqliteErrorLike).code === "SQLITE_CONSTRAINT_UNIQUE";

/**
 * Handler za listanje leadova sa filtriranjem i paginacijom.
 * 
 * @route GET /api/crm/leads
 * @param request.query - Query parametri za filtriranje (status, source, q, limit, offset)
 * @returns Lista leadova sa filtriranjem i paginacijom
 */
export const listLeads: RouteHandler<{ Querystring: ListLeadsQuery; Reply: ListLeadsReply }> = async (
  request
) => {
  const leads = await request.crmService.listLeads();

  const filtered = leads.filter((lead) => {
    if (request.query.status && lead.status !== request.query.status) {
      return false;
    }

    if (request.query.source) {
      const sourceMatch = lead.source.toLowerCase().includes(request.query.source.toLowerCase());

      if (!sourceMatch) {
        return false;
      }
    }

    if (request.query.q) {
      const query = request.query.q.toLowerCase();
      const matchesSearch =
        lead.name.toLowerCase().includes(query) || lead.email.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });

  const offset = request.query.offset ?? 0;
  const limit = request.query.limit ?? filtered.length;
  const sliced = filtered.slice(offset, offset + limit);

  return { data: sliced };
};

/**
 * Handler za dobijanje leada po ID-u.
 * 
 * @route GET /api/crm/leads/:id
 * @param request.params.id - UUID leada
 * @returns Detalji leada ili 404 ako nije pronađen
 */
export const getLead: RouteHandler<{ Params: GetLeadParams; Reply: GetLeadReply }> = async (
  request,
  reply
) => {
  const lead = await request.crmService.getLead(request.params.id);

  if (!lead) {
    return reply
      .status(404)
      .send(createHttpError(404, `Lead ${request.params.id} not found`, { error: "Not Found" }));
  }

  return { data: lead };
};

/**
 * Handler za kreiranje novog leada.
 * 
 * @route POST /api/crm/leads
 * @param request.body - Podaci za kreiranje leada
 * @returns Kreirani lead ili 409 ako lead sa istim email-om već postoji
 */
export const createLead: RouteHandler<{ Body: CreateLeadBody; Reply: CreateLeadReply }> = async (
  request,
  reply
) => {
  try {
    const lead = await request.crmService.createLead(request.body);
    return reply.code(201).send({ data: lead });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return reply
        .status(409)
        .send(
          createHttpError(409, `Lead with email ${request.body.email} already exists`, {
            error: "Conflict"
          })
        );
    }

    throw error;
  }
};

/**
 * Handler za ažuriranje postojećeg leada.
 * 
 * @route PUT /api/crm/leads/:id
 * @param request.params.id - UUID leada
 * @param request.body - Podaci za ažuriranje (parcijalni)
 * @returns Ažurirani lead ili 404 ako nije pronađen
 */
export const updateLead: RouteHandler<{
  Params: UpdateLeadParams;
  Body: UpdateLeadBody;
  Reply: UpdateLeadReply;
}> = async (request, reply) => {
  try {
    const updated = await request.crmService.updateLead(request.params.id, request.body);

    if (!updated) {
      return reply
        .status(404)
        .send(createHttpError(404, `Lead ${request.params.id} not found`, { error: "Not Found" }));
    }

    return { data: updated };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return reply
        .status(409)
        .send(
          createHttpError(409, `Lead with email ${request.body.email} already exists`, {
            error: "Conflict"
          })
        );
    }

    throw error;
  }
};

/**
 * Handler za brisanje leada.
 * 
 * @route DELETE /api/crm/leads/:id
 * @param request.params.id - UUID leada
 * @returns 204 No Content ako je uspešno obrisan ili 404 ako nije pronađen
 */
export const deleteLead: RouteHandler<{ Params: DeleteLeadParams }> = async (request, reply) => {
  const deleted = await request.crmService.deleteLead(request.params.id);

  if (!deleted) {
    return reply
      .status(404)
      .send(createHttpError(404, `Lead ${request.params.id} not found`, { error: "Not Found" }));
  }

  return reply.status(204).send();
};

