import type { ReactNode } from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen, within } from '@/test/render';
import { OverviewPage } from './OverviewPage';

const totals = (visitors: number, visits = visitors, views = visits * 2) => ({
  visitors,
  visits,
  views,
  bounces: Math.floor(visits / 2),
  totaltime: visits * 60,
});

const mockData = {
  days: 7,
  startAt: 0,
  endAt: 0,
  unit: 'day',
  buckets: ['2026-11-09T00:00', '2026-11-10T00:00', '2026-11-11T00:00'],
  sites: [
    {
      id: 'a',
      name: 'Alpha',
      domain: 'alpha.example',
      createdAt: '2026-10-01',
      current: totals(30),
      previous: totals(10),
      series: [10, 5, 15],
      viewsSeries: [20, 10, 30],
      lastSeen: new Date(Date.now() - 3 * 3_600_000).toISOString(),
      activeNow: 2,
      topReferrer: { domain: 'google.com', visitors: 7 },
    },
    {
      id: 'b',
      name: 'Beta',
      domain: 'beta.example',
      createdAt: '2026-10-01',
      current: totals(10),
      previous: totals(20),
      series: [0, 10, 0],
      viewsSeries: [0, 20, 0],
      lastSeen: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      activeNow: 0,
      topReferrer: null,
    },
    {
      id: 'c',
      name: 'Quiet',
      domain: 'quiet.example',
      createdAt: '2026-10-01',
      current: totals(0),
      previous: totals(0),
      series: [0, 0, 0],
      viewsSeries: [0, 0, 0],
      lastSeen: null,
      activeNow: 0,
      topReferrer: null,
    },
  ],
};

vi.mock('@/components/hooks', () => ({
  useApi: () => ({
    get: vi.fn(),
    useQuery: () => ({ data: mockData, error: null, isLoading: false }),
  }),
  useNavigation: () => ({ renderUrl: (url: string) => url }),
}));

vi.mock('@/components/common/Favicon', () => ({ Favicon: () => null }));
vi.mock('@/components/common/Link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));
vi.mock('@/components/common/PageBody', () => ({
  PageBody: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/components/common/PageHeader', () => ({
  PageHeader: ({ title, children }: { title: string; children: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {children}
    </header>
  ),
}));
vi.mock('@/components/common/Panel', () => ({
  Panel: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));
vi.mock('@/components/common/LoadingPanel', () => ({
  LoadingPanel: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

test('summarises and ranks every site', async () => {
  const { user } = render(<OverviewPage />);

  expect(
    screen.getByText(/40 visitors came to 2 of your 3 sites, up 33% on the 7 days before/),
  ).toBeTruthy();
  expect(screen.getByText(/Alpha had the most \(30, 75% of all\), then Beta \(10\)/)).toBeTruthy();
  expect(
    screen.getByText(/Biggest rise: Alpha \(\+20\)\. Biggest drop: Beta \(−10\)/),
  ).toBeTruthy();
  expect(screen.getByText(/No visitors: Quiet\./)).toBeTruthy();
  expect(screen.getByText('● 2 now')).toBeTruthy();

  const names = () =>
    within(screen.getByRole('table'))
      .getAllByRole('link')
      .map(a => a.getAttribute('href'));
  expect(names()).toEqual(['/websites/a', '/websites/b', '/websites/c']);

  await user.click(screen.getByRole('button', { name: /Change/ }));
  expect(names()).toEqual(['/websites/a', '/websites/c', '/websites/b']);

  await user.click(screen.getByRole('checkbox'));
  expect(names()).toEqual(['/websites/a', '/websites/b']);
});
