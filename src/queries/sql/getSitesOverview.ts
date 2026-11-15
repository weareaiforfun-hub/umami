import { CLICKHOUSE, notImplemented, PRISMA, runQuery } from '@/lib/db';
import prisma from '@/lib/prisma';

// Every website side by side for the "Overview" page: visitors, visits, views, bounces and time
// for a period and for the period of the same length before it, a trend series per website, the
// last time each was visited and who is on it right now. Counts follow umami's own website stats
// (getWebsiteStats): a visit only counts when it has a page view, link or pixel hit.
// PostgreSQL only.

export interface SiteTotals {
  visitors: number;
  visits: number;
  views: number;
  bounces: number;
  totaltime: number;
}

export interface SiteOverview {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
  current: SiteTotals;
  previous: SiteTotals;
  series: number[];
  viewsSeries: number[];
  lastSeen: string | null;
  activeNow: number;
  topReferrer: { domain: string; visitors: number } | null;
}

export interface SitesOverview {
  unit: 'hour' | 'day' | 'week';
  buckets: string[];
  sites: SiteOverview[];
}

export interface SitesOverviewFilters {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  unit: 'hour' | 'day' | 'week';
  timezone: string;
  // null = every website (admins); otherwise the websites this user or their teams own.
  userId: string | null;
}

const FUNCTION_NAME = 'getSitesOverview';

export async function getSitesOverview(
  ...args: [filters: SitesOverviewFilters]
): Promise<SitesOverview> {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: notImplemented,
  });
}

const EMPTY: SiteTotals = { visitors: 0, visits: 0, views: 0, bounces: 0, totaltime: 0 };

async function relationalQuery({
  startDate,
  endDate,
  prevStartDate,
  unit,
  timezone,
  userId,
}: SitesOverviewFilters): Promise<SitesOverview> {
  const { rawQuery } = prisma;
  const params = {
    startDate,
    endDate,
    prevStartDate,
    unit,
    timezone,
    userId,
    step: `1 ${unit}`,
    activeSince: new Date(endDate.getTime() - 5 * 60_000),
  };
  const q = (sql: string) => rawQuery(sql, params, FUNCTION_NAME);

  const SITES = `sites as (
    select website_id, name, domain, created_at, reset_at from website
    where deleted_at is null
    ${
      userId
        ? `and (user_id = {{userId::uuid}}
        or team_id in (select team_id from team_user where user_id = {{userId::uuid}}))`
        : ''
    }
  )`;
  // Page views, link and pixel hits (not custom events or performance beacons), after any reset.
  const HITS = `we.event_type not in (2, 5) and (s.reset_at is null or we.created_at > s.reset_at)`;

  const [sites, totals, series, buckets, lastSeen, active, referrers] = await Promise.all([
    q(
      `with ${SITES} select website_id as "id", name, domain, created_at as "createdAt" from sites order by name`,
    ),
    q(`
      with ${SITES}, t as (
        select we.website_id, we.created_at >= {{startDate}} as cur, we.session_id, we.visit_id,
          sum(case when we.event_type not in (2, 5) then 1 else 0 end) as c,
          min(case when we.event_type not in (2, 5) then we.created_at end) as min_time,
          max(case when we.event_type not in (2, 5) then we.created_at end) as max_time,
          max(case when we.event_type = 2 then 1 else 0 end) as has_custom_event
        from website_event we join sites s on s.website_id = we.website_id
        where we.created_at between {{prevStartDate}} and {{endDate}}
          and we.event_type != 5
          and (s.reset_at is null or we.created_at > s.reset_at)
        group by 1, 2, 3, 4
        having sum(case when we.event_type not in (2, 5) then 1 else 0 end) > 0
      )
      select website_id as "id", cur,
        count(distinct session_id)::int as "visitors",
        count(distinct visit_id)::int as "visits",
        coalesce(sum(c), 0)::int as "views",
        coalesce(sum(case when c = 1 and has_custom_event = 0 then 1 else 0 end), 0)::int as "bounces",
        coalesce(sum(extract(epoch from max_time - min_time)), 0)::int as "totaltime"
      from t group by 1, 2
    `),
    q(`
      with ${SITES}
      select we.website_id as "id",
        to_char(date_trunc({{unit}}, we.created_at at time zone {{timezone}}), 'YYYY-MM-DD"T"HH24:MI') as "t",
        count(distinct we.session_id)::int as "visitors",
        count(*)::int as "views"
      from website_event we join sites s on s.website_id = we.website_id
      where we.created_at between {{startDate}} and {{endDate}} and ${HITS}
      group by 1, 2
    `),
    q(`
      select to_char(g, 'YYYY-MM-DD"T"HH24:MI') as "t"
      from generate_series(
        date_trunc({{unit}}, {{startDate}}::timestamptz at time zone {{timezone}}),
        date_trunc({{unit}}, {{endDate}}::timestamptz at time zone {{timezone}}),
        {{step}}::interval
      ) as g
    `),
    q(`
      with ${SITES}
      select s.website_id as "id",
        (select max(we.created_at) from website_event we
          where we.website_id = s.website_id and ${HITS}) as "lastSeen"
      from sites s
    `),
    q(`
      with ${SITES}
      select we.website_id as "id", count(distinct we.session_id)::int as "visitors"
      from website_event we join sites s on s.website_id = we.website_id
      where we.created_at >= {{activeSince}} and we.event_type != 5
      group by 1
    `),
    q(`
      with ${SITES}, r as (
        select we.website_id, we.referrer_domain as domain, count(distinct we.session_id)::int as visitors
        from website_event we join sites s on s.website_id = we.website_id
        where we.created_at between {{startDate}} and {{endDate}} and ${HITS}
          and we.referrer_domain is not null and we.referrer_domain != ''
          and we.referrer_domain != coalesce(s.domain, '')
          and we.referrer_domain != 'www.' || coalesce(s.domain, '')
        group by 1, 2
      )
      select distinct on (website_id) website_id as "id", domain, visitors
      from r order by website_id, visitors desc, domain
    `),
  ]);

  const bucketList: string[] = buckets.map((b: { t: string }) => b.t);
  const index = new Map(bucketList.map((t, i) => [t, i]));

  return {
    unit,
    buckets: bucketList,
    sites: sites.map((s: any) => {
      const row = (cur: boolean) => totals.find((t: any) => t.id === s.id && t.cur === cur);
      const pick = (r: any): SiteTotals =>
        r
          ? {
              visitors: r.visitors,
              visits: r.visits,
              views: r.views,
              bounces: r.bounces,
              totaltime: r.totaltime,
            }
          : { ...EMPTY };
      const visitors = bucketList.map(() => 0);
      const views = bucketList.map(() => 0);

      for (const p of series) {
        if (p.id !== s.id) continue;
        const i = index.get(p.t);
        if (i === undefined) continue;
        visitors[i] = p.visitors;
        views[i] = p.views;
      }

      const ref = referrers.find((r: any) => r.id === s.id);

      return {
        id: s.id,
        name: s.name,
        domain: s.domain,
        createdAt: s.createdAt,
        current: pick(row(true)),
        previous: pick(row(false)),
        series: visitors,
        viewsSeries: views,
        lastSeen: lastSeen.find((l: any) => l.id === s.id)?.lastSeen ?? null,
        activeNow: active.find((a: any) => a.id === s.id)?.visitors ?? 0,
        topReferrer: ref ? { domain: ref.domain, visitors: ref.visitors } : null,
      };
    }),
  };
}
