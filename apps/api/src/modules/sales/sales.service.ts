import type { AppDatabase } from "../../db/index.js";
import { db as defaultDb } from "../../db/index.js";
import { InvoicesService } from "./invoices.service";
import { OrdersService } from "./orders.service";
import { PaymentsService } from "./payments.service";
import { QuotesService } from "./quotes.service";

/**
 * Centralni servis za upravljanje prodajnim procesima.
 * 
 * Omogućava pristup svim prodajnim modulima:
 * - Orders (Porudžbine)
 * - Quotes (Ponude)
 * - Invoices (Fakture)
 * - Payments (Plaćanja)
 * 
 * @example
 * ```typescript
 * const salesService = new SalesService(db);
 * const orders = await salesService.orders.list();
 * const quotes = await salesService.quotes.list();
 * ```
 */
export class SalesService {
  /** Servis za upravljanje porudžbinama */
  readonly orders: OrdersService;
  /** Servis za upravljanje ponudama */
  readonly quotes: QuotesService;
  /** Servis za upravljanje fakturama */
  readonly invoices: InvoicesService;
  /** Servis za upravljanje plaćanjima */
  readonly payments: PaymentsService;

  /**
   * Kreira novu instancu SalesService-a.
   * 
   * @param database - Drizzle database instanca (podrazumevano: globalna db)
   */
  constructor(private readonly database: AppDatabase = defaultDb) {
    this.orders = new OrdersService(this.database);
    this.quotes = new QuotesService(this.database);
    this.invoices = new InvoicesService(this.database);
    this.payments = new PaymentsService(this.database);
  }
}

/**
 * Factory funkcija za kreiranje SalesService instance.
 * 
 * @param database - Opciona database instanca (podrazumevano: globalna db)
 * @returns Nova SalesService instanca
 */
export const createSalesService = (database: AppDatabase = defaultDb): SalesService => {
  return new SalesService(database);
};

declare module "fastify" {
  interface FastifyInstance {
    salesService: SalesService;
  }

  interface FastifyRequest {
    salesService: SalesService;
  }
}


