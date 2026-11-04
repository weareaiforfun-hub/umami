import { Grid, Heading, Row, Tab, TabList, TabPanel, Tabs, Text } from '@umami/react-zen';
import { GridRow } from '@/components/common/GridRow';
import { Panel } from '@/components/common/Panel';
import { useMessages, useMobile } from '@/components/hooks';
import { MetricsTable } from '@/components/metrics/MetricsTable';
import { WeeklyTraffic } from '@/components/metrics/WeeklyTraffic';
import { WorldMap } from '@/components/metrics/WorldMap';

export function WebsitePanels({ websiteId }: { websiteId: string }) {
  const { t, labels } = useMessages();
  const tableProps = {
    websiteId,
    limit: 10,
    allowDownload: false,
    showMore: true,
    metric: t(labels.visitors),
  };
  const rowProps = { minHeight: '570px' };
  const { isMobile } = useMobile();

  return (
    <Grid gap="3">
      <GridRow layout="two" {...rowProps}>
        <Panel>
          <Heading size="2xl">{t(labels.pages)}</Heading>
          <Text color="muted">
            Which pages people saw. Path is the page's address after the site name, and / is the
            home page, so a one-page app like MuseumHop only ever shows /. URL also includes extras
            such as ?utm_source=reddit. Entry page is where visits started; Exit page is where they
            ended.
          </Text>
          <Tabs>
            <TabList>
              <Tab id="path">{t(labels.path)}</Tab>
              <Tab id="fullPath">{t(labels.url)}</Tab>
              <Tab id="entry">{t(labels.entry)}</Tab>
              <Tab id="exit">{t(labels.exit)}</Tab>
            </TabList>
            <TabPanel id="path">
              <MetricsTable type="path" title={t(labels.path)} {...tableProps} />
            </TabPanel>
            <TabPanel id="fullPath">
              <MetricsTable type="fullPath" title={t(labels.url)} {...tableProps} />
            </TabPanel>
            <TabPanel id="entry">
              <MetricsTable type="entry" title={t(labels.path)} {...tableProps} />
            </TabPanel>
            <TabPanel id="exit">
              <MetricsTable type="exit" title={t(labels.path)} {...tableProps} />
            </TabPanel>
          </Tabs>
        </Panel>
        <Panel>
          <Heading size="2xl">{t(labels.sources)}</Heading>
          <Text color="muted">
            Where visitors came from. Referrers are the exact sites; Channels group them into types
            such as social, search or direct. Direct means unknown: typed links and often WhatsApp
            or email.
          </Text>
          <Tabs>
            <TabList>
              <Tab id="referrer">{t(labels.referrers)}</Tab>
              <Tab id="channel">{t(labels.channels)}</Tab>
            </TabList>
            <TabPanel id="referrer">
              <MetricsTable type="referrer" title={t(labels.referrer)} {...tableProps} />
            </TabPanel>
            <TabPanel id="channel">
              <MetricsTable type="channel" title={t(labels.channel)} {...tableProps} />
            </TabPanel>
          </Tabs>
        </Panel>
      </GridRow>

      <GridRow layout="two" {...rowProps}>
        <Panel>
          <Heading size="2xl">{t(labels.environment)}</Heading>
          <Text color="muted">
            What people used: their browser, operating system (OS, such as iOS or Android) and
            device type. Useful for knowing what to test on.
          </Text>
          <Tabs>
            <TabList>
              <Tab id="browser">{t(labels.browsers)}</Tab>
              <Tab id="os">{t(labels.os)}</Tab>
              <Tab id="device">{t(labels.devices)}</Tab>
            </TabList>
            <TabPanel id="browser">
              <MetricsTable type="browser" title={t(labels.browser)} {...tableProps} />
            </TabPanel>
            <TabPanel id="os">
              <MetricsTable type="os" title={t(labels.os)} {...tableProps} />
            </TabPanel>
            <TabPanel id="device">
              <MetricsTable type="device" title={t(labels.device)} {...tableProps} />
            </TabPanel>
          </Tabs>
        </Panel>

        <Panel>
          <Heading size="2xl">{t(labels.location)}</Heading>
          <Text color="muted">
            Where visitors were, estimated from their internet connection. Countries are fairly
            reliable; regions and cities are rougher.
          </Text>
          <Tabs>
            <TabList>
              <Tab id="country">{t(labels.countries)}</Tab>
              <Tab id="region">{t(labels.regions)}</Tab>
              <Tab id="city">{t(labels.cities)}</Tab>
            </TabList>
            <TabPanel id="country">
              <MetricsTable type="country" title={t(labels.country)} {...tableProps} />
            </TabPanel>
            <TabPanel id="region">
              <MetricsTable type="region" title={t(labels.region)} {...tableProps} />
            </TabPanel>
            <TabPanel id="city">
              <MetricsTable type="city" title={t(labels.city)} {...tableProps} />
            </TabPanel>
          </Tabs>
        </Panel>
      </GridRow>

      <GridRow layout="two-one" {...rowProps}>
        <Panel paddingX="0" paddingY="0" style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
          <Text color="muted" style={{ padding: 16 }}>
            Visitors by country: darker countries had more visitors.
          </Text>
          <WorldMap websiteId={websiteId} />
        </Panel>

        <Panel>
          <Heading size="2xl">{t(labels.traffic)}</Heading>
          <Text color="muted">
            The busiest days and hours of the week, shown with bigger marks for more visitors.
          </Text>
          <Row border="bottom" marginBottom="4" />
          <WeeklyTraffic websiteId={websiteId} />
        </Panel>
      </GridRow>
    </Grid>
  );
}
