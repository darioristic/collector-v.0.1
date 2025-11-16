/**
 * Email service for sending emails
 * Supports multiple providers (Resend, SendGrid, SMTP via nodemailer)
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
}

/**
 * Resend email provider
 */
class ResendProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(options: EmailOptions): Promise<void> {
    const { default: Resend } = await import("resend");
    const resend = new Resend(this.apiKey);

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    for (const recipient of recipients) {
      await resend.emails.send({
        from: options.from || this.fromEmail,
        to: recipient,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      });
    }
  }
}

/**
 * SMTP email provider (via nodemailer)
 */
class SMTPProvider implements EmailProvider {
  private transporter: unknown;
  private fromEmail: string;
  private config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    fromEmail: string;
  }) {
    this.config = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    };
    this.fromEmail = config.fromEmail;
  }

  private async getTransporter(): Promise<{ sendMail: (opts: { from: string; to: string; subject: string; html: string; replyTo?: string }) => Promise<unknown> }> {
    if (!this.transporter) {
      const nodemailer = await import("nodemailer");
      this.transporter = nodemailer.createTransport(this.config);
    }
    return this.transporter as { sendMail: (opts: { from: string; to: string; subject: string; html: string; replyTo?: string }) => Promise<unknown> };
  }

  async send(options: EmailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const transporter = await this.getTransporter();

    for (const recipient of recipients) {
      await transporter.sendMail({
        from: options.from || this.fromEmail,
        to: recipient,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
      });
    }
  }
}

/**
 * Console email provider (for development/testing)
 */
class ConsoleProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    console.log("=".repeat(60));
    console.log("EMAIL (Console Provider)");
    console.log("=".repeat(60));
    console.log("To:", recipients.join(", "));
    console.log("Subject:", options.subject);
    console.log("From:", options.from || "noreply@example.com");
    if (options.replyTo) {
      console.log("Reply-To:", options.replyTo);
    }
    console.log("-".repeat(60));
    console.log("HTML Content:");
    console.log(options.html);
    console.log("=".repeat(60));
  }
}

export class EmailService {
  private provider: EmailProvider;

  constructor() {
    // Determine provider based on environment variables
    const emailProvider = process.env.EMAIL_PROVIDER || "console";
    const fromEmail = process.env.EMAIL_FROM || "noreply@collectorlabs.test";

    switch (emailProvider) {
      case "resend": {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          console.warn("RESEND_API_KEY not set, falling back to console provider");
          this.provider = new ConsoleProvider();
        } else {
          this.provider = new ResendProvider(resendApiKey, fromEmail);
        }
        break;
      }

      case "smtp": {
        const smtpConfig = {
          host: process.env.SMTP_HOST || "localhost",
          port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASS || "",
          },
          fromEmail,
        };
        this.provider = new SMTPProvider(smtpConfig);
        break;
      }

      case "console":
      default: {
        this.provider = new ConsoleProvider();
        break;
      }
    }
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<void> {
    try {
      await this.provider.send(options);
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Send invoice link email
   */
  async sendInvoiceLink(options: {
    to: string | string[];
    invoiceNumber: string;
    invoiceLink: string;
    customerName?: string;
    fromName?: string;
  }): Promise<void> {
    const html = this.generateInvoiceEmailTemplate({
      invoiceNumber: options.invoiceNumber,
      invoiceLink: options.invoiceLink,
      customerName: options.customerName,
      fromName: options.fromName,
    });

    await this.send({
      to: options.to,
      subject: `Invoice ${options.invoiceNumber}`,
      html,
    });
  }

  /**
   * Generate HTML email template for invoice link
   */
  private generateInvoiceEmailTemplate(options: {
    invoiceNumber: string;
    invoiceLink: string;
    customerName?: string;
    fromName?: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${options.invoiceNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Invoice ${options.invoiceNumber}</h1>
    ${options.customerName ? `<p style="margin: 10px 0;"><strong>Dear ${options.customerName},</strong></p>` : ""}
    <p style="margin: 10px 0;">
      Please find your invoice attached. You can view and download it using the link below:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${options.invoiceLink}" 
         style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        View Invoice
      </a>
    </div>
    <p style="margin: 10px 0; color: #666; font-size: 14px;">
      If the button doesn't work, you can copy and paste this link into your browser:<br>
      <a href="${options.invoiceLink}" style="color: #007bff; word-break: break-all;">${options.invoiceLink}</a>
    </p>
  </div>
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
    <p style="margin: 5px 0;">
      ${options.fromName ? `Best regards,<br>${options.fromName}` : "Best regards"}
    </p>
    <p style="margin: 5px 0;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}

export const emailService = new EmailService();

