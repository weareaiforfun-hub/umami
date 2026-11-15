'use client';
import { Button, Column, Grid, Heading, Row, Text } from '@umami/react-zen';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Favicon } from '@/components/common/Favicon';
import Link from '@/components/common/Link';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useApi, useNavigation } from '@/components/hooks';
import { getTimezone } from '@/lib/date';
import type { SiteOverview, SitesOverview, SiteTotals } from '@/queries/sql/getSitesOverview';
import styles from './OverviewPage.module.css';

// Every website on one screen: who got visitors, how many, and how that compares with the period
// before. Data from /api/overview (getSitesOverview). Everything sorts by clicking a column.

type N = number;
interface Data extends SitesOverview {
  days: N;
  startAt: N;
  endAt: N;
}

const PERIODS: { days: N; label: string; prev: string }[] = [
  { days: 1, label: '24 hours', prev: 'the 24 hours before' },
  { days: 7, label: '7 days', prev: 'the 7 days before' },
  { days: 30, label: '30 days', prev: 'the 30 days before' },
  { days: 90, label: '90 days', prev: 'the 90 days before' },
  { days: 365, label: '12 months', prev: 'the 12 months before' },
];

const STORAGE_KEY = 'umami.overview.days';

const fmt = (n: N) => n.toLocaleString();
const fmtTime = (s: N) =>
  !s || !Number.isFinite(s)
    ? '0s'
    : s < 60
      ? `${Math.round(s)}s`
      : `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`;
const pct = (n: N) => `${Math.round(n * 100)}%`;
const share = (part: N, whole: N) =>
  !whole || !part ? '' : part / whole < 0.005 ? '<1%' : pct(part / whole);
const people = (n: N) => `${n.toLocaleString()} ${n === 1 ? 'visitor' : 'visitors'}`;
const ratio = (a: N, b: N) => (b ? a / b : 0);

const avgTime = (t: SiteTotals) => ratio(t.totaltime, t.visits);
const bounceRate = (t: SiteTotals) => ratio(t.bounces, t.visits);

const sum = (sites: SiteOverview[], key: 'current' | 'previous'): SiteTotals =>
  sites.reduce(
    (a, s) => ({
      visitors: a.visitors + s[key].visitors,
      visits: a.visits + s[key].visits,
      views: a.views + s[key].views,
      bounces: a.bounces + s[key].bounces,
      totaltime: a.totaltime + s[key].totaltime,
    }),
    { visitors: 0, visits: 0, views: 0, bounces: 0, totaltime: 0 },
  );

function ago(v: string | null) {
  if (!v) return 'never';
  const m = Math.round((Date.now() - Date.parse(v)) / 60_000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 60) return `${d} days ago`;
  return `${Math.round(d / 30)} months ago`;
}

function bucketLabel(t: string, unit: Data['unit'], long = false) {
  // Buckets are wall-clock times in the viewer's timezone, without an offset.
  const [date, time] = t.split('T');
  const [y, mo, d] = date.split('-').map(Number);
  const day = new Date(Date.UTC(y, mo - 1, d));
  const opts = { timeZone: 'UTC' } as const;
  if (unit === 'hour') {
    return long
      ? `${day.toLocaleDateString(undefined, { ...opts, weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`
      : time;
  }
  const s = day.toLocaleDateString(undefined, {
    ...opts,
    ...(long || unit === 'day' ? { weekday: 'short' } : {}),
    day: 'numeric',
    month: 'short',
  });
  return unit === 'week' ? `Week of ${s}` : s;
}

/** Change against the previous period, as words and an arrow so it never relies on color. */
function Delta({
  now,
  before,
  invert = false,
  asPoints = false,
}: {
  now: N;
  before: N;
  invert?: boolean;
  asPoints?: boolean;
}) {
  if (!now && !before) return <span className={styles.flat}>—</span>;
  if (!before) return <span className={styles.up}>new</span>;
  const change = asPoints ? (now - before) * 100 : ((now - before) / before) * 100;
  const rounded = Math.round(change);
  if (rounded === 0) return <span className={styles.flat}>±0{asPoints ? ' pts' : '%'}</span>;
  const good = invert ? rounded < 0 : rounded > 0;
  return (
    <span className={good ? styles.up : styles.down}>
      {rounded > 0 ? '▲' : '▼'} {Math.abs(rounded)}
      {asPoints ? ' pts' : '%'}
    </span>
  );
}

