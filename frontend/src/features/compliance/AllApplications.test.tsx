import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderAppAs } from '@/test/render';

const item = (
  id: string,
  name: string,
  status: string,
  decision: string | null,
  codes: string[],
) => ({
  application_id: id,
  application_date: '2026-10-23',
  status,
  full_name: name,
  pan_masked: 'ZZKXXXXX4Q',
  occupation_code: 'STUDENT',
  created_at: '2026-10-23T00:00:00Z',
  resubmission_deadline: null,
  decision,
  risk_category: null,
  reason_codes: codes,
  waiting_since: '2026-10-23T00:00:00Z',
});
const LIST = {
  'GET /api/v1/admin/applications': {
    body: {
      applications: [
        item('A4211544', 'mudit gola', 'AUTO_REJECTED', 'REJECT', ['PAN_INVALID']),
        item('A2000004', 'Ravi Kumar Sharma', 'IN_REVIEW', 'REVIEW', ['NAME_MISMATCH_MINOR']),
      ],
    },
  },
};

describe('all applications (compliance officer)', () => {
  it('finds an auto-rejected application that no officer queue shows, and links to its case', async () => {
    renderAppAs('COMPLIANCE_OFFICER', '/all-applications', LIST);
    await userEvent.type(await screen.findByLabelText('Search applications'), 'mudi');
    const link = screen.getByRole('link', { name: 'A4211544' });
    expect(link).toHaveAttribute('href', '/cases/A4211544');
    const row = link.closest('tr') as HTMLElement;
    expect(within(row).getByText('Rejected (by rules)')).toBeInTheDocument();
    expect(within(row).getByText('Pan invalid')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'A2000004' })).not.toBeInTheDocument();
  });

  it('is in the compliance menu and not available to a KYC officer', async () => {
    renderAppAs('KYC_OFFICER', '/all-applications', {});
    expect(await screen.findByText('This page is not for your role')).toBeInTheDocument();
  });
});
