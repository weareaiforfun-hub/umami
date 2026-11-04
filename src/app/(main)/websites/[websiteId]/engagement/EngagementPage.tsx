'use client';
import { Column, DataColumn, DataTable, Grid, Heading, Row, Text } from '@umami/react-zen';
import { WebsiteControls } from '@/app/(main)/websites/[websiteId]/WebsiteControls';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { Panel } from '@/components/common/Panel';
import { useApi, useDateParameters } from '@/components/hooks';
import type { WebsiteEngagement } from '@/queries/sql/getWebsiteEngagement';

// What visitors do beyond page views, from the custom events the arian-shafa.xyz sites send:
// engaged time, scroll depth, clicks, feature use (backend calls), rage clicks and errors.

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const fmtPct = (part: number, whole: number) => (whole ? `${pct(part, whole)}%` : '—');
const fmtTime = (s: number) => {
  if (!s) return '0s';
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return r ? `${m}m ${r}s` : `${m}m`;
};
const BUCKETS = ['<3s', '3-15s', '15-60s', '1-3m', '3-10m', '10m+'];
const MIN_SAMPLE = 5;

// Plain words for the backend calls, so the Features table reads without knowing the code.
const FEATURE_NOTES: Record<string, string> = {
  'auth-signup': 'Someone started using an account: on MuseumHop, starting or joining a night',
  'auth-token': 'Someone signed in, for example with a personal link',
  'auth-otp': 'A sign-in code or link was requested',
  'museumhop-email · status':
    'Silent check when the app opens: is email working? Not a visitor action',
  'museumhop-email · send': 'A visitor emailed themselves their personal link',
  'museumhop-email · recover': 'A visitor asked for a new link by email',
};

const featureName = (feature: string, action?: string) =>
  action ? `${feature} · ${action}` : feature;

const FAILURE_NOTES: Record<number, string> = {
  0: 'The call never finished: the visitor left or lost signal, or a blocker stopped it',
  400: 'The site rejected the request, for example a mistyped email address',
  401: 'The visitor needs to sign in again',
  403: 'The visitor isn’t allowed to do this',
  429: 'Too many tries in a short time',
  500: 'Something broke on the server: worth checking',
  503: 'The service isn’t available or set up',
};

const failureNote = (status: number) =>
  FAILURE_NOTES[status] ??
  (status >= 500 ? 'Something broke on the server' : 'The request was refused');

// A likely cause for the errors seen most often; most come from the visitor's own browser.
function errorNote(message: string) {
  if (/^Script error/i.test(message)) {
    return 'The browser hides the details. It could be an extension or a script from another site';
  }
  if (/__firefox__|DarkReader|ethereum|webkit\.messageHandlers|instagram|fbq/i.test(message)) {
    return 'From the visitor’s browser or an extension, not your site';
  }
  if (/NotFoundError|removeChild|insertBefore/i.test(message)) {
    return 'Possibly page translation clashing with the site';
  }
  return 'Unknown: check it if the count grows';
}

const Stat = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <Column gap="1" minWidth="150px">
    <Text size="sm" color="muted">
      {label}
    </Text>
    <Text size="xl" weight="bold">
      {value}
    </Text>
    {note && (
      <Text size="xs" color="muted">
        {note}
      </Text>
    )}
  </Column>
);

const Bar = ({ value, max }: { value: number; max: number }) => (
  <div
    style={{
      height: 10,
      width: `${max && value ? Math.max(2, (value / max) * 100) : 0}%`,
      background: 'var(--zen-primary)',
      borderRadius: 3,
    }}
  />
);

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <Panel>
    <Column gap="3">
      <Column gap="1">
        <Heading size="lg">{title}</Heading>
        {description && <Text color="muted">{description}</Text>}
      </Column>
      {children}
    </Column>
  </Panel>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <Text color="muted">{children}</Text>
);

const Cell = ({ value }: { value: string }) => (
  <Text title={value} truncate>
    {value || '—'}
  </Text>
);

