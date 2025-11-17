/**
 * PDF rendering service using @react-pdf/renderer
 * Similar to react-email concept - using React components to generate PDFs
 */

import { renderToStream, Font } from "@react-pdf/renderer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
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
  try {
    const currentDir = path.dirname(fileURLToPath(new URL(import.meta.url)));
    const appsDir = path.resolve(currentDir, "../../../../");
    const fontBase = path.join(
      appsDir,
      "dashboard/public/geist-font-1.5.1/fonts/Geist/ttf"
    );
    const regular = path.join(fontBase, "Geist-Regular.ttf");
    const medium = path.join(fontBase, "Geist-Medium.ttf");
    const bold = path.join(fontBase, "Geist-Bold.ttf");
    if (fs.existsSync(regular)) {
      Font.register({
        family: "Geist",
        fonts: [
          { src: regular, fontWeight: 400 },
          ...(fs.existsSync(medium) ? [{ src: medium, fontWeight: 500 }] : []),
          ...(fs.existsSync(bold) ? [{ src: bold, fontWeight: 700 }] : []),
        ],
      });
    }
  } catch {
    void 0;
  }
  const document = <InvoiceTemplate {...props} />;
  return (await renderToStream(document)) as unknown as ReadableStream<Uint8Array>;
}

/**
 * Export InvoiceTemplate component for use in API endpoints
 */
export { InvoiceTemplate } from "./template";