function Kpi({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <Column gap="1" className={styles.kpi}>
      <Text size="sm" color="muted">
        {label}
      </Text>
      <Text size="2xl" weight="bold">
        {value}
      </Text>
      <Text size="xs" color="muted">
        {children}
      </Text>
    </Column>
  );
}

function Sparkline({
  values,
  buckets,
  unit,
}: {
  values: N[];
  buckets: string[];
  unit: Data['unit'];
}) {
  const max = Math.max(...values, 0);
  if (!max) return <span className={styles.flat}>no visits</span>;
  const w = 100;
  const h = 26;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map(
    (v, i) => `${(i * step).toFixed(2)},${(h - 2 - (v / max) * (h - 4)).toFixed(2)}`,
  );
  const peak = values.indexOf(max);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={styles.spark} role="img">
      <title>{`Peak ${max} visitors · ${bucketLabel(buckets[peak], unit, true)}`}</title>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--zen-primary)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Visitors across all sites per hour, day or week, with a hover breakdown by site. */
function TrendChart({ data }: { data: Data }) {
  const [hover, setHover] = useState<N | null>(null);
  const totals = data.buckets.map((_, i) => data.sites.reduce((a, s) => a + s.series[i], 0));
  const views = data.buckets.map((_, i) => data.sites.reduce((a, s) => a + s.viewsSeries[i], 0));
  const max = Math.max(1, ...totals);
  const n = data.buckets.length;
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  const top = (i: N) =>
    data.sites
      .filter(s => s.series[i] > 0)
      .sort((a, b) => b.series[i] - a.series[i])
      .slice(0, 4);

  return (
    <Column gap="2">
      <div className={styles.chart} onMouseLeave={() => setHover(null)}>
        <div className={styles.gridline} style={{ bottom: '100%' }}>
          <span>{fmt(max)}</span>
        </div>
        <div className={styles.gridline} style={{ bottom: '50%' }}>
          <span>{fmt(Math.round(max / 2))}</span>
        </div>
        <div className={styles.bars}>
          {totals.map((v, i) => (
            <div
              key={data.buckets[i]}
              className={styles.barSlot}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              tabIndex={0}
              aria-label={`${bucketLabel(data.buckets[i], data.unit, true)}: ${v} visitors`}
            >
              <div
                className={styles.bar}
                data-active={hover === i || undefined}
                style={{ height: v ? `${Math.max(2, (v / max) * 100)}%` : 0 }}
              />
            </div>
          ))}
        </div>
        {hover !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: `${((hover + 0.5) / n) * 100}%`,
              transform: `translateX(${hover / n > 0.6 ? '-100%' : hover / n < 0.2 ? '0' : '-50%'})`,
            }}
          >
            <Text weight="bold">{bucketLabel(data.buckets[hover], data.unit, true)}</Text>
            <Text size="sm">
              {fmt(totals[hover])} visitors · {fmt(views[hover])} views
            </Text>
            {top(hover).map(s => (
              <Row key={s.id} justifyContent="space-between" gap="4">
                <Text size="sm" color="muted">
                  {s.name}
                </Text>
                <Text size="sm">{fmt(s.series[hover])}</Text>
              </Row>
            ))}
          </div>
        )}
      </div>
      <div className={styles.axis}>
        {data.buckets.map((b, i) => (
          <span key={b}>{i % labelEvery === 0 ? bucketLabel(b, data.unit) : ''}</span>
        ))}
      </div>
    </Column>
  );
}

type SortKey = 'name' | 'visitors' | 'change' | 'visits' | 'views' | 'bounce' | 'time' | 'lastSeen';

const sortValue: Record<SortKey, (s: SiteOverview) => N | string> = {
  name: s => s.name.toLowerCase(),
  visitors: s => s.current.visitors,
  change: s => s.current.visitors - s.previous.visitors,
  visits: s => s.current.visits,
  views: s => s.current.views,
  bounce: s => bounceRate(s.current),
  time: s => avgTime(s.current),
  lastSeen: s => (s.lastSeen ? Date.parse(s.lastSeen) : 0),
};