// Plain-language observations, only where there is enough data to say something.
function getInsights(d: WebsiteEngagement): string[] {
  const out: string[] = [];
  const { summary: s } = d;
  if (!s.visits) return out;

  const quick = d.timeBuckets.find(b => b.bucket === '<3s')?.visits ?? 0;
  out.push(
    `${fmtPct(s.engagedVisits, s.visits)} of visits were engaged (15s+ of active time, a click, or a second page); ${fmtPct(quick, s.visits)} left within 3 seconds.`,
  );

  const sources = d.sources.filter(x => x.visits >= MIN_SAMPLE);
  if (sources.length > 1) {
    const best = [...sources].sort(
      (a, b) => b.engagedVisits / b.visits - a.engagedVisits / a.visits,
    )[0];
    const worst = [...sources].sort(
      (a, b) => a.engagedVisits / a.visits - b.engagedVisits / b.visits,
    )[0];
    if (best.source !== worst.source) {
      out.push(
        `Visitors from ${best.source} engage most (${fmtPct(best.engagedVisits, best.visits)} engaged), those from ${worst.source} least (${fmtPct(worst.engagedVisits, worst.visits)}).`,
      );
    }
  }

  const pages = d.pages.filter(p => p.views >= MIN_SAMPLE);
  if (pages.length > 1) {
    const top = [...pages].sort(
      (a, b) => b.engagedSeconds / b.views - a.engagedSeconds / a.views,
    )[0];
    if (top.engagedSeconds) {
      out.push(
        `${top.path} holds attention best: ${fmtTime(top.engagedSeconds / top.views)} of active time per view.`,
      );
    }
    const skimmed = pages
      .filter(p => p.pageVisits >= MIN_SAMPLE)
      .sort((a, b) => a.deepScrollVisits / a.pageVisits - b.deepScrollVisits / b.pageVisits)[0];
    if (skimmed && pct(skimmed.deepScrollVisits, skimmed.pageVisits) < 30) {
      out.push(
        `Only ${fmtPct(skimmed.deepScrollVisits, skimmed.pageVisits)} of visits to ${skimmed.path} scroll past three quarters of the page; content further down is rarely seen.`,
      );
    }
  }

  const userFeatures = d.features.filter(f => f.uses - f.auto >= 1);
  if (userFeatures.length) {
    const top = userFeatures[0];
    out.push(
      `Most used feature: ${top.feature}${top.action ? ` (${top.action})` : ''}, ${top.uses} time${top.uses === 1 ? '' : 's'} by ${top.visitors} visitor${top.visitors === 1 ? '' : 's'}.`,
    );
    const shaky = d.features.find(f => f.uses >= 3 && f.successes / f.uses < 0.9);
    if (shaky) {
      out.push(
        `${shaky.feature} failed ${shaky.uses - shaky.successes} of ${shaky.uses} times (${fmtPct(shaky.successes, shaky.uses)} success); see Friction below.`,
      );
    }
  }

  if (s.convertedVisits) {
    out.push(`${fmtPct(s.convertedVisits, s.visits)} of visits successfully used a feature.`);
  }
  if (s.returningVisitors && s.visitors >= MIN_SAMPLE) {
    out.push(
      `${fmtPct(s.returningVisitors, s.visitors)} of visitors came back for another visit in this period.`,
    );
  }
  if (s.rageClicks || s.jsErrors) {
    out.push(
      `Friction: ${s.rageClicks} rage click${s.rageClicks === 1 ? '' : 's'} and ${s.jsErrors} front-end error${s.jsErrors === 1 ? '' : 's'}.`,
    );
  }
  return out;
}

