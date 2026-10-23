// Text layer of an uploaded PDF (bonus idea in the spec: image/PDF upload). pdf.js reads the PDF as data: no script
// runs (pdf.js 6 has no eval path; XFA forms are off), no fonts are loaded, nothing is rendered or executed. A scanned PDF has no text layer; it is refused
// with a clear message, because the configured LLM provider offers no vision/OCR model.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const MAX_PDF_PAGES = 10;
export const PDF_TIMEOUT_MS = 10_000;
const MIN_TEXT_CHARS = 20;

export type PdfTextResult = { text: string; pages: number } | { code: string; message: string };

export async function pdfText(bytes: Buffer): Promise<PdfTextResult> {
  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-')))
    return { code: 'UNSUPPORTED_FILE_TYPE', message: 'File has a .pdf name but is not a PDF' };
  const task = getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    enableXfa: false,
    useWorkerFetch: false,
    useSystemFonts: false,
    stopAtErrors: true,
    verbosity: 0,
  });
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), PDF_TIMEOUT_MS);
  });
  try {
    const doc = await Promise.race([task.promise, timeout]);
    if (doc.numPages > MAX_PDF_PAGES)
      return {
        code: 'PDF_TOO_MANY_PAGES',
        message: `PDF has ${doc.numPages} pages; at most ${MAX_PDF_PAGES} are accepted`,
      };
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await Promise.race([doc.getPage(n), timeout]);
      const content = await Promise.race([page.getTextContent(), timeout]);
      // Keep the reading order and line breaks pdf.js reports, so the extractors see lines as in a .txt file.
      let line = '';
      const lines: string[] = [];
      for (const item of content.items) {
        if (!('str' in item)) continue;
        line += item.str;
        if (item.hasEOL) {
          lines.push(line);
          line = '';
        }
      }
      if (line) lines.push(line);
      pages.push(lines.join('\n'));
    }
    const text = pages
      .join('\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
    if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS)
      return {
        code: 'PDF_NO_TEXT',
        message:
          'This PDF has no readable text (it looks like a scan). Upload a text-based PDF or a .txt file.',
      };
    return { text, pages: doc.numPages };
  } catch (err) {
    if (err instanceof Error && err.message === 'timeout')
      return {
        code: 'PDF_TIMEOUT',
        message: `The PDF could not be read within ${PDF_TIMEOUT_MS / 1000} seconds`,
      };
    if (err instanceof Error && /password/i.test(err.name + err.message))
      return { code: 'PDF_ENCRYPTED', message: 'Password-protected PDFs are not accepted' };
    return { code: 'PDF_UNREADABLE', message: 'The PDF is damaged or not a valid PDF' };
  } finally {
    clearTimeout(timer);
    await task.destroy().catch(() => undefined);
  }
}
