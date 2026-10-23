// Upload checks from spec FR-2 / section 4: .txt, UTF-8, at most 1 MB, a declared type per file.
// Document text is untrusted data: it is validated as bytes and stored, never interpreted.
import { createHash } from 'node:crypto';
import { unprocessable, type FieldIssue } from '../../http/errors.js';

export const MAX_UPLOAD_BYTES = 1024 * 1024;
export const MIN_FILES_FIRST_UPLOAD = 3;

export interface IncomingFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface CheckedFile {
  text: string;
  bytes: Buffer; // the UTF-8 bytes that are stored and hashed (BOM removed)
  sha256: string;
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
    return { code: 'UNSUPPORTED_FILE_TYPE', message: 'Only plain-text .txt files are accepted' };
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
  return { text, bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
}

/** Checks every file; any problem becomes one 422 that names each offending file by index. */
export function checkAll(files: IncomingFile[]): CheckedFile[] {
  const checked: CheckedFile[] = [];
  const issues: FieldIssue[] = [];
  let firstCode = '';
  files.forEach((file, i) => {
    const result = checkTextFile(file);
    if ('code' in result) {
      firstCode ||= result.code;
      issues.push({ field: `files[${i}]`, message: `${result.code}: ${result.message}` });
    } else checked.push(result);
  });
  if (issues.length) throw unprocessable(firstCode, 'One or more files were rejected', issues);
  return checked;
}
