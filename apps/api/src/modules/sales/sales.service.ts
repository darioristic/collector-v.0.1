import type { AppDatabase } from "../../db";
import { db as defaultDb } from "../../db";
import { InvoicesService } from "./invoices.service";
import { OrdersService } from "./orders.service";
import { PaymentsService } from "./payments.service";
import { QuotesService } from "./quotes.service";

export class SalesService {
  readonly orders: OrdersService;
  readonly quotes: QuotesService;
  readonly invoices: InvoicesService;
  readonly payments: PaymentsService;

  constructor(private readonly database: AppDatabase = defaultDb) {
    this.orders = new OrdersService(this.database);
    this.quotes = new QuotesService(this.database);
    this.invoices = new InvoicesService(this.database);
    this.payments = new PaymentsService(this.database);
  }
}

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


