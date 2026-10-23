import { ApiError } from '@/api/http';

/**
 * One message for a failed action, by HTTP status. The server decides (403 role or maker = checker, 409 wrong state
 * or someone else acted first); this only says it plainly and keeps the server's own explanation.
 */
export function actionMessage(err: unknown): string {
  if (!(err instanceof ApiError))
    return 'Could not reach the server. Check your connection and try again.';
  const detail = err.fields.length
    ? err.fields.map((f) => `${f.field}: ${f.message}`).join('; ')
    : err.message;
  switch (err.status) {
    case 403:
      return `Not allowed (403): ${err.message}`;
    case 404:
      return 'Not found (404): it does not exist, or you are not allowed to see it.';
    case 409:
      return `Conflict (409): ${err.message}. Someone may have acted on this case first; reload to see its current status.`;
    case 429:
      return err.message;
    default:
      return detail;
  }
}
