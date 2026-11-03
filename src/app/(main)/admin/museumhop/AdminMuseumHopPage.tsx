'use client';
import { Button, Column, Grid, Heading, Row, Text } from '@umami/react-zen';
import { useState } from 'react';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useApi } from '@/components/hooks';
import type { MuseumHopUsage } from '@/queries/sql/getMuseumHopUsage';

// MuseumHop (museumhop.arian-shafa.xyz, a Museumnacht Amsterdam planner) and its old address
// museumhopper.arian-shafa.xyz. Two sources, both counts only: visitor and feature usage from this
// umami database, and planner data (nights, groups, reactions, routes) from MuseumHop's Supabase
// project, read by /api/admin/museumhop. Admin only.

type N = number;
interface Planner {
  generated_at: string;
  totals: Record<string, N>;
  group_sizes: { size: N; nights: N }[];
  roles: Record<string, N>;
  reactions_by_kind: Record<string, N>;
  changes_by_kind: Record<string, N>;
  daily: { day: string; changes: N; active_people: N; joins: N; nights: N }[];
  hours: { hour: N; changes: N }[];
  top_events: { event_id: string; must: N; up: N; skip: N; on_routes: N; score: N }[];
  nights: {
    name: string;
    created_at: string;
    members: N;
    reactions: N;
    shared_stops: N;
    personal_routes: N;
    crews: N;
    changes: N;
    last_change: string | null;
    hours_to_second_member: N | null;
  }[];
}
interface Data {
  days: N;
  usage: MuseumHopUsage;
  planner: { configured: boolean; error?: string; report?: Planner };
}

const HOP = 'museumhop.arian-shafa.xyz';
const HOPPER = 'museumhopper.arian-shafa.xyz';
const EVENT_DAY = '2026-11-07';
const PERIODS = [7, 30, 90, 365];

const pct = (part: N, whole: N) => (whole ? `${Math.round((part / whole) * 100)}%` : '—');
const fmtTime = (s: N) =>
  !s ? '0s' : s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const nice = (id: string) =>
  id
    .replace(/^museum:/, '')
    .replace(/-/g, ' ')
    .replace(/^./, c => c.toUpperCase());
const LABELS: Record<string, string> = {
  view: 'Phone view',
  panel: 'Side panel',
  category: 'Programme tab',
  'route-view': 'Route shown as',
  reaction: 'Reactions',
  'stop-add': 'Stops added to',
  'route-adopt': 'Routes adopted',
  'route-preview': 'Routes previewed',
  'details-open': 'Details opened',
  'ride-select': 'Rides tapped (Getting around)',
  'night-create': 'Nights created from',
  'night-join': 'Nights joined from',
  'in-night': 'People in a night',
  'intro-close': 'Intro',
  'tour-end': 'Tour',
  'show-me': '“Show me” in What can I do?',
  'help-open': 'Help opened on',
  handoff: 'Old-address hand-offs arriving',
  forward: 'Old address forwards',
  'feature-use': 'Email and sign-in calls',
  'button-click': 'Most-clicked buttons',
};

