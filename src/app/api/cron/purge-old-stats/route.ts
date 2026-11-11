import prisma from '@/lib/prisma';
import { json, serverError, unauthorized } from '@/lib/response';

// Deletes statistics older than 13 months: the retention promised in the "Your data" panels of MuseumHop, ArtHop and
// DocuHop. Vercel Cron calls it once a day (vercel.json). With CRON_SECRET set, Vercel sends it as a bearer token and
// nothing else gets in; without it, only Vercel's cron user agent is accepted. It takes no input: the cut-off is fixed
// here, so even an unwanted call can only delete what is already past its retention.
const RETENTION_MONTHS = 13;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const allowed = secret
    ? request.headers.get('authorization') === `Bearer ${secret}`
    : (request.headers.get('user-agent') ?? '').startsWith('vercel-cron/');

  if (!allowed) {
    return unauthorized();
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  const old = { createdAt: { lt: cutoff } };
  const db = prisma.client;

  try {
    // Children first, so no foreign key blocks a delete; events and sessions only once nothing newer points at them.
    const [eventData, sessionData, revenue, heatmap, replays, events, sessions] =
      await db.$transaction([
        db.eventData.deleteMany({ where: old }),
        db.sessionData.deleteMany({ where: old }),
        db.revenue.deleteMany({ where: old }),
        db.heatmapEvent.deleteMany({ where: old }),
        db.sessionReplay.deleteMany({ where: old }),
        db.websiteEvent.deleteMany({ where: { ...old, eventData: { none: {} } } }),
        db.session.deleteMany({
          where: {
            ...old,
            websiteEvents: { none: {} },
            sessionData: { none: {} },
            revenue: { none: {} },
          },
        }),
      ]);

    return json({
      cutoff: cutoff.toISOString(),
      deleted: {
        eventData: eventData.count,
        sessionData: sessionData.count,
        revenue: revenue.count,
        heatmap: heatmap.count,
        replays: replays.count,
        events: events.count,
        sessions: sessions.count,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
