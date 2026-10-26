import { parseRequest } from '@/lib/request';
import { json, serverError, unauthorized } from '@/lib/response';
import { canViewUsers } from '@/permissions';

// Hope newsletter subscribers for the admin "Newsletter" page. Data comes from the Hope
// Supabase project through a read-only function that only answers with the report secret,
// so this server holds no database key beyond the public one. Admins only.
export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  const url = process.env.HOPE_SUPABASE_URL;
  const key = process.env.HOPE_SUPABASE_ANON_KEY;
  const secret = process.env.HOPE_NEWSLETTER_REPORT_SECRET;

  if (!url || !key || !secret) {
    return json({ configured: false, subscribers: [] });
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/newsletter_subscribers_report`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ _secret: secret }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return serverError(new Error(`Hope report request failed: ${res.status}`));
    }

    return json({ configured: true, subscribers: await res.json() });
  } catch (e) {
    return serverError(e);
  }
}