const Stat = ({ label, value, note }: { label: string; value: string | N; note?: string }) => (
  <Column gap="1" minWidth="140px">
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

/** A labelled horizontal bar list: the shape almost every section here needs. */
function Bars({
  rows,
  unit = '',
  limit = 12,
}: {
  rows: { label: string; value: N; note?: string }[];
  unit?: string;
  limit?: N;
}) {
  const max = Math.max(0, ...rows.map(r => r.value));
  if (!rows.length) return <Empty>Nothing yet in this period.</Empty>;
  return (
    <Column gap="2">
      {rows.slice(0, limit).map(r => (
        <Grid key={r.label} columns="minmax(140px, 220px) 1fr 90px" gap="3" alignItems="center">
          <Text title={r.label} truncate>
            {r.label}
          </Text>
          <div
            style={{
              height: 10,
              width: `${max && r.value ? Math.max(2, (r.value / max) * 100) : 0}%`,
              background: 'var(--zen-primary)',
              borderRadius: 3,
            }}
          />
          <Text align="right">
            {r.value}
            {unit}
            {r.note ? ` · ${r.note}` : ''}
          </Text>
        </Grid>
      ))}
    </Column>
  );
}

/** Daily columns over the period, stacked for the two addresses. */
function Daily({ usage, days }: { usage: MuseumHopUsage; days: N }) {
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i--)
    list.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  const get = (day: string, domain: string) =>
    usage.daily.find(d => d.day === day && d.domain === domain)?.visitors ?? 0;
  const max = Math.max(1, ...list.map(d => get(d, HOP) + get(d, HOPPER)));
  return (
    <Column gap="2">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
        {list.map(d => {
          const a = get(d, HOP);
          const b = get(d, HOPPER);
          return (
            <div
              key={d}
              title={`${d}: ${a} on MuseumHop, ${b} on the old address`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                height: '100%',
                outline: d === EVENT_DAY ? '1px dashed var(--zen-primary)' : undefined,
              }}
            >
              <div
                style={{ height: `${(b / max) * 100}%`, background: 'var(--zen-gray-400, #aaa)' }}
              />
              <div
                style={{
                  height: `${(a / max) * 100}%`,
                  background: 'var(--zen-primary)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            </div>
          );
        })}
      </div>
      <Row justifyContent="space-between">
        <Text size="xs" color="muted">
          {list[0]}
        </Text>
        <Text size="xs" color="muted">
          Darker: MuseumHop · lighter: old address · dashed: Museumnacht ({EVENT_DAY})
        </Text>
        <Text size="xs" color="muted">
          {list[list.length - 1]}
        </Text>
      </Row>
    </Column>
  );
}

/** Plain-language observations from the numbers, so the page says what matters first. */
function highlights(u: MuseumHopUsage, p?: Planner): string[] {
  const out: string[] = [];
  const hop = u.sites.find(s => s.domain === HOP);
  const old = u.sites.find(s => s.domain === HOPPER);
  const [opened, , , inNight, reacted, added, kept] = u.funnel.map(f => f.visitors);
  if (opened) {
    out.push(
      `${pct(inNight, opened)} of visitors ended up in a night; ${pct(added, opened)} added a stop.`,
    );
    if (inNight)
      out.push(`${pct(kept, inNight)} of people in a night kept their spot with a personal link.`);
    if (inNight && reacted < inNight / 2)
      out.push(
        'Fewer than half of the people in a night reacted to anything: reactions may be easy to miss.',
      );
  }
  if (old?.visitors)
    out.push(`${old.visitors} visitors still arrived through the old museumhopper address.`);
  const phone = u.devices
    .filter(d => d.kind === 'device' && d.value === 'mobile')
    .reduce((a, d) => a + d.visitors, 0);
  const all = u.devices.filter(d => d.kind === 'device').reduce((a, d) => a + d.visitors, 0);
  if (all) out.push(`${pct(phone, all)} of visitors used a phone.`);
  const tours = u.breakdown.filter(b => b.event === 'tour-end' && b.key === 'finished');
  const done = tours.find(t => t.value === 'true')?.total ?? 0;
  const tourTotal = tours.reduce((a, t) => a + t.total, 0);
  if (tourTotal) out.push(`${pct(done, tourTotal)} of started tours were finished.`);
  if (u.errors.length)
    out.push(
      `${u.errors.reduce((a, e) => a + e.total, 0)} front-end errors were seen; see the bottom of the page.`,
    );
  if (p) {
    const t = p.totals;
    if (t.nights)
      out.push(
        `${t.group_nights} of ${t.nights} nights have more than one person (average group ${t.avg_group_size}).`,
      );
    if (t.people)
      out.push(`${t.returning_people} of ${t.people} people made changes on more than one day.`);
  }
  if (hop && !hop.visitors) out.push('No visits recorded yet in this period.');
  return out;
}

export function AdminMuseumHopPage() {
  const [days, setDays] = useState(30);
  const { get, useQuery } = useApi();
  const { data, error, isLoading } = useQuery<Data>({
    queryKey: ['museumhop-usage', days],
    queryFn: () => get('/admin/museumhop', { days }),
  });
  const u = data?.usage;
  const p = data?.planner?.report;
  const site = (d: string) => u?.sites.find(s => s.domain === d);
  const split = (event: string, key: string) =>
    (u?.breakdown ?? [])
      .filter(b => b.event === event && b.key === key)
      .map(b => ({ label: b.value, value: b.total, note: `${b.visitors} ppl` }));
  const device = (kind: string) =>
    (u?.devices ?? [])
      .filter(d => d.kind === kind)
      .map(d => ({ label: d.value, value: d.visitors }));
  const toDays = Math.ceil((Date.parse(EVENT_DAY) - Date.now()) / 86_400_000);

  return (
    <Column gap="6" margin="2">
      <PageHeader
        title="MuseumHop"
        description={`Museumnacht planner: museumhop.arian-shafa.xyz and the old museumhopper address${toDays > 0 ? ` · ${toDays} days to Museumnacht` : ''}`}
      >
        <Row gap="2">
          {PERIODS.map(d => (
            <Button key={d} variant={d === days ? 'primary' : 'outline'} onPress={() => setDays(d)}>
              {d === 365 ? '1 year' : `${d} days`}
            </Button>
          ))}
        </Row>
      </PageHeader>

      <LoadingPanel data={data} error={error} isLoading={isLoading}>
        {u && (
          <Column gap="6">
            <Section title="Highlights" description="What stands out in this period.">
              <Column gap="1">
                {highlights(u, p).map(h => (
                  <Text key={h}>• {h}</Text>
                ))}
              </Column>
            </Section>

            <Section
              title="Visitors"
              description={`Last ${days} days. Cookie-free: a visitor is one browser per day-salted id, so returning counts are approximate.`}
            >
              <Row gap="6" wrap="wrap">
                <Stat label="Visitors (MuseumHop)" value={site(HOP)?.visitors ?? 0} />
                <Stat label="Visits" value={site(HOP)?.visits ?? 0} />
                <Stat label="Page views" value={site(HOP)?.views ?? 0} />
                <Stat label="Usage events" value={site(HOP)?.events ?? 0} />
                <Stat
                  label="Returning visitors"
                  value={pct(u.returning?.returning ?? 0, u.returning?.visitors ?? 0)}
                  note={`${u.returning?.returning ?? 0} came back`}
                />
                <Stat
                  label="Median active time"
                  value={fmtTime(u.engaged?.medianSeconds ?? 0)}
                  note="per visit, tab visible and in use"
                />
                <Stat
                  label="Engaged visits"
                  value={pct(u.engaged?.engagedVisits ?? 0, u.engaged?.visits ?? 0)}
                  note="30 s or more of active use"
                />
                <Stat
                  label="Old address"
                  value={site(HOPPER)?.visitors ?? 0}
                  note="visitors forwarded"
                />
              </Row>
              <Daily usage={u} days={Math.min(days, 90)} />
            </Section>

            <Section
              title="From visit to a planned night"
              description="Visitors who reached each step (MuseumHop, this period)."
            >
              <Bars
                rows={u.funnel.map(f => ({
                  label: f.step,
                  value: f.visitors,
                  note: pct(f.visitors, u.funnel[0]?.visitors ?? 0),
                }))}
              />
            </Section>

            <Grid columns="repeat(auto-fit, minmax(420px, 1fr))" gap="6">
              <Section title="Features used" description="Events and how many visitors used each.">
                <Bars
                  rows={u.events.map(e => ({
                    label: e.event,
                    value: e.total,
                    note: `${e.visitors} ppl`,
                  }))}
                  limit={30}
                />
              </Section>
              <Section title="When people plan" description="Visits by hour of day (Amsterdam).">
                <Bars
                  rows={Array.from({ length: 24 }, (_, h) => ({
                    label: `${String(h).padStart(2, '0')}:00`,
                    value: u.hours.find(x => x.hour === h)?.visits ?? 0,
                  }))}
                  limit={24}
                />
              </Section>
            </Grid>

            <Section title="How features are used" description="The choices inside each feature.">
              <Grid columns="repeat(auto-fit, minmax(360px, 1fr))" gap="6">
                {Object.keys(LABELS)
                  .flatMap(ev =>
                    [...new Set(u.breakdown.filter(b => b.event === ev).map(b => b.key))].map(
                      key => [ev, key],
                    ),
                  )
                  .map(([ev, key]) => (
                    <Column key={ev + key} gap="2">
                      <Text weight="bold">
                        {LABELS[ev]}
                        {['intro-close', 'tour-end', 'route-adopt', 'in-night', 'forward'].includes(
                          ev,
                        )
                          ? ` · ${key}`
                          : ''}
                      </Text>
                      <Bars rows={split(ev, key)} limit={8} />
                    </Column>
                  ))}
              </Grid>
            </Section>

            <Section title="Devices and places" description="MuseumHop visitors this period.">
              <Grid columns="repeat(auto-fit, minmax(260px, 1fr))" gap="6">
                {(['device', 'os', 'browser', 'country', 'language'] as const).map(k => (
                  <Column key={k} gap="2">
                    <Text weight="bold">{k[0].toUpperCase() + k.slice(1)}</Text>
                    <Bars rows={device(k)} limit={8} />
                  </Column>
                ))}
              </Grid>
            </Section>

            {data.planner.configured ? (
              data.planner.error || !p ? (
                <Section title="Planner data">
                  <Empty>{data.planner.error ?? 'No report.'}</Empty>
                </Section>
              ) : (
                <Planner p={p} />
              )
            ) : (
              <Section title="Planner data">
                <Empty>
                  Not connected yet. Set MUSEUMHOP_SUPABASE_URL, MUSEUMHOP_SUPABASE_ANON_KEY and
                  MUSEUMHOP_REPORT_SECRET in this deployment&apos;s environment variables.
                </Empty>
              </Section>
            )}

            <Section
              title="Problems"
              description="Front-end errors visitors ran into (MuseumHop, this period)."
            >
              {u.errors.length ? (
                <Bars rows={u.errors.map(e => ({ label: e.message, value: e.total }))} />
              ) : (
                <Empty>No errors recorded.</Empty>
              )}
            </Section>
          </Column>
        )}
      </LoadingPanel>
    </Column>
  );
}

/** Nights, groups, reactions and routes, all time, from MuseumHop's own database. */
function Planner({ p }: { p: Planner }) {
  const t = p.totals;
  return (
    <>
      <Section
        title="Planner: nights and people"
        description={`All time, from MuseumHop’s database · updated ${fmtDate(p.generated_at)}. Counts only; no names or notes.`}
      >
        <Row gap="6" wrap="wrap">
          <Stat
            label="Nights"
            value={t.nights}
            note={`${t.group_nights} with friends · ${t.solo_nights} solo`}
          />
          <Stat label="People" value={t.people} note={`average group ${t.avg_group_size ?? '—'}`} />
          <Stat
            label="Active last 24 h"
            value={t.active_people_24h}
            note={`${t.active_people_7d} in 7 days`}
          />
          <Stat
            label="Came back another day"
            value={pct(t.returning_people, t.people)}
            note={`${t.returning_people} people`}
          />
          <Stat
            label="Personal links"
            value={pct(t.personal_links, t.people)}
            note={`${t.personal_links} people kept their spot`}
          />
          <Stat
            label="Emails on file"
            value={t.emails_on_file}
            note={`${t.emails_sent_24h} sent · ${t.recoveries_24h} recoveries (24 h)`}
          />
        </Row>
        <Row gap="6" wrap="wrap">
          <Stat
            label="Reactions"
            value={t.reactions}
            note={`by ${t.reacting_people} people · ${t.notes} with a note`}
          />
          <Stat label="Stops on group routes" value={t.shared_stops} />
          <Stat
            label="Personal routes"
            value={t.personal_routes}
            note={`${t.personal_stops} stops`}
          />
          <Stat label="Route-idea votes" value={t.idea_votes} />
          <Stat label="Crews" value={t.crews} note={`${t.meetups} meet-ups`} />
          <Stat label="Changes" value={t.changes} note={`${t.locked_routes} routes locked`} />
        </Row>
      </Section>

      <Grid columns="repeat(auto-fit, minmax(360px, 1fr))" gap="6">
        <Section title="Group sizes">
          <Bars
            rows={p.group_sizes.map(g => ({
              label: `${g.size} ${g.size === 1 ? 'person' : 'people'}`,
              value: g.nights,
              note: 'nights',
            }))}
          />
        </Section>
        <Section title="Reactions and roles">
          <Bars
            rows={[
              ...Object.entries(p.reactions_by_kind).map(([k, v]) => ({
                label: { must: 'Must', up: 'Up for it', skip: 'Skip' }[k] ?? k,
                value: v,
              })),
              ...Object.entries(p.roles).map(([k, v]) => ({ label: `Role: ${k}`, value: v })),
            ]}
          />
        </Section>
        <Section title="What people change">
          <Bars
            rows={Object.entries(p.changes_by_kind).map(([k, v]) => ({
              label: k.replace(/_/g, ' '),
              value: v,
            }))}
          />
        </Section>
        <Section title="Planning by hour" description="Changes by hour of day (Amsterdam).">
          <Bars
            rows={p.hours.map(h => ({
              label: `${String(h.hour).padStart(2, '0')}:00`,
              value: h.changes,
            }))}
            limit={24}
          />
        </Section>
      </Grid>

      <Section title="Planning by day" description="Changes, people active, joins and new nights.">
        <Bars
          rows={p.daily.map(d => ({
            label: d.day,
            value: d.changes,
            note: `${d.active_people} active · ${d.joins} joined · ${d.nights} new nights`,
          }))}
          limit={60}
        />
      </Section>

      <Section
        title="Most wanted"
        description="Activities and museums by reactions and route stops across all nights (Must = 2, Up = 1, Skip = −1, stop = 1)."
      >
        <Bars
          rows={p.top_events.map(e => ({
            label: nice(e.event_id),
            value: e.score,
            note: [
              e.must && `${e.must} must`,
              e.up && `${e.up} up`,
              e.skip && `${e.skip} skip`,
              e.on_routes && `${e.on_routes} on routes`,
            ]
              .filter(Boolean)
              .join(', '),
          }))}
          limit={15}
        />
      </Section>

      <Section
        title="Nights"
        description="Every night, newest first. Time to second member shows how fast invites work."
      >
        <Column gap="2">
          {p.nights.map(n => (
            <Grid
              key={n.created_at}
              columns="minmax(160px, 1.4fr) repeat(6, minmax(70px, 1fr)) minmax(150px, 1.2fr)"
              gap="3"
            >
              <Text truncate title={n.name}>
                {n.name} · {fmtDate(n.created_at)}
              </Text>
              <Text>{n.members} people</Text>
              <Text>{n.reactions} reactions</Text>
              <Text>{n.shared_stops} stops</Text>
              <Text>{n.personal_routes} own routes</Text>
              <Text>{n.crews} crews</Text>
              <Text>{n.hours_to_second_member ?? '—'} h to 2nd</Text>
              <Text color="muted">last change {fmtDate(n.last_change)}</Text>
            </Grid>
          ))}
        </Column>
      </Section>
    </>
  );
}
