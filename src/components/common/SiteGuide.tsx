'use client';
import { Column, Text } from '@umami/react-zen';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  type SiteGuide as Guide,
  getSiteGuide,
  getSiteSection,
  type SiteStep,
} from '@/lib/site-guides';

function Step({ step, base, index }: { step: SiteStep; base?: string; index?: number }) {
  const href =
    step.href ??
    (base && step.section !== undefined ? `${base}/${step.section}`.replace(/\/$/, '') : null);
  const title = `${index ? `${index}. ` : ''}${step.title}`;

  return (
    <Column gap="1">
      <Text weight="bold">{href ? <Link href={href}>{title}</Link> : title}</Text>
      <Text color="muted">Look at: {step.look}</Text>
      <Text color="muted">Why: {step.why}</Text>
      <Text color="muted">How to read it: {step.read}</Text>
    </Column>
  );
}

// The ordered advice for one project: what success means, what to open first, and what to ignore.
export function ReadingGuide({
  guide,
  base,
  title,
}: {
  guide: Guide;
  base?: string;
  title: string;
}) {
  return (
    <details open style={{ maxWidth: 900, paddingBottom: 16 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{title}</summary>
      <Column gap="3" style={{ marginTop: 12 }}>
        <Text>{guide.goal}</Text>
        {guide.steps.map((step, i) => (
          <Step key={step.title} step={step} base={base} index={i + 1} />
        ))}
        {guide.note && <Text color="muted">Good to know: {guide.note}</Text>}
        {guide.skip && <Text color="muted">Don’t worry about: {guide.skip}</Text>}
      </Column>
    </details>
  );
}

// Per-project advice on a website's pages: the full list on its Overview, and the matching steps elsewhere.
export function SiteGuide() {
  const pathname = usePathname();
  const guide = getSiteGuide(pathname);
  const site = getSiteSection(pathname);

  if (!guide || !site) {
    return null;
  }

  const base = pathname.replace(/\/$/, '').match(/^.*\/websites\/[^/]+/)?.[0];

  if (!site.section) {
    return <ReadingGuide guide={guide} base={base} title={`What to look at for ${guide.name}`} />;
  }

  const steps = guide.steps.filter(step => !step.href && step.section === site.section);

  return steps.length > 0 ? (
    <Column gap="2" paddingBottom="4" style={{ maxWidth: 900 }}>
      <Text weight="bold">On this page, for {guide.name}</Text>
      {steps.map(step => (
        <Step key={step.title} step={step} />
      ))}
    </Column>
  ) : null;
}
