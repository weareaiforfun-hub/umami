// Plain-language explanations of the stats pages, for readers who don't work with analytics.
// Shown by components/common/PageGuide.tsx: `summary` always, `items` behind "How to read this page".

export interface PageGuideContent {
  summary: string;
  items?: { term: string; text: string }[];
}

const VISITORS = {
  term: 'Visitors',
  text: 'Different people, roughly. There are no cookies, so a visitor is a browser and network seen together: the same person on another device or network counts again.',
};
const VISITS = {
  term: 'Visits',
  text: 'Separate times people used the site. One visitor can have several visits; a visit ends after about 30 minutes without activity.',
};
const VIEWS = {
  term: 'Views',
  text: 'Pages opened or reloaded. A site that is one single page, like MuseumHop, gets few views however much people do on it.',
};
const SMALL_NUMBERS = {
  term: 'Small numbers',
  text: 'Percentages based on a handful of visits move a lot by chance. Compare the counts as well before drawing a conclusion.',
};

const WEBSITE_GUIDES: Record<string, PageGuideContent> = {
  overview: {
    summary:
      'The big picture: how many people came, when, from where and on what. Start here; use the date menu at the top to change the period.',
    items: [
      VISITORS,
      VISITS,
      VIEWS,
      {
        term: 'Bounce rate',
        text: 'Share of visits that saw only one page. Lower is usually better, but on a one-page app like MuseumHop it says very little: people can use it for ten minutes and still count as a bounce.',
      },
      {
        term: 'Visit duration',
        text: 'Average time between the first and last page of a visit. One-page visits can’t be measured this way, so the Engagement page is more reliable.',
      },
      {
        term: 'The small percentages',
        text: 'The change compared with the previous period of the same length, such as yesterday or last week.',
      },
      {
        term: 'Main chart',
        text: 'Visitors and views over time. Use it to spot peaks, such as the moment a post went live.',
      },
      {
        term: 'Weekly traffic',
        text: 'Which days and hours are busiest, with darker or bigger marks for more visitors.',
      },
      SMALL_NUMBERS,
    ],
  },
  events: {
    summary:
      'A list of things people did on the site beyond opening pages, such as clicks and app actions. Each site decides which events it sends.',
    items: [
      {
        term: 'Event',
        text: 'One recorded action, such as button-click or stop-add. Names ending in -click or -use come from the shared tracking code; others are specific to the site.',
      },
      {
        term: 'Event data / properties',
        text: 'Extra detail sent with an event, such as which button it was. Never names, notes or typed text.',
      },
      {
        term: 'Activity',
        text: 'The newest events, one by one, so you can see what is happening.',
      },
    ],
  },
  sessions: {
    summary:
      'Individual visitors, without names: their device, country, and what they did. Use it to follow one anonymous person through the site.',
    items: [
      {
        term: 'Session',
        text: 'One visitor’s record for the period. Open a row to see their timeline of visits and events.',
      },
      {
        term: 'Distinct ID',
        text: 'An identifier a site can send on purpose. Empty when the site doesn’t send one.',
      },
    ],
  },
  realtime: {
    summary:
      'What is happening right now, over the last 30 minutes. Handy just after you post a link somewhere.',
    items: [
      {
        term: 'Activity log',
        text: 'Each view and event as it arrives, newest first.',
      },
    ],
  },
  performance: {
    summary:
      'How fast the site feels for real visitors. Each measure is timed in their browser; it has nothing to do with popularity. Empty means the site doesn’t send speed data.',
    items: [
      {
        term: 'LCP (largest contentful paint)',
        text: 'How long until the main content appears. Good: under 2.5 seconds.',
      },
      {
        term: 'INP (interaction to next paint)',
        text: 'How quickly the page responds to a tap or click. Good: under 200 milliseconds.',
      },
      {
        term: 'CLS (cumulative layout shift)',
        text: 'How much things jump around while loading. Good: under 0.1.',
      },
      {
        term: 'FCP (first contentful paint)',
        text: 'How long until anything at all appears. Good: under 1.8 seconds.',
      },
      {
        term: 'TTFB (time to first byte)',
        text: 'How long the server takes to start answering. Good: under 0.8 seconds.',
      },
      {
        term: 'p50, p75, p95',
        text: 'Percentiles. p75 means 75% of visits were this fast or faster. p50 is the typical visit, p95 is close to the slowest.',
      },
    ],
  },
  compare: {
    summary:
      'Puts two periods side by side, for example this week against last week, to show what grew or shrank.',
    items: [
      {
        term: 'Previous period',
        text: 'The same length of time directly before the one you chose.',
      },
      {
        term: 'Previous year',
        text: 'The same dates one year earlier.',
      },
      SMALL_NUMBERS,
    ],
  },
  breakdown: {
    summary:
      'Build your own table: pick up to a few fields, such as country and device together, to see how they combine.',
    items: [
      {
        term: 'Fields',
        text: 'The columns you split the numbers by. Choose them with the Fields button.',
      },
    ],
  },
  engagement: {
    summary:
      'What people really did, not just whether they arrived: how long they were active, what they clicked, and what got in their way.',
    items: [
      {
        term: 'Where to start',
        text: 'Read "What stands out" first. It puts the main findings into sentences.',
      },
      {
        term: 'Engaged',
        text: 'A generous test: 15+ seconds active, a click, or a second page. High numbers are common.',
      },
      {
        term: 'Conversion',
        text: 'Marketing’s word for a visitor doing the thing you hoped for. Here that’s "Used a feature".',
      },
      {
        term: 'Median',
        text: 'The middle value: half are above it, half below. Better than an average when a few long visits skew the numbers.',
      },
      {
        term: 'Referrer',
        text: 'The site a visitor came from. See Traffic quality by source.',
      },
      SMALL_NUMBERS,
    ],
  },
  goals: {
    summary:
      'A goal is one thing you want visitors to do, such as reach a page or trigger an event. This page shows how many did. It stays empty until you add one.',
    items: [
      {
        term: 'Conversion rate',
        text: 'Share of visitors who reached the goal.',
      },
    ],
  },
  funnels: {
    summary:
      'A funnel is a series of steps, such as open the site, start a night, add a stop. It shows how many people make it through each step and where they drop out. It stays empty until you add one.',
    items: [
      {
        term: 'Drop-off',
        text: 'Share of people lost between two steps. The biggest drop shows what to improve first.',
      },
      {
        term: 'Window',
        text: 'How many minutes someone gets to finish the steps.',
      },
    ],
  },
  journeys: {
    summary:
      'The routes people take: which pages and events follow each other. Thicker lines mean more people went that way.',
    items: [
      {
        term: 'Steps',
        text: 'How many actions in a row to show.',
      },
      {
        term: 'Start and end step',
        text: 'Optional. Limit the picture to people who started or ended at a certain page or event.',
      },
    ],
  },
  retention: {
    summary:
      'How many people come back. Each row is a group who first came on the same day; each column shows how many returned after that many days.',
    items: [
      {
        term: 'Cohort',
        text: 'A group of people who share a starting date.',
      },
      {
        term: 'A one-night event',
        text: 'For a site built around one date, like Museumnacht, low retention afterwards is normal.',
      },
      {
        term: 'A limit',
        text: 'Without cookies, the visitor count resets from time to time, so returning people are undercounted.',
      },
    ],
  },
  replays: {
    summary: 'Recordings of visits, if a site has this switched on. It stays empty otherwise.',
  },
  heatmaps: {
    summary:
      'Shows where on a page people click and how far they scroll, if a site has this switched on. It stays empty otherwise.',
  },
  segments: {
    summary:
      'A segment is a saved filter, such as "visitors from the Netherlands on a phone", that you can reuse across the stats. It stays empty until you add one.',
  },
  cohorts: {
    summary:
      'A cohort is a saved group of people who did something in a certain period, such as everyone who first came in November. It stays empty until you add one.',
  },
  utm: {
    summary:
      'Shows which campaigns brought visitors, based on labels added to links, such as ?utm_source=reddit. Links without those labels don’t appear here.',
    items: [
      { term: 'Source', text: 'Where the link was posted, such as reddit or linkedin.' },
      { term: 'Medium', text: 'The kind of channel, such as email or social.' },
      { term: 'Campaign', text: 'The name of the push, such as museumnacht-launch.' },
      {
        term: 'Term and content',
        text: 'Optional extra labels, for paid keywords or link versions.',
      },
    ],
  },
  revenue: {
    summary:
      'Money earned, if a site sends purchases as events. It stays empty otherwise, as it should for free sites.',
  },
  attribution: {
    summary:
      'Which source gets the credit when someone does what you hoped for, for example a sign-up.',
    items: [
      { term: 'First click', text: 'Credit goes to where the person first found you.' },
      { term: 'Last click', text: 'Credit goes to the last place they came from before acting.' },
      { term: 'Model', text: 'The rule that decides who gets the credit.' },
    ],
  },
  settings: {
    summary:
      'The website’s setup: name, domain, the tracking code, sharing and data options. Nothing here is a statistic.',
  },
};

