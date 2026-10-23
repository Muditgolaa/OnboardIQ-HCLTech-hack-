// Upload checks from spec FR-2 / section 4: .txt, UTF-8, at most 1 MB, a declared type per file. Text-based PDFs are
// accepted as well (spec bonus): their text layer is extracted and then treated exactly like a .txt document.
// Document text is untrusted data: it is validated as bytes and stored, never interpreted.
import { createHash } from 'node:crypto';
import { unprocessable, type FieldIssue } from '../../http/errors.js';
import { pdfText } from './pdf-text.js';

export const MAX_UPLOAD_BYTES = 1024 * 1024;
export const MIN_FILES_FIRST_UPLOAD = 3;

export interface IncomingFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface CheckedFile {
  text: string;
  bytes: Buffer; // the UTF-8 text bytes that are stored (BOM removed)
  sha256: string; // .txt: hash of the text bytes; .pdf: hash of the uploaded PDF bytes (same file -> same hash)
  format: 'txt' | 'pdf';
  originalSize: number;
  pages?: number;
}

const TEXT_MIME = /^text\/plain(;.*)?$|^application\/octet-stream$/i;
const utf8 = new TextDecoder('utf-8', { fatal: true });

/** Returns the checked file, or the problem (one machine code and a message). */
export function checkTextFile(file: IncomingFile): CheckedFile | { code: string; message: string } {
  if (file.buffer.length > MAX_UPLOAD_BYTES)
    return {
      code: 'FILE_TOO_LARGE',
      message: `File is larger than ${MAX_UPLOAD_BYTES} bytes (1 MB)`,
    };
  if (!/\.txt$/i.test(file.originalname) || !TEXT_MIME.test(file.mimetype))
    return {
      code: 'UNSUPPORTED_FILE_TYPE',
      message: 'Only .txt files and text-based PDFs are accepted',
    };
  if (file.buffer.length === 0) return { code: 'EMPTY_FILE', message: 'File is empty' };
  if (file.buffer.includes(0))
    return { code: 'UNSUPPORTED_FILE_TYPE', message: 'File looks binary (contains NUL bytes)' };
  let text: string;
  try {
    text = utf8.decode(file.buffer); // fatal: invalid UTF-8 throws; a leading BOM is dropped
  } catch {
    return { code: 'INVALID_ENCODING', message: 'File is not valid UTF-8' };
  }
  const bytes = Buffer.from(text, 'utf8');
  return {
    text,
    bytes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    format: 'txt',
    originalSize: bytes.length,
  };
}

const PDF_MIME = /^application\/pdf$|^application\/octet-stream$/i;

/** .txt as above; .pdf: size, type and magic bytes, then the text layer (no OCR: a scan is refused). */
export async function checkFile(
  file: IncomingFile,
): Promise<CheckedFile | { code: string; message: string }> {
  if (!/\.pdf$/i.test(file.originalname)) return checkTextFile(file);
  if (file.buffer.length > MAX_UPLOAD_BYTES)
    return {
      code: 'FILE_TOO_LARGE',
      message: `File is larger than ${MAX_UPLOAD_BYTES} bytes (1 MB)`,
    };
  if (!PDF_MIME.test(file.mimetype))
    return {
      code: 'UNSUPPORTED_FILE_TYPE',
      message: 'Only .txt files and text-based PDFs are accepted',
    };
  if (file.buffer.length === 0) return { code: 'EMPTY_FILE', message: 'File is empty' };
  const result = await pdfText(file.buffer);
  if ('code' in result) return result;
  const bytes = Buffer.from(result.text, 'utf8');
  return {
    text: result.text,
    bytes,
    sha256: createHash('sha256').update(file.buffer).digest('hex'),
    format: 'pdf',
    originalSize: file.buffer.length,
    pages: result.pages,
  };
}

/** Checks every file; any problem becomes one 422 that names each offending file by index. */
export async function checkAll(files: IncomingFile[]): Promise<CheckedFile[]> {
  const checked: CheckedFile[] = [];
  const issues: FieldIssue[] = [];
  let firstCode = '';
  const results = [];
  for (const file of files) results.push(await checkFile(file)); // one PDF at a time: bounded memory and CPU
  results.forEach((result, i) => {
    if ('code' in result) {
      firstCode ||= result.code;
      issues.push({ field: `files[${i}]`, message: `${result.code}: ${result.message}` });
    } else checked.push(result);
  });
  if (issues.length) throw unprocessable(firstCode, 'One or more files were rejected', issues);
  return checked;
}