export function EngagementPage({ websiteId }: { websiteId: string }) {
  const { get, useQuery } = useApi();
  const { startAt, endAt } = useDateParameters();
  const { data, error, isLoading } = useQuery<WebsiteEngagement>({
    queryKey: ['websites:engagement', { websiteId, startAt, endAt }],
    queryFn: () => get(`/websites/${websiteId}/engagement`, { startAt, endAt }),
    enabled: !!websiteId,
  });

  const s = data?.summary;
  const insights = data ? getInsights(data) : [];
  const bucketMax = Math.max(0, ...(data?.timeBuckets.map(b => b.visits) ?? []));

  return (
    <Column gap="3">
      <WebsiteControls websiteId={websiteId} allowFilter={false} />
      <LoadingPanel data={data} error={error} isLoading={isLoading}>
        {data && s && (
          <Column gap="3">
            <Panel>
              <Row gap="6" wrap="wrap">
                <Stat
                  label="Engaged visits"
                  value={fmtPct(s.engagedVisits, s.visits)}
                  note={`${s.engagedVisits} of ${s.visits} visits stayed 15s+, clicked, or opened a second page`}
                />
                <Stat
                  label="Median active time"
                  value={fmtTime(s.medianEngagedSeconds)}
                  note={`the middle visitor; the average is ${fmtTime(s.avgEngagedSeconds)}, pulled up by a few long visits`}
                />
                <Stat
                  label="Interacted"
                  value={fmtPct(s.interactiveVisits, s.visits)}
                  note="clicked, submitted or used something"
                />
                <Stat
                  label="Read to 75%"
                  value={fmtPct(s.deepScrollVisits, s.visits)}
                  note="scrolled three quarters down; means little for a map app, more for articles"
                />
                <Stat
                  label="Used a feature"
                  value={fmtPct(s.convertedVisits, s.visits)}
                  note="worked, and the visitor started it; silent checks don't count"
                />
                <Stat
                  label="Returning visitors"
                  value={fmtPct(s.returningVisitors, s.visitors)}
                  note={`${s.returningVisitors} of ${s.visitors} came back within the period shown`}
                />
                <Stat
                  label="Friction"
                  value={`${s.rageClicks + s.jsErrors}`}
                  note={`${s.rageClicks} rage click${s.rageClicks === 1 ? '' : 's'}, ${s.jsErrors} error${s.jsErrors === 1 ? '' : 's'}; many are harmless, see Friction below`}
                />
              </Row>
            </Panel>

            <Section title="What stands out">
              {insights.length ? (
                <Column as="ul" gap="2" style={{ paddingLeft: 18, margin: 0 }}>
                  {insights.map(text => (
                    <li key={text}>
                      <Text>{text}</Text>
                    </li>
                  ))}
                </Column>
              ) : (
                <Empty>No engagement data in this period yet.</Empty>
              )}
            </Section>

            <Grid columns={{ base: '1fr', lg: '1fr 1fr' }} gap="3">
              <Section
                title="Active time per visit"
                description="How long people really used the site: only time with the tab open and the visitor scrolling, typing or moving. Under 3 seconds usually means they left straight away, or that their phone didn't report the time."
              >
                <Column gap="2">
                  {BUCKETS.map(bucket => {
                    const visits = data.timeBuckets.find(b => b.bucket === bucket)?.visits ?? 0;
                    return (
                      <Row key={bucket} gap="3" alignItems="center">
                        <Text style={{ width: 60 }}>{bucket}</Text>
                        <div style={{ flex: 1 }}>
                          <Bar value={visits} max={bucketMax} />
                        </div>
                        <Text style={{ width: 90, textAlign: 'right' }}>
                          {visits} ({fmtPct(visits, s.visits)})
                        </Text>
                      </Row>
                    );
                  })}
                </Column>
              </Section>

              <Section
                title="Traffic quality by source"
                description="Where visitors came from, and which sources bring people who stay. Direct means unknown: typed links and often WhatsApp or email. Names like com.reddit.frontpage are phone apps (the Reddit app). Small numbers say little."
              >
                {data.sources.length ? (
                  <DataTable data={data.sources}>
                    <DataColumn id="source" label="Source" width="minmax(120px, 2fr)">
                      {(row: WebsiteEngagement['sources'][number]) => <Cell value={row.source} />}
                    </DataColumn>
                    <DataColumn id="visits" label="Visits" width="70px" align="end" />
                    <DataColumn id="engaged" label="Engaged" width="80px" align="end">
                      {(row: WebsiteEngagement['sources'][number]) =>
                        fmtPct(row.engagedVisits, row.visits)
                      }
                    </DataColumn>
                    <DataColumn id="converted" label="Used feature" width="100px" align="end">
                      {(row: WebsiteEngagement['sources'][number]) =>
                        fmtPct(row.convertedVisits, row.visits)
                      }
                    </DataColumn>
                    <DataColumn id="time" label="Avg active" width="90px" align="end">
                      {(row: WebsiteEngagement['sources'][number]) =>
                        fmtTime(row.avgEngagedSeconds)
                      }
                    </DataColumn>
                  </DataTable>
                ) : (
                  <Empty>No visits in this period.</Empty>
                )}
              </Section>
            </Grid>

            <Section
              title="Pages: attention, not just views"
              description="For each page: active time per view, how many visits scrolled three quarters down, and clicks per view. A one-page app like MuseumHop shows a single row."
            >
              {data.pages.length ? (
                <DataTable data={data.pages}>
                  <DataColumn id="path" label="Page" width="minmax(160px, 3fr)">
                    {(row: WebsiteEngagement['pages'][number]) => <Cell value={row.path} />}
                  </DataColumn>
                  <DataColumn id="views" label="Views" width="70px" align="end" />
                  <DataColumn id="visitors" label="Visitors" width="80px" align="end" />
                  <DataColumn id="time" label="Active / view" width="110px" align="end">
                    {(row: WebsiteEngagement['pages'][number]) =>
                      fmtTime(row.views ? row.engagedSeconds / row.views : 0)
                    }
                  </DataColumn>
                  <DataColumn id="deep" label="Read to 75%" width="100px" align="end">
                    {(row: WebsiteEngagement['pages'][number]) =>
                      fmtPct(row.deepScrollVisits, row.pageVisits)
                    }
                  </DataColumn>
                  <DataColumn id="interactions" label="Clicks / view" width="100px" align="end">
                    {(row: WebsiteEngagement['pages'][number]) =>
                      row.views ? (row.interactions / row.views).toFixed(1) : '—'
                    }
                  </DataColumn>
                </DataTable>
              ) : (
                <Empty>No page views in this period.</Empty>
              )}
            </Section>

            <Section
              title="Features"
              description="Not every feature of the site: only calls to the server, such as sign-ups, emails or AI tools. Things that happen on the visitor's own device (map, routes) are under What people click. Success is the share that worked, Median wait the typical time it took, and Auto how many ran by themselves, without the visitor doing anything."
            >
              {data.features.length ? (
                <DataTable data={data.features}>
                  <DataColumn id="feature" label="Feature" width="minmax(160px, 2fr)">
                    {(row: WebsiteEngagement['features'][number]) => (
                      <Cell value={featureName(row.feature, row.action)} />
                    )}
                  </DataColumn>
                  <DataColumn id="meaning" label="What it is" width="minmax(200px, 3fr)">
                    {(row: WebsiteEngagement['features'][number]) => (
                      <Cell value={FEATURE_NOTES[featureName(row.feature, row.action)] ?? ''} />
                    )}
                  </DataColumn>
                  <DataColumn id="uses" label="Uses" width="70px" align="end" />
                  <DataColumn id="visitors" label="Visitors" width="80px" align="end" />
                  <DataColumn id="success" label="Success" width="80px" align="end">
                    {(row: WebsiteEngagement['features'][number]) =>
                      fmtPct(row.successes, row.uses)
                    }
                  </DataColumn>
                  <DataColumn id="seconds" label="Median wait" width="100px" align="end">
                    {(row: WebsiteEngagement['features'][number]) =>
                      `${row.medianSeconds.toFixed(1)}s`
                    }
                  </DataColumn>
                  <DataColumn id="auto" label="Auto" width="60px" align="end" />
                </DataTable>
              ) : (
                <Empty>No feature use recorded in this period.</Empty>
              )}
            </Section>

            <Section
              title="What people click"
              description="What people did. Label is the button or link; Event is the kind of action: button-click, outbound-click (a link to another site), view (a tab), panel (a side panel) or a named action such as details-open or stop-add. Count is the total, Visitors how many people did it."
            >
              {data.clicks.length ? (
                <DataTable data={data.clicks}>
                  <DataColumn id="label" label="Label" width="minmax(160px, 3fr)">
                    {(row: WebsiteEngagement['clicks'][number]) => <Cell value={row.label} />}
                  </DataColumn>
                  <DataColumn id="event" label="Event" width="minmax(110px, 1fr)">
                    {(row: WebsiteEngagement['clicks'][number]) => <Cell value={row.event} />}
                  </DataColumn>
                  <DataColumn id="total" label="Count" width="70px" align="end" />
                  <DataColumn id="visitors" label="Visitors" width="80px" align="end" />
                </DataTable>
              ) : (
                <Empty>No clicks recorded in this period.</Empty>
              )}
            </Section>

            <Section
              title="Friction"
              description="Possible annoyances, not all real problems. Rage clicks are three or more clicks on the same thing within a second: on a Next button that's usually just fast tapping, on anything else it can mean the button seemed not to work. Errors are things that went wrong in the visitor's browser; many come from their extensions. Failed features are server calls that didn't work."
            >
              {data.rage.length + data.errors.length + data.failures.length === 0 ? (
                <Empty>No friction recorded in this period.</Empty>
              ) : (
                <Column gap="4">
                  {data.rage.length > 0 && (
                    <DataTable data={data.rage}>
                      <DataColumn id="label" label="Rage-clicked" width="minmax(160px, 2fr)">
                        {(row: WebsiteEngagement['rage'][number]) => <Cell value={row.label} />}
                      </DataColumn>
                      <DataColumn id="path" label="Page" width="minmax(120px, 1fr)">
                        {(row: WebsiteEngagement['rage'][number]) => <Cell value={row.path} />}
                      </DataColumn>
                      <DataColumn id="total" label="Count" width="70px" align="end" />
                    </DataTable>
                  )}
                  {data.errors.length > 0 && (
                    <DataTable data={data.errors}>
                      <DataColumn id="message" label="Error" width="minmax(200px, 3fr)">
                        {(row: WebsiteEngagement['errors'][number]) => <Cell value={row.message} />}
                      </DataColumn>
                      <DataColumn id="cause" label="Likely cause" width="minmax(200px, 3fr)">
                        {(row: WebsiteEngagement['errors'][number]) => (
                          <Cell value={errorNote(row.message)} />
                        )}
                      </DataColumn>
                      <DataColumn id="path" label="Page" width="minmax(120px, 1fr)">
                        {(row: WebsiteEngagement['errors'][number]) => <Cell value={row.path} />}
                      </DataColumn>
                      <DataColumn id="total" label="Count" width="70px" align="end" />
                    </DataTable>
                  )}
                  {data.failures.length > 0 && (
                    <DataTable data={data.failures}>
                      <DataColumn id="feature" label="Failed feature" width="minmax(160px, 2fr)">
                        {(row: WebsiteEngagement['failures'][number]) => (
                          <Cell value={featureName(row.feature, row.action)} />
                        )}
                      </DataColumn>
                      <DataColumn id="cause" label="What it means" width="minmax(200px, 3fr)">
                        {(row: WebsiteEngagement['failures'][number]) => (
                          <Cell value={failureNote(row.status)} />
                        )}
                      </DataColumn>
                      <DataColumn id="status" label="Status" width="80px" align="end">
                        {(row: WebsiteEngagement['failures'][number]) =>
                          row.status ? row.status : 'network'
                        }
                      </DataColumn>
                      <DataColumn id="total" label="Count" width="70px" align="end" />
                    </DataTable>
                  )}
                </Column>
              )}
            </Section>
          </Column>
        )}
      </LoadingPanel>
    </Column>
  );
}
