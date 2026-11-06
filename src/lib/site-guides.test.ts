import { describe, expect, test } from 'vitest';
import { getPageGuide } from './page-guides';
import { getSiteGuide, getSiteSection, MUSEUMHOP_READING, SITE_GUIDES } from './site-guides';

const HOPE = '/websites/88d2bb57-b6f3-4272-a928-25756e25ae87';

describe('site guides', () => {
  test('finds the guide by website id, also under a team and on sub-pages', () => {
    expect(getSiteGuide(HOPE)?.name).toBe('Hope');
    expect(getSiteGuide(`/teams/abc${HOPE}/events`)?.name).toBe('Hope');
    expect(getSiteSection(`${HOPE}/events/`)?.section).toBe('events');
  });

  test('stays quiet for other websites and pages', () => {
    expect(getSiteGuide('/websites/unknown')).toBeNull();
    expect(getSiteGuide('/admin/museumhop')).toBeNull();
  });

  test.each(Object.entries(SITE_GUIDES))('%s only links to pages that exist', (id, guide) => {
    expect(guide.steps.length).toBeGreaterThan(0);
    for (const step of guide.steps) {
      expect(step.section !== undefined || step.href).toBeTruthy();
      if (step.section !== undefined) {
        expect(getPageGuide(`/websites/${id}/${step.section}`.replace(/\/$/, ''))).toBeTruthy();
      }
    }
  });

  test('every step says what to look at, why and how to read it', () => {
    for (const { steps } of [...Object.values(SITE_GUIDES), MUSEUMHOP_READING]) {
      for (const step of steps) {
        expect(step.look && step.why && step.read).toBeTruthy();
      }
    }
  });
});
