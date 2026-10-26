'use client';
import { Button, Column, DataColumn, DataTable, Icon, Row, Text } from '@umami/react-zen';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useApi } from '@/components/hooks';
import { Download } from '@/components/icons';

// Hope (hope.arian-shafa.xyz) newsletter subscribers, read from the Hope backend by
// /api/admin/newsletter. Admin only.

interface Subscriber {
  email: string;
  frequency: string;
  categories: string[];
  countries: string[];
  status: string;
  signed_up_at: string;
  confirmed_at: string | null;
  emails_sent: number;
  emails_failed: number;
  last_sent_at: string | null;
}

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

function downloadCsv(rows: Subscriber[]) {
  const header = [
    'email',
    'status',
    'frequency',
    'themes',
    'countries',
    'signed_up_at',
    'confirmed_at',
    'emails_sent',
    'emails_failed',
    'last_sent_at',
  ];
  const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map(r =>
    [
      r.email,
      r.status,
      r.frequency,
      r.categories.join('; '),
      r.countries.join('; '),
      r.signed_up_at,
      r.confirmed_at,
      r.emails_sent,
      r.emails_failed,
      r.last_sent_at,
    ]
      .map(csvCell)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `hope-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <Column gap="1" minWidth="120px">
    <Text size="sm" color="muted">
      {label}
    </Text>
    <Text size="lg" weight="bold">
      {value}
    </Text>
  </Column>
);

export function AdminNewsletterPage() {
  const { get, useQuery } = useApi();
  const { data, error, isLoading } = useQuery<{ configured: boolean; subscribers: Subscriber[] }>({
    queryKey: ['hope-newsletter-subscribers'],
    queryFn: () => get('/admin/newsletter'),
  });

  const subscribers = data?.subscribers ?? [];
  const confirmed = subscribers.filter(s => s.confirmed_at).length;
  const count = (frequency: string) => subscribers.filter(s => s.frequency === frequency).length;

  return (
    <Column gap="6" margin="2">
      <PageHeader
        title="Newsletter"
        description="Subscribers to the Hope newsletter (hope.arian-shafa.xyz)"
      >
        <Button onPress={() => downloadCsv(subscribers)} isDisabled={!subscribers.length}>
          <Icon>
            <Download />
          </Icon>
          <Text>Download CSV</Text>
        </Button>
      </PageHeader>

      {data && !data.configured ? (
        <Panel>
          <Text>
            Not connected yet. Set HOPE_SUPABASE_URL, HOPE_SUPABASE_ANON_KEY and
            HOPE_NEWSLETTER_REPORT_SECRET in this deployment&apos;s environment variables.
          </Text>
        </Panel>
      ) : (
        <>
          <Panel>
            <Row gap="6" wrap="wrap">
              <Stat label="Total" value={subscribers.length} />
              <Stat label="Subscribed" value={confirmed} />
              <Stat label="Pending confirmation" value={subscribers.length - confirmed} />
              <Stat label="Daily" value={count('daily')} />
              <Stat label="Weekly" value={count('weekly')} />
              <Stat label="Monthly" value={count('monthly')} />
            </Row>
          </Panel>
          <Panel>
            <LoadingPanel data={subscribers} error={error} isLoading={isLoading}>
              <DataTable data={subscribers}>
                <DataColumn id="email" label="Email" width="minmax(220px, 2fr)">
                  {(row: Subscriber) => (
                    <Text title={row.email} truncate>
                      {row.email}
                    </Text>
                  )}
                </DataColumn>
                <DataColumn id="status" label="Status" width="150px">
                  {(row: Subscriber) => row.status}
                </DataColumn>
                <DataColumn id="frequency" label="Frequency" width="100px">
                  {(row: Subscriber) => row.frequency}
                </DataColumn>
                <DataColumn
                  id="preferences"
                  label="Themes / countries"
                  width="minmax(160px, 1.5fr)"
                >
                  {(row: Subscriber) => {
                    const prefs = [...row.categories, ...row.countries].join(', ');
                    return (
                      <Text title={prefs} truncate>
                        {prefs || 'Everything'}
                      </Text>
                    );
                  }}
                </DataColumn>
                <DataColumn id="signed_up_at" label="Signed up" width="170px">
                  {(row: Subscriber) => formatDate(row.signed_up_at)}
                </DataColumn>
                <DataColumn id="confirmed_at" label="Confirmed" width="170px">
                  {(row: Subscriber) => formatDate(row.confirmed_at)}
                </DataColumn>
                <DataColumn id="emails_sent" label="Emails sent" width="110px">
                  {(row: Subscriber) =>
                    row.emails_failed
                      ? `${row.emails_sent} (${row.emails_failed} failed)`
                      : row.emails_sent
                  }
                </DataColumn>
                <DataColumn id="last_sent_at" label="Last sent" width="170px">
                  {(row: Subscriber) => formatDate(row.last_sent_at)}
                </DataColumn>
              </DataTable>
            </LoadingPanel>
          </Panel>
        </>
      )}
    </Column>
  );
}
