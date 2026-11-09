import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, serverError, unauthorized } from '@/lib/response';
import { canViewUsers } from '@/permissions';
import { getMuseumHopUsage } from '@/queries/sql';

// The admin "MuseumHop" page: visitor and feature usage from this umami database, plus planner
// data (nights, groups, reactions, routes) from MuseumHop's Supabase project through a read-only
// report function that only answers with the report secret. It returns counts, never names; the
// wishes report adds the wish texts (and an email only where the sender chose to leave one).
// Admins only.
export async function GET(request: Request) {
  const schema = z.object({ days: z.coerce.number().int().min(1).max(400).default(30) });
  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - query.days * 86_400_000);

  try {
    const [usage, planner, wishes] = await Promise.all([
      getMuseumHopUsage({ startDate, endDate }),
      plannerReport(),
      wishesReport(),
    ]);

    return json({ days: query.days, usage, planner, wishes });
  } catch (e) {
    return serverError(e);
  }
}

async function plannerReport() {
  return supabaseReport('na_usage_report');
}

// The wish box ("What should I build next?"): counts per event plus the latest wishes, including
// an email address when the sender typed one to get a reply. Admins only, like the rest of this page.
async function wishesReport() {
  return supabaseReport('na_wishes_report');
}

async function supabaseReport(fn: string) {
  const url = process.env.MUSEUMHOP_SUPABASE_URL;
  const key = process.env.MUSEUMHOP_SUPABASE_ANON_KEY;
  const secret = process.env.MUSEUMHOP_REPORT_SECRET;

  if (!url || !key || !secret) {
    return { configured: false };
  }

  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ _secret: secret }),
    cache: 'no-store',
  });

  if (!res.ok) {
    return { configured: true, error: `MuseumHop ${fn} request failed: ${res.status}` };
  }

  const report = await res.json();

  return report ? { configured: true, report } : { configured: true, error: 'Wrong report secret' };
}
