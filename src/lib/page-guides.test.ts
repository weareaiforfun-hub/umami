import { describe, expect, test } from 'vitest';
import { getPageGuide } from './page-guides';

const SITE = '/websites/60baa63a-e856-458d-bccc-7700537a7803';

describe('getPageGuide', () => {
  test.each([
    '',
    '/events',
    '/sessions',
    '/realtime',
    '/performance',
    '/compare',
    '/breakdown',
    '/engagement',
    '/goals',
    '/funnels',
    '/journeys',
    '/retention',
    '/replays',
    '/heatmaps',
    '/segments',
    '/cohorts',
    '/utm',
    '/revenue',
    '/attribution',
    '/settings',
  ])('has a guide for every website page: %s', section => {
    expect(getPageGuide(`${SITE}${section}`)?.summary).toBeTruthy();
  });

  test('works under a team, and for pages below a section', () => {
    expect(getPageGuide(`/teams/abc${SITE}/events`)).toBe(getPageGuide(`${SITE}/events`));
    expect(getPageGuide(`${SITE}/sessions/123`)).toBe(getPageGuide(`${SITE}/sessions`));
  });

  test('tells list pages from detail pages', () => {
    expect(getPageGuide('/links')).not.toBe(getPageGuide('/links/abc'));
    expect(getPageGuide('/websites')).not.toBe(getPageGuide(SITE));
  });

  test('stays quiet on pages without a guide', () => {
    expect(getPageGuide('/settings/profile')).toBeNull();
    expect(getPageGuide(`${SITE}/unknown`)).toBeNull();
  });
});