function Th({
  id,
  sort,
  setSort,
  children,
  title,
}: {
  id: SortKey;
  sort: { key: SortKey; desc: boolean };
  setSort: (s: { key: SortKey; desc: boolean }) => void;
  children: ReactNode;
  title?: string;
}) {
  const active = sort.key === id;
  return (
    <th aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : undefined} title={title}>
      <button
        type="button"
        onClick={() => setSort({ key: id, desc: active ? !sort.desc : id !== 'name' })}
      >
        {children}
        <span className={styles.sortMark}>{active ? (sort.desc ? '↓' : '↑') : ''}</span>
      </button>
    </th>
  );
}

function summary(data: Data, period: (typeof PERIODS)[number]) {
  const now = sum(data.sites, 'current');
  const before = sum(data.sites, 'previous');
  const visited = data.sites.filter(s => s.current.visitors > 0);
  const quiet = data.sites.filter(s => s.current.visitors === 0);
  const ranked = [...visited].sort((a, b) => b.current.visitors - a.current.visitors);
  const moves = data.sites
    .map(s => ({ s, d: s.current.visitors - s.previous.visitors }))
    .sort((a, b) => b.d - a.d);
  const rise = moves[0]?.d > 0 ? moves[0] : null;
  const fall = moves[moves.length - 1]?.d < 0 ? moves[moves.length - 1] : null;
  const parts: string[] = [];

  const trend = !before.visitors
    ? ''
    : now.visitors === before.visitors
      ? `, the same as ${period.prev}`
      : `, ${now.visitors > before.visitors ? 'up' : 'down'} ${Math.abs(Math.round(((now.visitors - before.visitors) / before.visitors) * 100))}% on ${period.prev}`;
  parts.push(
    `In the last ${period.label}, ${fmt(now.visitors)} ${now.visitors === 1 ? 'visitor' : 'visitors'} came to ${visited.length} of your ${data.sites.length} sites${trend}.`,
  );
  if (ranked[0]) {
    parts.push(
      `${ranked[0].name} had the most (${fmt(ranked[0].current.visitors)}, ${pct(ratio(ranked[0].current.visitors, now.visitors))} of all)${
        ranked[1] ? `, then ${ranked[1].name} (${fmt(ranked[1].current.visitors)})` : ''
      }.`,
    );
  }
  if (rise) parts.push(`Biggest rise: ${rise.s.name} (+${fmt(rise.d)}).`);
  if (fall) parts.push(`Biggest drop: ${fall.s.name} (−${fmt(-fall.d)}).`);
  if (quiet.length && quiet.length <= 5) {
    parts.push(`No visitors: ${quiet.map(s => s.name).join(', ')}.`);
  } else if (quiet.length) {
    parts.push(`${quiet.length} sites had no visitors.`);
  }
  return parts.join(' ');
}

