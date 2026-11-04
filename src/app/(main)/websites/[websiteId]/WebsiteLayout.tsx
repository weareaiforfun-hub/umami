'use client';
import { Column } from '@umami/react-zen';
import type { ReactNode } from 'react';
import { WebsiteProvider } from '@/app/(main)/websites/WebsiteProvider';
import { PageBody } from '@/components/common/PageBody';
import { PageGuide } from '@/components/common/PageGuide';
import { WebsiteHeader } from './WebsiteHeader';

export function WebsiteLayout({ websiteId, children }: { websiteId: string; children: ReactNode }) {
  return (
    <WebsiteProvider websiteId={websiteId}>
      <PageBody gap>
        <WebsiteHeader showActions />
        <PageGuide />
        <Column>{children}</Column>
      </PageBody>
    </WebsiteProvider>
  );
}
