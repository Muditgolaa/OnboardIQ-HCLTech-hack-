import { Link } from 'react-router';
import { listAllApplications } from '@/api/client';
import { STATUSES, type QueueItem } from '@/api/types';
import { DataTable, type Column } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { DecisionBadge, RiskBadge, StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState, LoadingState } from '@/components/common/States';
import { useAsync } from '@/hooks/useAsync';
import { formatDate, formatDateTime, humanize } from '@/lib/format';
import { STATUS_META } from '@/lib/status';

/**
 * Every application, whatever its status. KYC Officers only see their review queue; a Compliance Officer can find
 * any case here, including final ones (auto-approved, auto-rejected), and open its full case view and audit trail.
 */
export function AllApplications() {
  const list = useAsync(() => listAllApplications(), []);
  const columns: Column<QueueItem>[] = [
    {
      id: 'id',
      header: 'Case',
      accessor: (a) => a.application_id,
      sortable: true,
      cell: (a) => (
        <Link
          className="font-medium text-forest underline-offset-2 hover:underline"
          to={`/cases/${a.application_id}`}
        >
          {a.application_id}
        </Link>
      ),
    },
    {
      id: 'name',
      header: 'Applicant',
      accessor: (a) => a.full_name,
      sortable: true,
      cell: (a) => (
        <span>
          {a.full_name}
          <span className="block text-xs text-ink-soft">PAN {a.pan_masked}</span>
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (a) => a.status,
      sortable: true,
      cell: (a) => <StatusBadge status={a.status} />,
    },
    {
      id: 'decision',
      header: 'Rules result',
      accessor: (a) => a.decision,
      sortable: true,
      cell: (a) => <DecisionBadge decision={a.decision} />,
    },
    {
      id: 'risk',
      header: 'Risk',
      accessor: (a) => a.risk_category,
      sortable: true,
      cell: (a) => <RiskBadge risk={a.risk_category} />,
    },
    {
      id: 'reasons',
      header: 'Reasons',
      accessor: (a) => a.reason_codes.join(' '),
      cell: (a) =>
        a.reason_codes.length ? (
          <ul className="grid gap-0.5 text-xs">
            {a.reason_codes.map((c) => (
              <li key={c}>{humanize(c)}</li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-ink-soft">-</span>
        ),
    },
    {
      id: 'since',
      header: 'In this status since',
      accessor: (a) => a.waiting_since,
      sortable: true,
      cell: (a) => (
        <span className="tabular whitespace-nowrap">{formatDateTime(a.waiting_since)}</span>
      ),
    },
    {
      id: 'applied',
      header: 'Applied',
      accessor: (a) => a.application_date,
      sortable: true,
      cell: (a) => <span className="whitespace-nowrap">{formatDate(a.application_date)}</span>,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Compliance officer"
        title="All applications"
        description="Every application and where it is now. Open a case for its documents, rule results, history and audit trail."
      />
      {list.status === 'loading' && <LoadingState label="Loading applications" />}
      {list.status === 'error' && <ErrorState error={list.error} onRetry={list.reload} />}
      {list.status === 'success' && (
        <DataTable
          rows={list.data.applications}
          columns={columns}
          getRowId={(a) => a.application_id}
          caption="All applications"
          searchLabel="Search applications"
          searchPlaceholder="Case, name, masked PAN or reason"
          searchText={(a) =>
            `${a.application_id} ${a.full_name} ${a.pan_masked} ${a.reason_codes.join(' ')} ${humanize(a.reason_codes.join(' '))}`
          }
          pageSizes={[25, 50, 100]}
          initialSort={{ column: 'since', direction: 'desc' }}
          emptyTitle="No applications yet"
          filters={[
            {
              id: 'status',
              label: 'Status',
              options: STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })),
              match: (a, v) => a.status === v,
            },
            {
              id: 'decision',
              label: 'Rules result',
              options: [
                { value: 'APPROVE', label: 'Approve' },
                { value: 'REVIEW', label: 'Review' },
                { value: 'REJECT', label: 'Reject' },
              ],
              match: (a, v) => a.decision === v,
            },
            {
              id: 'risk',
              label: 'Risk',
              options: [
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LOW', label: 'Low' },
              ],
              match: (a, v) => a.risk_category === v,
            },
          ]}
        />
      )}
    </>
  );
}
