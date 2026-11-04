'use client';
import { Column, Text } from '@umami/react-zen';
import { usePathname } from 'next/navigation';
import { getPageGuide } from '@/lib/page-guides';

// A plain-language explanation of the current stats page; the text lives in lib/page-guides.ts.
export function PageGuide() {
  const pathname = usePathname();
  const guide = getPageGuide(pathname);

  if (!guide) {
    return null;
  }

  return (
    <Column gap="2" paddingBottom="4" style={{ maxWidth: 900 }}>
      <Text color="muted">{guide.summary}</Text>
      {guide.items?.length > 0 && (
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>How to read this page</summary>
          <Column gap="2" style={{ marginTop: 12 }}>
            {guide.items.map(({ term, text }) => (
              <Column key={term}>
                <Text weight="bold">{term}</Text>
                <Text color="muted">{text}</Text>
              </Column>
            ))}
          </Column>
        </details>
      )}
    </Column>
  );
}
