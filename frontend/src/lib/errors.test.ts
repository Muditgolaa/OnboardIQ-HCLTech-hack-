import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/http';
import { actionMessage } from './errors';

describe('action error messages', () => {
  it('says 403 and keeps the server reason (for example maker = checker)', () => {
    expect(
      actionMessage(
        new ApiError(403, 'MAKER_CHECKER_SAME_USER', 'The maker cannot check the same case'),
      ),
    ).toBe('Not allowed (403): The maker cannot check the same case');
  });
  it('says 409 and tells the user to reload', () => {
    expect(
      actionMessage(new ApiError(409, 'VERSION_CONFLICT', 'The case was changed by someone else')),
    ).toMatch(/^Conflict \(409\): The case was changed by someone else\. .*reload/);
  });
  it('lists field problems for 400/422 and explains network failures', () => {
    expect(
      actionMessage(
        new ApiError(422, 'PDF_NO_TEXT', 'One or more files were rejected', [
          { field: 'files[0]', message: 'PDF_NO_TEXT: looks like a scan' },
        ]),
      ),
    ).toBe('files[0]: PDF_NO_TEXT: looks like a scan');
    expect(actionMessage(new TypeError('fetch failed'))).toMatch(/Could not reach the server/);
  });
});
