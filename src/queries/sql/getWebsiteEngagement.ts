import { CLICKHOUSE, notImplemented, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';

// Engagement insights built from the custom events that the arian-shafa.xyz sites send
// (engaged-time, scroll-depth, clicks, feature-use, rage-click, js-error, ...).
// PostgreSQL only.

export interface WebsiteEngagement {
  summary: {
    visits: number;
    visitors: number;
    engagedVisits: number;
    interactiveVisits: number;
    deepScrollVisits: number;
    convertedVisits: number;
    returningVisitors: number;
    medianEngagedSeconds: number;
    avgEngagedSeconds: number;
    rageClicks: number;
    jsErrors: number;
  };
  timeBuckets: { bucket: string; visits: number }[];
  pages: {
    path: string;
    views: number;
    visitors: number;
    engagedSeconds: number;
    deepScrollVisits: number;
    pageVisits: number;
    interactions: number;
  }[];
  features: {
    feature: string;
    action: string;
    uses: number;
    visitors: number;
    successes: number;
    medianSeconds: number;
    auto: number;
  }[];
  sources: {
    source: string;
    visits: number;
    engagedVisits: number;
    convertedVisits: number;
    avgEngagedSeconds: number;
  }[];
  clicks: { event: string; label: string; total: number; visitors: number }[];
  rage: { label: string; path: string; total: number }[];
  errors: { message: string; path: string; total: number }[];
  failures: { feature: string; action: string; status: number; total: number }[];
}

const FUNCTION_NAME = 'getWebsiteEngagement';

const PASSIVE = `('scroll-depth', 'engaged-time', 'js-error', 'rage-click', 'copy-text')`;

// Something the visitor did: not a passive signal, and not a call the page made by itself.
const INTERACTION = `(ev.event_name not in ${PASSIVE} and coalesce(ev.trig, 'user') <> 'auto')`;

const prop = (key: string, column = 'string_value') =>
  `max(event_data.${column}) filter (where event_data.data_key = '${key}')`;

// Custom events with their properties pivoted into columns.
const EVENTS = `
  ev as (
    select
      website_event.visit_id,
      website_event.session_id,
      website_event.event_name,
      coalesce(${prop('page')}, website_event.url_path) as path,
      ${prop('seconds', 'number_value')}::float as seconds,
      ${prop('percent', 'number_value')}::float as percent,
      coalesce(${prop('label')}, ${prop('name')}, ${prop('item')}, ${prop('target')}, ${prop('channel')}, ${prop('post')}, ${prop('form')}) as label,
      ${prop('feature')} as feature,
      ${prop('action')} as action,
      ${prop('ok')} as ok,
      ${prop('status', 'number_value')}::int as status,
      -- A status check is the page asking the backend what's available, whatever the visitor was doing.
      case when ${prop('action')} = 'status' then 'auto' else ${prop('trigger')} end as trig,
      ${prop('message')} as message
    from website_event
    left join event_data on event_data.website_event_id = website_event.event_id
      and event_data.website_id = website_event.website_id
    where website_event.website_id = {{websiteId::uuid}}
      and website_event.created_at between {{startDate}} and {{endDate}}
      and website_event.event_type = 2
    group by website_event.event_id, website_event.visit_id, website_event.session_id,
      website_event.event_name, website_event.url_path
  )`;

// One row per visit: where it came from, how long it was engaged, how far it scrolled,
// whether it interacted and whether it used a feature successfully.
const VISITS = `
  ${EVENTS},
  visits as (
    select
      website_event.visit_id,
      website_event.session_id,
      count(*) filter (where website_event.event_type = 1) as views,
      coalesce(min(website_event.referrer_domain) filter (
        where website_event.event_type = 1
          and website_event.referrer_domain <> ''
          and website_event.referrer_domain <> website.domain
      ), 'Direct') as source
    from website_event
    join website on website.website_id = website_event.website_id
    where website_event.website_id = {{websiteId::uuid}}
      and website_event.created_at between {{startDate}} and {{endDate}}
    group by website_event.visit_id, website_event.session_id
  ),
  vstats as (
    select
      visits.visit_id,
      visits.session_id,
      visits.views,
      visits.source,
      coalesce(sum(ev.seconds) filter (where ev.event_name = 'engaged-time'), 0) as engaged,
      coalesce(max(ev.percent) filter (where ev.event_name = 'scroll-depth'), 0) as depth,
      count(ev.event_name) filter (where ${INTERACTION}) as interactions,
      count(*) filter (where ev.event_name = 'feature-use' and ev.ok = 'true' and ev.trig = 'user') as wins
    from visits
    left join ev on ev.visit_id = visits.visit_id
    group by visits.visit_id, visits.session_id, visits.views, visits.source
  )`;

const ENGAGED = `(engaged >= 15 or interactions > 0 or views > 1)`;

export async function getWebsiteEngagement(
  ...args: [websiteId: string, filters: { startDate: Date; endDate: Date }]
): Promise<WebsiteEngagement> {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: notImplemented,
  });
}

