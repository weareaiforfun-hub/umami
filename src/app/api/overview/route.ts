import { z } from 'zod';
import { isValidTimezone, normalizeTimezone } from '@/lib/date';
import { parseRequest } from '@/lib/request';
import { json, serverError, unauthorized } from '@/lib/response';
import { getSitesOverview } from '@/queries/sql';

// The "Overview" page: every website the signed-in user can see, side by side, for the last
// `days` days compared with the `days` before that. Admins see every website.
export async function GET(request: Request) {
  const schema = z.object({
    days: z.coerce
      .number()
      .int()
      .refine(d => [1, 7, 30, 90, 365].includes(d))
      .default(7),
    timezone: z.string().max(64).optional(),
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!auth?.user) {
    return unauthorized();
  }

  const timezone =
    query.timezone && isValidTimezone(query.timezone)
      ? normalizeTimezone(query.timezone)
      : 'Europe/Amsterdam';
  const span = query.days * 86_400_000;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - span);
  const prevStartDate = new Date(startDate.getTime() - span);
  const unit = query.days <= 1 ? 'hour' : query.days <= 90 ? 'day' : 'week';

  try {
    const data = await getSitesOverview({
      startDate,
      endDate,
      prevStartDate,
      unit,
      timezone,
      userId: auth.user.isAdmin ? null : auth.user.id,
    });

    return json({ days: query.days, timezone, startAt: +startDate, endAt: +endDate, ...data });
  } catch (e) {
    return serverError(e);
  }
}