export function OverviewPage() {
  const [days, setDaysState] = useState<N>(7);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(STORAGE_KEY));
      if (PERIODS.some(p => p.days === v)) setDaysState(v);
    } catch {
      // No stored choice; keep 7 days.
    }
  }, []);
  const setDays = (d: N) => {
    setDaysState(d);
    try {
      localStorage.setItem(STORAGE_KEY, String(d));
    } catch {
      // Storage can be unavailable; the choice then lasts for this visit only.
    }
  };
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: 'visitors',
    desc: true,
  });
  const [hideQuiet, setHideQuiet] = useState(false);
  const { renderUrl } = useNavigation();
  const { get, useQuery } = useApi();
  const timezone = useMemo(() => getTimezone(), []);
  const { data, error, isLoading } = useQuery<Data>({
    queryKey: ['sites-overview', days, timezone],
    queryFn: () => get('/overview', { days, timezone }),
    refetchInterval: 60_000,
  });
  const period = PERIODS.find(p => p.days === days) ?? PERIODS[1];

  const rows = useMemo(() => {
    if (!data) return [];
    const list = data.sites.filter(s => !hideQuiet || s.current.visitors > 0);
    const get = sortValue[sort.key];
    return list.sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const c = x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name);
      return sort.desc ? -c : c;
    });
  }, [data, sort, hideQuiet]);

  const now = data ? sum(data.sites, 'current') : null;
  const before = data ? sum(data.sites, 'previous') : null;
  const maxVisitors = Math.max(1, ...(data?.sites.map(s => s.current.visitors) ?? [0]));
  const activeNow = data?.sites.reduce((a, s) => a + s.activeNow, 0) ?? 0;

  return (
    <PageBody>
      <Column gap="6">
        <PageHeader
          title="Overview"
          description={`Every site side by side. Changes compare the last ${period.label} with ${period.prev}.`}
        >
          <Row gap="1" wrap="wrap" justifyContent="flex-end">
            {PERIODS.map(p => (
              <Button
                key={p.days}
                size="sm"
                variant={p.days === days ? 'primary' : 'quiet'}
                onPress={() => setDays(p.days)}
              >
                {p.label}
              </Button>
            ))}
          </Row>
        </PageHeader>

        <LoadingPanel data={data} isLoading={isLoading} error={error}>
          {data && now && before && (
            <Column gap="6">
              <Panel>
                <Column gap="5">
                  <Text size="lg">{summary(data, period)}</Text>
                  <Grid columns="repeat(auto-fit, minmax(150px, 1fr))" gap="5">
                    <Kpi label="Visitors" value={fmt(now.visitors)}>
                      <Delta now={now.visitors} before={before.visitors} /> · was{' '}
                      {fmt(before.visitors)}
                    </Kpi>
                    <Kpi label="Visits" value={fmt(now.visits)}>
                      <Delta now={now.visits} before={before.visits} /> · was {fmt(before.visits)}
                    </Kpi>
                    <Kpi label="Views" value={fmt(now.views)}>
                      <Delta now={now.views} before={before.views} /> · was {fmt(before.views)}
                    </Kpi>
                    <Kpi label="Avg. visit time" value={fmtTime(avgTime(now))}>
                      <Delta now={avgTime(now)} before={avgTime(before)} /> · was{' '}
                      {fmtTime(avgTime(before))}
                    </Kpi>
                    <Kpi label="Bounce rate" value={pct(bounceRate(now))}>
                      <Delta now={bounceRate(now)} before={bounceRate(before)} invert asPoints /> ·
                      was {pct(bounceRate(before))}
                    </Kpi>
                    <Kpi label="On a site right now" value={fmt(activeNow)}>
                      last 5 minutes
                    </Kpi>
                  </Grid>
                </Column>
              </Panel>

              <Panel>
                <Column gap="4">
                  <Column gap="1">
                    <Heading size="lg">Visitors over time, all sites</Heading>
                    <Text color="muted">
                      Per {data.unit}. Hover a bar to see which sites the visitors went to.
                    </Text>
                  </Column>
                  <TrendChart data={data} />
                </Column>
              </Panel>

              <Panel>
                <Column gap="4">
                  <Row justifyContent="space-between" alignItems="center" wrap="wrap" gap="3">
                    <Column gap="1">
                      <Heading size="lg">Sites</Heading>
                      <Text color="muted">
                        Click a column to sort. Change is visitors against {period.prev}.
                      </Text>
                    </Column>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={hideQuiet}
                        onChange={e => setHideQuiet(e.target.checked)}
                      />
                      Hide sites without visitors
                    </label>
                  </Row>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <Th id="name" sort={sort} setSort={setSort}>
                            Site
                          </Th>
                          <Th id="visitors" sort={sort} setSort={setSort}>
                            Visitors
                          </Th>
                          <Th id="change" sort={sort} setSort={setSort}>
                            Change
                          </Th>
                          <Th id="visits" sort={sort} setSort={setSort}>
                            Visits
                          </Th>
                          <Th id="views" sort={sort} setSort={setSort}>
                            Views
                          </Th>
                          <Th
                            id="bounce"
                            sort={sort}
                            setSort={setSort}
                            title="Visits that saw one page and did nothing else"
                          >
                            Bounce
                          </Th>
                          <Th id="time" sort={sort} setSort={setSort} title="Average visit time">
                            Avg. time
                          </Th>
                          <th>Trend</th>
                          <th>Top referrer</th>
                          <Th id="lastSeen" sort={sort} setSort={setSort}>
                            Last visit
                          </Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(s => {
                          const c = s.current;
                          const p = s.previous;
                          const diff = c.visitors - p.visitors;
                          return (
                            <tr key={s.id} data-quiet={!c.visitors || undefined}>
                              <td>
                                <Link
                                  href={renderUrl(`/websites/${s.id}`, false)}
                                  className={styles.site}
                                >
                                  <span className={styles.favicon}>
                                    <Favicon domain={s.domain} />
                                  </span>
                                  <span className={styles.siteText}>
                                    <span className={styles.siteName}>
                                      {s.name}
                                      {s.activeNow > 0 && (
                                        <span
                                          className={styles.live}
                                          title="Visitors in the last 5 minutes"
                                        >
                                          ● {s.activeNow} now
                                        </span>
                                      )}
                                    </span>
                                    <span className={styles.domain}>{s.domain}</span>
                                  </span>
                                </Link>
                              </td>
                              <td>
                                <div className={styles.visitors}>
                                  <span className={styles.num}>{fmt(c.visitors)}</span>
                                  <span className={styles.track}>
                                    <span
                                      className={styles.fill}
                                      style={{
                                        width: c.visitors
                                          ? `${Math.max(3, (c.visitors / maxVisitors) * 100)}%`
                                          : 0,
                                      }}
                                    />
                                  </span>
                                  <span className={styles.share}>
                                    {share(c.visitors, now.visitors)}
                                  </span>
                                </div>
                              </td>
                              <td className={styles.numCell}>
                                <Delta now={c.visitors} before={p.visitors} />
                                <div className={styles.sub}>
                                  {diff > 0 ? `+${fmt(diff)}` : diff < 0 ? `−${fmt(-diff)}` : '±0'}{' '}
                                  · was {fmt(p.visitors)}
                                </div>
                              </td>
                              <td className={styles.numCell}>
                                {fmt(c.visits)}
                                <div className={styles.sub}>
                                  <Delta now={c.visits} before={p.visits} />
                                </div>
                              </td>
                              <td className={styles.numCell}>
                                {fmt(c.views)}
                                <div className={styles.sub}>
                                  <Delta now={c.views} before={p.views} />
                                </div>
                              </td>
                              <td className={styles.numCell}>
                                {c.visits ? pct(bounceRate(c)) : '—'}
                              </td>
                              <td className={styles.numCell}>
                                {c.visits ? fmtTime(avgTime(c)) : '—'}
                              </td>
                              <td>
                                <Sparkline
                                  values={s.series}
                                  buckets={data.buckets}
                                  unit={data.unit}
                                />
                              </td>
                              <td className={styles.ref} title={s.topReferrer?.domain}>
                                {s.topReferrer ? (
                                  <>
                                    {s.topReferrer.domain}
                                    <div className={styles.sub}>
                                      {people(s.topReferrer.visitors)}
                                    </div>
                                  </>
                                ) : (
                                  <span className={styles.flat}>direct only</span>
                                )}
                              </td>
                              <td className={styles.numCell}>{ago(s.lastSeen)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>All sites</td>
                          <td className={styles.numCell}>{fmt(now.visitors)}</td>
                          <td className={styles.numCell}>
                            <Delta now={now.visitors} before={before.visitors} />
                          </td>
                          <td className={styles.numCell}>{fmt(now.visits)}</td>
                          <td className={styles.numCell}>{fmt(now.views)}</td>
                          <td className={styles.numCell}>
                            {now.visits ? pct(bounceRate(now)) : '—'}
                          </td>
                          <td className={styles.numCell}>
                            {now.visits ? fmtTime(avgTime(now)) : '—'}
                          </td>
                          <td colSpan={3} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <Text size="xs" color="muted">
                    A visitor is one browser on one site, so someone who opened two sites counts on
                    both. Your own visits with ?notrack=1 are not counted. Data refreshes every
                    minute.
                  </Text>
                </Column>
              </Panel>
            </Column>
          )}
        </LoadingPanel>
      </Column>
    </PageBody>
  );
}
