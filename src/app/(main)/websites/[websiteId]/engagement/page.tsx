import type { Metadata } from 'next';
import { EngagementPage } from './EngagementPage';

export default async function ({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;

  return <EngagementPage websiteId={websiteId} />;
}

export const metadata: Metadata = {
  title: 'Engagement',
};
