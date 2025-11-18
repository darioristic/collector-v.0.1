"use server";

import { authActionClient } from "@/actions/safe-action";
import { resend } from "@/utils/resend";
import { UTCDate } from "@date-fns/utc";
import { getAppUrl } from "@/lib/envs";
// TODO: Implement InvoiceReminderEmail component
import { render } from "@react-email/render";
import { nanoid } from "nanoid";
import { z } from "zod";

export const sendReminderAction = authActionClient
  .metadata({
    name: "send-reminder",
  })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput: { id }, ctx: { supabase, user } }) => {
    const { email, name } = user.team;

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, token, invoice_number, customer:customer_id(name, email)")
      .eq("id", id)
      .single();

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // TODO: Implement InvoiceReminderEmail component
    // await resend.emails.send({
    //   from: "Midday <middaybot@midday.ai>",
    //   to: invoice.customer.email,
    //   reply_to: email,
    //   subject: `Reminder: Payment for ${invoice.invoice_number}`,
    //   headers: {
    //     "X-Entity-Ref-ID": nanoid(),
    //   },
    //   html: await render(
    //     InvoiceReminderEmail({
    //       companyName: invoice.customer.name,
    //       teamName: name,
    //       invoiceNumber: invoice.invoice_number,
    //       link: `${getAppUrl()}/i/${invoice.token}`,
    //     }),
    //   ),
    // });

    const { data } = await supabase
      .from("invoices")
      .update({ reminder_sent_at: new UTCDate().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    return data;
  });