async function relationalQuery(
  websiteId: string,
  { startDate, endDate }: { startDate: Date; endDate: Date },
): Promise<WebsiteEngagement> {
  const { rawQuery } = prisma;
  const params = { websiteId, startDate, endDate };
  const q = (sql: string) => rawQuery(sql, params, FUNCTION_NAME);

  const [summary, timeBuckets, pages, features, sources, clicks, rage, errors, failures] =
    await Promise.all([
      q(`
      with ${VISITS},
      sessions as (select session_id, count(*) as n from vstats group by session_id)
      select
        count(*)::int as "visits",
        count(distinct session_id)::int as "visitors",
        count(*) filter (where ${ENGAGED})::int as "engagedVisits",
        count(*) filter (where interactions > 0)::int as "interactiveVisits",
        count(*) filter (where depth >= 75)::int as "deepScrollVisits",
        count(*) filter (where wins > 0)::int as "convertedVisits",
        (select count(*) from sessions where n > 1)::int as "returningVisitors",
        coalesce(percentile_cont(0.5) within group (order by engaged) filter (where engaged > 0), 0)::float as "medianEngagedSeconds",
        coalesce(avg(engaged) filter (where engaged > 0), 0)::float as "avgEngagedSeconds",
        (select count(*) from ev where event_name = 'rage-click')::int as "rageClicks",
        (select count(*) from ev where event_name = 'js-error')::int as "jsErrors"
      from vstats
      `),
      q(`
      with ${VISITS}
      select bucket, count(*)::int as "visits" from (
        select case
          when engaged < 3 then '<3s'
          when engaged < 15 then '3-15s'
          when engaged < 60 then '15-60s'
          when engaged < 180 then '1-3m'
          when engaged < 600 then '3-10m'
          else '10m+' end as bucket
        from vstats
      ) b group by bucket
      `),
      q(`
      with ${EVENTS},
      pv as (
        select url_path as path, count(*) as views, count(distinct session_id) as visitors
        from website_event
        where website_id = {{websiteId::uuid}}
          and created_at between {{startDate}} and {{endDate}}
          and event_type = 1
        group by url_path
      ),
      pe as (
        select path,
          coalesce(sum(seconds) filter (where event_name = 'engaged-time'), 0) as secs,
          count(distinct visit_id) filter (where event_name = 'scroll-depth' and percent >= 75) as deep,
          count(distinct visit_id) as visits,
          count(*) filter (where ${INTERACTION}) as interactions
        from ev group by path
      )
      select pv.path, pv.views::int as "views", pv.visitors::int as "visitors",
        coalesce(pe.secs, 0)::float as "engagedSeconds",
        coalesce(pe.deep, 0)::int as "deepScrollVisits",
        coalesce(pe.visits, 0)::int as "pageVisits",
        coalesce(pe.interactions, 0)::int as "interactions"
      from pv left join pe on pe.path = pv.path
      order by pv.views desc
      limit 30
      `),
      q(`
      with ${EVENTS}
      select feature, coalesce(action, '') as action,
        count(*)::int as "uses",
        count(distinct session_id)::int as "visitors",
        count(*) filter (where ok = 'true')::int as "successes",
        coalesce(percentile_cont(0.5) within group (order by seconds), 0)::float as "medianSeconds",
        count(*) filter (where trig = 'auto')::int as "auto"
      from ev
      where event_name = 'feature-use' and feature is not null
      group by feature, action
      order by 3 desc
      limit 30
      `),
      q(`
      with ${VISITS}
      select source,
        count(*)::int as "visits",
        count(*) filter (where ${ENGAGED})::int as "engagedVisits",
        count(*) filter (where wins > 0)::int as "convertedVisits",
        coalesce(avg(engaged), 0)::float as "avgEngagedSeconds"
      from vstats
      group by source
      order by 2 desc
      limit 15
      `),
      q(`
      with ${EVENTS}
      select event_name as "event", coalesce(label, '') as label,
        count(*)::int as "total", count(distinct session_id)::int as "visitors"
      from ev
      where event_name not in ${PASSIVE} and event_name <> 'feature-use'
      group by event_name, label
      order by 3 desc
      limit 25
      `),
      q(`
      with ${EVENTS}
      select coalesce(label, '') as label, path, count(*)::int as "total"
      from ev where event_name = 'rage-click'
      group by label, path order by 3 desc limit 15
      `),
      q(`
      with ${EVENTS}
      select coalesce(message, '') as message, path, count(*)::int as "total"
      from ev where event_name = 'js-error'
      group by message, path order by 3 desc limit 15
      `),
      q(`
      with ${EVENTS}
      select feature, coalesce(action, '') as action, coalesce(status, 0) as status, count(*)::int as "total"
      from ev where event_name = 'feature-use' and ok = 'false'
      group by feature, action, status order by 4 desc limit 15
      `),
    ]);

  return {
    summary: summary[0],
    timeBuckets,
    pages,
    features,
    sources,
    clicks,
    rage,
    errors,
    failures,
  };
}
