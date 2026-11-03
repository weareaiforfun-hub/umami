import { CLICKHOUSE, notImplemented, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';

// Visitor and feature usage for the admin "MuseumHop" page, from the events that
// museumhop.arian-shafa.xyz (src/lib/track.ts there) and the old museumhopper.arian-shafa.xyz
// forwarding page send. Both websites are found by domain. PostgreSQL only.

export const MUSEUMHOP_DOMAIN = 'museumhop.arian-shafa.xyz';
export const MUSEUMHOPPER_DOMAIN = 'museumhopper.arian-shafa.xyz';

export interface MuseumHopUsage {
  sites: { domain: string; visitors: number; visits: number; views: number; events: number }[];
  daily: { day: string; domain: string; visitors: number }[];
  funnel: { step: string; visitors: number }[];
  events: { event: string; total: number; visitors: number }[];
  breakdown: { event: string; key: string; value: string; total: number; visitors: number }[];
  devices: { kind: string; value: string; visitors: number }[];
  hours: { hour: number; visits: number }[];
  returning: { visitors: number; returning: number; medianVisitsPerVisitor: number };
  engaged: { visits: number; medianSeconds: number; engagedVisits: number };
  errors: { message: string; total: number }[];
}

const FUNCTION_NAME = 'getMuseumHopUsage';

// The steps a new visitor takes towards a planned night, in order.
const FUNNEL: [string, string][] = [
  ['Opened MuseumHop', `event_type = 1`],
  [
    'Did something (any tap or click)',
    `event_type = 2 and event_name not in ('scroll-depth', 'engaged-time', 'js-error', 'copy-text')`,
  ],
  [
    'Opened an activity or the map',
    `event_name in ('details-open', 'view', 'route-preview', 'getting-around')`,
  ],
  [
    'In a night (created, joined or returned)',
    `event_name in ('in-night', 'night-create', 'night-join')`,
  ],
  ['Reacted to something', `event_name = 'reaction'`],
  ['Added a stop', `event_name in ('stop-add', 'route-adopt')`],
  ['Kept their spot (personal link)', `event_name in ('personal-link-made', 'personal-link-used')`],
];

// Event properties worth splitting out (event name -> property keys).
const BREAKDOWN: [string, string][] = [
  ['view', 'name'],
  ['panel', 'name'],
  ['category', 'name'],
  ['route-view', 'name'],
  ['reaction', 'kind'],
  ['stop-add', 'route'],
  ['route-adopt', 'from'],
  ['route-adopt', 'route'],
  ['route-preview', 'kind'],
  ['details-open', 'kind'],
  ['ride-select', 'mode'],
  ['night-create', 'via'],
  ['night-join', 'via'],
  ['in-night', 'role'],
  ['in-night', 'link'],
  ['intro-close', 'then'],
  ['intro-close', 'slide'],
  ['tour-end', 'step'],
  ['tour-end', 'finished'],
  ['show-me', 'feature'],
  ['help-open', 'tab'],
  ['handoff', 'result'],
  ['forward', 'kind'],
  ['forward', 'carried'],
  ['feature-use', 'action'],
  ['button-click', 'label'],
];

export async function getMuseumHopUsage(
  ...args: [filters: { startDate: Date; endDate: Date }]
): Promise<MuseumHopUsage> {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: notImplemented,
  });
}