const OTHER_GUIDES: [RegExp, PageGuideContent][] = [
  [/\/dashboard$/, { summary: 'Your websites at a glance. Open one for its full stats.' }],
  [/\/websites$/, { summary: 'Every site being measured. Open one to see its stats.' }],
  [
    /\/links\/[^/]+$/,
    {
      summary:
        'Stats for one short link: how often it was opened, when, from where and on what device.',
      items: [
        { term: 'Visitors', text: VISITORS.text },
        { term: 'Clicks / views', text: 'How often the link was opened.' },
      ],
    },
  ],
  [/\/links$/, { summary: 'Short tracked links. Share one to see how many people open it.' }],
  [
    /\/pixels\/[^/]+$/,
    {
      summary:
        'Stats for one tracking pixel: how often it loaded, when and where. It counts opens of whatever it’s placed in, such as an email.',
    },
  ],
  [
    /\/pixels$/,
    {
      summary:
        'A pixel is an invisible image placed in an email or on another site. Each time it loads, it counts as a visit.',
    },
  ],
  [/\/boards\/[^/]+$/, { summary: 'A custom page of charts you put together.' }],
  [/\/boards$/, { summary: 'Boards are custom pages combining the charts you care about.' }],
  [
    /\/admin\/museumhop$/,
    {
      summary:
        'Everything about MuseumHop on one page: the top half is usage from these stats, the bottom half ("Planner") is counted from the app’s own database.',
      items: [
        VISITORS,
        VISITS,
        {
          term: 'Usage events',
          text: 'Recorded actions, such as opening an activity or adding a stop.',
        },
        {
          term: 'From visit to a planned night',
          text: 'A funnel: how many people reached each step. The biggest drop shows what to improve first.',
        },
        {
          term: 'Engaged visits',
          text: 'Visits with 15+ seconds of activity, a click, or a second page.',
        },
        {
          term: 'Personal links',
          text: 'Private links that open a night as you on another device.',
        },
        {
          term: 'Crews and meet-ups',
          text: 'Sub-groups within a night, and the points where they rejoin.',
        },
        {
          term: 'Most wanted score',
          text: 'Must-see counts 2, Up for it 1, Skip counts against. Higher means more wanted.',
        },
      ],
    },
  ],
  [
    /\/admin\/newsletter$/,
    {
      summary: 'People subscribed to the Hope newsletter, and how that number changes.',
    },
  ],
];

const SECTIONS = Object.keys(WEBSITE_GUIDES);

export function getPageGuide(pathname: string): PageGuideContent | null {
  const path = pathname.replace(/\/$/, '');
  const website = path.match(/\/websites\/[^/]+(?:\/([^/]+))?/);

  if (website) {
    const section = website[1] ?? 'overview';
    return SECTIONS.includes(section) ? WEBSITE_GUIDES[section] : null;
  }

  return OTHER_GUIDES.find(([pattern]) => pattern.test(path))?.[1] ?? null;
}
