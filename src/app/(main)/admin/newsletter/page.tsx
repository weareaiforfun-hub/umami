import type { Metadata } from 'next';
import { AdminNewsletterPage } from './AdminNewsletterPage';

export default function () {
  return <AdminNewsletterPage />;
}

export const metadata: Metadata = {
  title: 'Newsletter',
};
