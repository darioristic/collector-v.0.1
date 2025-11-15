/**
 * PDF rendering service using @react-pdf/renderer
 * Similar to react-email concept - using React components to generate PDFs
 */

import { renderToStream } from "@react-pdf/renderer";
import type { InvoicePDFProps } from "./types";
import { InvoiceTemplate } from "./template";

/**
 * Render invoice to PDF stream
 * @param props Invoice data and template configuration
 * @returns Readable stream of PDF data
 */
export async function renderInvoiceToStream(
  props: InvoicePDFProps
): Promise<ReadableStream<Uint8Array>> {
  const document = <InvoiceTemplate {...props} />;
  return await renderToStream(document);
}

/**
 * Export InvoiceTemplate component for use in API endpoints
 */
export { InvoiceTemplate } from "./template";

