import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, serverError, unauthorized } from '@/lib/response';
import { canViewUsers } from '@/permissions';
import { getMuseumHopUsage } from '@/queries/sql';

// The admin "MuseumHop" page: visitor and feature usage from this umami database, plus planner
// data (nights, groups, reactions, routes) from MuseumHop's Supabase project through a read-only
// report function that only answers with the report secret. It returns counts, never names.
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
    const [usage, planner] = await Promise.all([
      getMuseumHopUsage({ startDate, endDate }),
      plannerReport(),
    ]);

    return json({ days: query.days, usage, planner });
  } catch (e) {
    return serverError(e);
  }
}

async function plannerReport() {
  const url = process.env.MUSEUMHOP_SUPABASE_URL;
  const key = process.env.MUSEUMHOP_SUPABASE_ANON_KEY;
  const secret = process.env.MUSEUMHOP_REPORT_SECRET;

  if (!url || !key || !secret) {
    return { configured: false };
  }

  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/na_usage_report`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ _secret: secret }),
    cache: 'no-store',
  });

  if (!res.ok) {
    return { configured: true, error: `MuseumHop report request failed: ${res.status}` };
  }

  const report = await res.json();

  return report ? { configured: true, report } : { configured: true, error: 'Wrong report secret' };
}
