import type { Metadata } from 'next';
import { AdminMuseumHopPage } from './AdminMuseumHopPage';

export default function () {
  return <AdminMuseumHopPage />;
}

export const metadata: Metadata = {
  title: 'MuseumHop',
};