async function relationalQuery({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}): Promise<MuseumHopUsage> {
  const { rawQuery } = prisma;
  const params = { startDate, endDate, hop: MUSEUMHOP_DOMAIN, hopper: MUSEUMHOPPER_DOMAIN };
  const q = (sql: string) => rawQuery(sql, params, FUNCTION_NAME);

  const SITES = `sites as (
    select website_id, domain from website
    where domain in ({{hop}}, {{hopper}}) and deleted_at is null
  )`;
  const E = `${SITES}, e as (
    select we.*, sites.domain from website_event we join sites on sites.website_id = we.website_id
    where we.created_at between {{startDate}} and {{endDate}}
  )`;
  const HOP = `${E}, h as (select * from e where domain = {{hop}})`;
  const pairs = BREAKDOWN.map(([ev, key]) => `('${ev}', '${key}')`).join(', ');

  const [sites, daily, funnel, events, breakdown, devices, hours, returning, engaged, errors] =
    await Promise.all([
      q(`
      with ${E}
      select sites.domain,
        count(distinct e.session_id)::int as "visitors",
        count(distinct e.visit_id)::int as "visits",
        count(e.event_id) filter (where e.event_type = 1)::int as "views",
        count(e.event_id) filter (where e.event_type = 2)::int as "events"
      from sites left join e on e.website_id = sites.website_id
      group by sites.domain order by sites.domain
      `),
      q(`
      with ${E}
      select to_char(created_at at time zone 'Europe/Amsterdam', 'YYYY-MM-DD') as "day", domain,
        count(distinct session_id)::int as "visitors"
      from e group by 1, 2 order by 1
      `),
      q(`
      with ${HOP}
      ${FUNNEL.map(
        ([step, where], i) =>
          `select ${i} as i, '${step}' as "step", count(distinct session_id)::int as "visitors" from h where ${where}`,
      ).join(' union all ')}
      order by i
      `),
      q(`
      with ${E}
      select case when domain = {{hopper}} then 'old address · ' || event_name else event_name end as "event",
        count(*)::int as "total", count(distinct session_id)::int as "visitors"
      from e where event_type = 2
      group by 1 order by 2 desc
      `),
      q(`
      with ${E}
      select e.event_name as "event", d.data_key as "key",
        coalesce(d.string_value, trim(trailing '.' from trim(trailing '0' from d.number_value::text))) as "value",
        count(*)::int as "total", count(distinct e.session_id)::int as "visitors"
      from e join event_data d on d.website_event_id = e.event_id and d.website_id = e.website_id
      where (e.event_name, d.data_key) in (${pairs})
        and not (e.event_name = 'feature-use' and e.domain = {{hopper}})
      group by 1, 2, 3 order by 1, 2, 4 desc
      `),
      q(`
      with ${HOP}, s as (select distinct session.* from session join h on h.session_id = session.session_id)
      select 'device' as "kind", coalesce(device, 'unknown') as "value", count(*)::int as "visitors" from s group by 2
      union all select 'browser', coalesce(browser, 'unknown'), count(*)::int from s group by 2
      union all select 'os', coalesce(os, 'unknown'), count(*)::int from s group by 2
      union all select 'country', coalesce(country, '??'), count(*)::int from s group by 2
      union all select 'language', coalesce(split_part(language, '-', 1), '?'), count(*)::int from s group by 2
      order by 1, 3 desc
      `),
      q(`
      with ${HOP}, v as (select visit_id, min(created_at) as t from h group by visit_id)
      select extract(hour from t at time zone 'Europe/Amsterdam')::int as "hour", count(*)::int as "visits"
      from v group by 1 order by 1
      `),
      q(`
      with ${HOP}, s as (select session_id, count(distinct visit_id) as n from h group by session_id)
      select count(*)::int as "visitors", count(*) filter (where n > 1)::int as "returning",
        coalesce(percentile_cont(0.5) within group (order by n), 0)::float as "medianVisitsPerVisitor"
      from s
      `),
      q(`
      with ${HOP}, t as (
        select h.visit_id, coalesce(sum(d.number_value) filter (where h.event_name = 'engaged-time' and d.data_key = 'seconds'), 0) as secs
        from h left join event_data d on d.website_event_id = h.event_id and d.website_id = h.website_id
        group by h.visit_id
      )
      select count(*)::int as "visits",
        coalesce(percentile_cont(0.5) within group (order by secs) filter (where secs > 0), 0)::float as "medianSeconds",
        count(*) filter (where secs >= 30)::int as "engagedVisits"
      from t
      `),
      q(`
      with ${HOP}
      select coalesce(d.string_value, 'unknown') as "message", count(*)::int as "total"
      from h join event_data d on d.website_event_id = h.event_id and d.data_key = 'message'
      where h.event_name = 'js-error'
      group by 1 order by 2 desc limit 10
      `),
    ]);

  return {
    sites,
    daily,
    funnel,
    events,
    breakdown,
    devices,
    hours,
    returning: returning[0],
    engaged: engaged[0],
    errors,
  };
}
