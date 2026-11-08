// What to look at first for each arian-shafa.xyz project, and how to read it.
// Shown by components/common/SiteGuide.tsx. Sites are matched by website id, because the main site
// and its Quoth page share one domain. Keep the advice true to what each site actually sends.

export interface SiteStep {
  title: string;
  /** A website page such as 'engagement'; empty for the Overview. Leave out if there is no page to open. */
  section?: string;
  /** A full link, for steps that lead somewhere other than this website's pages. */
  href?: string;
  look: string;
  why: string;
  read: string;
}

export interface SiteGuide {
  name: string;
  goal: string;
  steps: SiteStep[];
  note?: string;
  skip?: string;
}

const MUSEUMHOP_ID = '60baa63a-e856-458d-bccc-7700537a7803';

const NO_CAMPAIGN_TAGS =
  'Campaign tags (utm_source) aren’t recorded on this site, so the UTM page stays empty. Use Referrers on the Overview to see where people came from. Links opened from WhatsApp and many apps show up as direct traffic.';

const WHERE_FROM: SiteStep = {
  title: 'Where people came from',
  section: '',
  look: 'The Referrers panel, next to the peaks in the main chart.',
  why: 'It shows which posts and places are worth repeating.',
  read: 'Judge a source by what its visitors do, not by how many it sends. Traffic quality by source on the Engagement page shows this.',
};

export const SITE_GUIDES: Record<string, SiteGuide> = {
  '337739b6-0b9c-4dc0-a4d5-2a65ee574b85': {
    name: 'the main site',
    goal: 'Your portfolio. It works when the right people contact you, take your CV, or go on to your projects.',
    steps: [
      {
        title: 'Contact and CV',
        section: 'events',
        look: 'contact-click and cv-download.',
        why: 'These are the closest thing this site has to a result. Everything else leads up to them.',
        read: 'A few are worth more than hundreds of views. If visitors rise and these don’t, the site is getting attention but not action.',
      },
      {
        title: 'What draws interest',
        section: 'events',
        look: 'project-click, dashboard-click, writing-click and read-more, split by name in the event properties.',
        why: 'It shows which work people actually want to see.',
        read: 'Move the projects people choose towards the top. Remove or rewrite what nobody opens.',
      },
      {
        title: 'How far people get',
        section: 'funnels',
        look: 'Your saved funnels, such as Visit → CV section → CV download and Visit → Contact section → contact click.',
        why: 'Sections low on the page only help if people reach them.',
        read: 'A big fall between two sections means the first one loses people. If contact falls far below the top section, make the way to contact you easier to reach.',
      },
      WHERE_FROM,
    ],
    note: NO_CAMPAIGN_TAGS,
    skip: 'Bounce rate. This is a single long page, so reading all of it can still count as a bounce.',
  },
  '24a8fc44-03b1-469d-9ff7-a907fda4cab5': {
    name: 'the Quoth page',
    goal: 'The page for your Mac dictation app. It works when visitors try the demo and then download.',
    steps: [
      {
        title: 'Downloads',
        section: 'events',
        look: 'website-download-click, compared with visitors for the same period.',
        why: 'This is the one result the page exists for.',
        read: 'Treat this as interest, not installs: a click doesn’t prove someone installed the app.',
      },
      {
        title: 'Did the demo convince them?',
        section: 'events',
        look: 'quoth-demo-dictation, quoth-demo-menu and quoth-tour-section.',
        why: 'The demo is how a visitor can feel the product before installing it.',
        read: 'If many people try the demo and few download, the doubt is about installing, so look at the setup text. If few try it, move it higher.',
      },
      {
        title: 'What gets seen',
        section: 'heatmaps',
        look: 'How far people scroll compared with where the download button sits.',
        why: 'A button below where most people stop gets missed.',
        read: 'If most visitors stop above the install section, add a download button earlier.',
      },
      WHERE_FROM,
    ],
    note: NO_CAMPAIGN_TAGS,
  },
  '88d2bb57-b6f3-4272-a928-25756e25ae87': {
    name: 'Hope',
    goal: 'Good news people come back for. Return visits and newsletter readers matter more than any one big day.',
    steps: [
      {
        title: 'Do people come back?',
        section: 'retention',
        look: 'How many visitors return in the days after their first visit.',
        why: 'A news site is a habit. Without returns, every visitor has to be found again.',
        read: 'Watch whether it improves over time. Visitor IDs normally reset each month and people on other devices count as new, so real returns are higher than shown.',
      },
      {
        title: 'Newsletter growth',
        href: '/admin/newsletter',
        look: 'New subscribers, and whether the total keeps rising.',
        why: 'A subscriber is the one reader you can reach again without them remembering you.',
        read: 'Check the Newsletter sign-up funnel too: if people start but the Newsletter confirmed goal doesn’t rise, the confirmation step is losing them.',
      },
      {
        title: 'Which pages hold attention',
        section: 'engagement',
        look: 'Pages: attention, not just views, for Today, Past & Present and Hopeful Past.',
        why: 'It shows which kind of story people actually read.',
        read: 'Long active time with few views means a good page that needs more visibility. Many views with little time means people leave quickly.',
      },
      {
        title: 'Is signing up working?',
        section: 'engagement',
        look: 'Features and Friction, for subscribe-newsletter and confirm-subscription.',
        why: 'A failing sign-up loses readers silently.',
        read: 'Any regular failure here is worth fixing before anything else.',
      },
    ],
    note: NO_CAMPAIGN_TAGS,
    skip: 'Daily visitor swings. Read this site week by week.',
  },
  '2e1d621e-8492-439d-9a71-16f33789d312': {
    name: 'Career AI',
    goal: 'Career tools for people in a stressful moment. It works when someone finishes a tool and gets a useful result.',
    steps: [
      {
        title: 'Do the AI tools work?',
        section: 'engagement',
        look: 'Features: success rate and waiting time for each tool, such as analyze-resume, generate-cover-letter, interview-coach and legal-review.',
        why: 'A failed or slow result is the worst experience here, and these people need it to work.',
        read: 'Fix failures first, then the slowest tool. Check Friction too for errors around the same time.',
      },
      {
        title: 'Which needs bring people',
        section: 'engagement',
        look: 'Pages: attention, not just views, across the tool and guide pages.',
        why: 'It shows which problem people came with: a CV, a layoff, a non-compete or a salary talk.',
        read: 'Pages with long active time are real needs. Use them to choose what to improve and what to write about.',
      },
      {
        title: 'From tool to feedback',
        section: 'funnels',
        look: 'Your saved funnel, Tool to AI feedback, and the Notebook opened goal.',
        why: 'It shows whether people who open a tool get any help from it.',
        read: 'Improve the step with the biggest drop first. If people open a tool but don’t reach feedback, the form may ask too much.',
      },
      {
        title: 'Where people go next',
        section: 'journeys',
        look: 'The common paths after the first tool.',
        why: 'People moving between tools shows which ones belong together.',
        read: 'Link tools that people already use one after another.',
      },
    ],
    note: `${NO_CAMPAIGN_TAGS} Hardly anyone had visited by November 2026, so these steps become useful once people arrive. Please read this site in totals only. Its visitors may be dealing with job loss, so avoid going through individual sessions: the privacy page says no personal profile is built.`,
  },
  'e46b4df8-dbd1-46c3-ba7a-72f3465d7600': {
    name: 'AI Bubble Tracker',
    goal: 'A data site people trust and revisit. It works when they explore the numbers, not just the headline.',
    steps: [
      {
        title: 'What brought people in',
        section: '',
        look: 'Peaks in the main chart, with Referrers beside them.',
        why: 'This site will often move with AI news and shared posts.',
        read: 'Add an annotation for each post or update, so you can later tell which ones caused a peak.',
      },
      {
        title: 'Do people go deeper?',
        section: 'funnels',
        look: 'Your saved funnel, Overview to deep dive, and the Deep dive viewed goal.',
        why: 'Going past the first page shows real interest in the data.',
        read: 'If nearly everyone stays on Overview, make the way to the deeper pages clearer.',
      },
      {
        title: 'Which charts get touched',
        section: 'heatmaps',
        look: 'Clicks and scrolling on Overview and Data.',
        why: 'It shows which numbers people care about.',
        read: 'Clicks on something that does nothing show what people expected to be able to open.',
      },
      {
        title: 'Do people come back?',
        section: 'retention',
        look: 'Returns in the days after a first visit.',
        why: 'A tracker is only worth updating if people check it again.',
        read: 'Compare the period after a monthly data update with the weeks before it.',
      },
    ],
    note: NO_CAMPAIGN_TAGS,
    skip: 'The /status page. That one is for you, not for visitors, so leave it out when judging the site.',
  },
  '148819aa-8e0e-4d1b-8bd5-4b145041acad': {
    name: 'To One',
    goal: 'Paste a website, get a go-to-market plan. It works when someone gets a report and finds it worth keeping or sharing.',
    steps: [
      {
        title: 'From analysis to posts',
        section: 'funnels',
        look: 'Your saved funnel, Analysis to posts, and the Topics reached goal.',
        why: 'It shows whether people go on to use the plan once they have it.',
        read: 'A drop right after the analysis means the report isn’t leading anywhere. If the analysis itself fails, see the next step.',
      },
      {
        title: 'Does the analysis finish?',
        section: 'engagement',
        look: 'Features: success rate and waiting time for analyze-website, generate-posts and visibility.',
        why: 'These depend on free AI services, which can be slow or run out.',
        read: 'Rising failures or long waits usually mean a provider limit, so check these before changing the page.',
      },
      {
        title: 'Was it worth keeping?',
        section: 'events',
        look: 'feature-use for share and survey, and button-click for exports.',
        why: 'Sharing a report is a much stronger signal than opening one.',
        read: 'Compare with finished analyses. Your survey results page shows what people actually said.',
      },
      {
        title: 'Which modules get read',
        section: 'engagement',
        look: 'Pages: attention, not just views, for the module and topic pages.',
        why: 'It shows which advice people value.',
        read: 'Put the most-used modules first, and rethink the ones nobody opens.',
      },
    ],
    note: `${NO_CAMPAIGN_TAGS} Hardly anyone had visited by November 2026, so these steps become useful once people arrive.`,
  },
  '6430db90-7aa9-4807-83fe-105910e64408': {
    name: 'FinLit',
    goal: 'Financial literacy for 18 to 25 year-olds. It works when they try something hands-on and learn from it.',
    steps: [
      {
        title: 'What they try first',
        section: 'engagement',
        look: 'Pages: attention, not just views, for Learn, Calculators, Simulations and the Financial Checkup.',
        why: 'It shows which way of learning suits this age group.',
        read: 'Lead with what holds attention longest, even if it isn’t what you expected.',
      },
      {
        title: 'Do they finish a lesson?',
        section: 'heatmaps',
        look: 'How far people scroll on Learn topic pages.',
        why: 'A topic only teaches if people reach the end.',
        read: 'If most stop at the same spot, that part is too long or too hard.',
      },
      {
        title: 'Do AI features work?',
        section: 'engagement',
        look: 'Features: generate-learn-more, generate-scenario and generate-survival-guide.',
        why: 'A slow or failed result breaks the moment of learning.',
        read: 'Fix failures first. Few uses means people may not notice the feature.',
      },
      {
        title: 'Phone experience',
        section: 'performance',
        look: 'Load speed, with the Device panel on the Overview.',
        why: 'This age group will mostly use a phone.',
        read: 'If most visits are on phones, test calculators and simulations there first.',
      },
    ],
    note: `${NO_CAMPAIGN_TAGS} Nobody had visited by November 2026, so these steps become useful once people arrive. Your saved Learn to check-up funnel then shows whether lessons lead on to the check-up.`,
  },
  '84f1adb9-722b-402c-a956-58eb974ba156': {
    name: 'Go Dojo',
    goal: 'Teach Go by playing. It works when people place stones quickly, move through lessons and come back to practise.',
    steps: [
      {
        title: 'Lesson by lesson',
        section: 'journeys',
        look: 'Paths through /learn and the views of each lesson.',
        why: 'Each lesson page is a step, so falling views show exactly where learners stop.',
        read: 'A sharp fall after one lesson means that lesson is too hard or too long. Fix the earliest big drop first.',
      },
      {
        title: 'Do they start playing?',
        section: 'funnels',
        look: 'Your saved funnel, Home → learn → practice, and the Played a game goal.',
        why: 'Learning here comes from doing, not reading.',
        read: 'If many open lessons but few practise or play, make that next step more obvious.',
      },
      {
        title: 'Do they come back?',
        section: 'retention',
        look: 'Returns in the days after a first visit.',
        why: 'Skill comes from repeated practice, so returning matters more than one long visit.',
        read: 'Watch for improvement over time. Compare it after any change to practice.',
      },
      {
        title: 'Is anything broken or confusing?',
        section: 'engagement',
        look: 'Friction: JavaScript errors, then rage clicks on lesson and play pages.',
        why: 'Repeated clicks on the board can mean a move isn’t accepted and people don’t know why.',
        read: 'This site has recorded repeated errors, so look at those first. Rage clicks clustered on one lesson point to unclear feedback.',
      },
    ],
    note: NO_CAMPAIGN_TAGS,
  },
  '0ccc6605-eae5-44f2-9e83-a347f6f7d7b8': {
    name: 'LearnOptimism',
    goal: 'Teach optimism through practice. It works when people keep practising, not when they read one module.',
    steps: [
      {
        title: 'Do they come back?',
        section: 'retention',
        look: 'Returns in the days after a first visit.',
        why: 'Changing how you think takes repeated practice.',
        read: 'This is the main number here. A long first visit with no return means interest, not a habit.',
      },
      {
        title: 'From learning to practice',
        section: 'funnels',
        look: 'Your saved funnel, Home → learn → practice, and the Used journal goal.',
        why: 'The value is in practice, so people need to reach it.',
        read: 'If most stop before practice, link clearly to one first exercise.',
      },
      {
        title: 'Which parts get used',
        section: 'engagement',
        look: 'Pages: attention, not just views, for Practice, Journal, Insights and Progress.',
        why: 'Time in Practice and Journal is the closest sign of real use.',
        read: 'Time on Progress with little on Practice means people check in but don’t do the work.',
      },
      {
        title: 'What people tell you',
        section: 'events',
        look: 'The feedback event and its properties.',
        why: 'It’s the only place visitors say what they thought.',
        read: 'Counts are small here, so read it as hints rather than proof.',
      },
    ],
    note: NO_CAMPAIGN_TAGS,
  },
  'e38369e4-42f4-4c03-890d-eba8ea98c404': {
    name: 'Verzuim dashboard (version 1)',
    goal: 'A proof of concept on Dutch sick-leave data. It works when people use the dashboard rather than just glance at it.',
    steps: [
      {
        title: 'Do people explore?',
        section: 'events',
        look: 'filter-change and chart-click, compared with visits.',
        why: 'A dashboard earns its place when people ask it their own questions.',
        read: 'Compare with version 2 over the same dates, using actions per visit. By November 2026 this version had shown none of these, but with so few visitors that proves little.',
      },
      {
        title: 'Which views matter',
        section: 'events',
        look: 'The event properties of filter-change.',
        why: 'It shows which cuts of the data people want.',
        read: 'Make the most-used filters the most visible.',
      },
      {
        title: 'Where attention goes',
        section: 'heatmaps',
        look: 'Clicks and scrolling across the charts.',
        why: 'It shows which charts are read and which are skipped.',
        read: 'Clicks on charts that don’t respond show what people expected to do.',
      },
      {
        title: 'Who looked',
        section: '',
        look: 'Referrers and countries.',
        why: 'With a proof of concept, who visits matters more than how many.',
        read: 'Very few visits are normal here, so read each number as a hint.',
      },
    ],
    note: NO_CAMPAIGN_TAGS,
  },
  '81bf5aba-2738-465a-a9b6-7703960b6fe4': {
    name: 'Verzuim dashboard (version 2)',
    goal: 'The restyled version of the same data. Its question is simple: does this design get people exploring more than version 1?',
    steps: [
      {
        title: 'Against version 1',
        section: 'events',
        look: 'filter-change and chart-click per visit for the same dates on both sites, plus the Visit → filter → chart drill-down funnel.',
        why: 'The data is the same, so a difference points to the design.',
        read: 'Use actions per visit, not totals, because either site may have been shared more widely.',
      },
      {
        title: 'Time spent',
        section: 'engagement',
        look: 'Active time per visit, next to version 1.',
        why: 'Time alone is unclear: it can mean interest or confusion.',
        read: 'More time with more actions is good. More time with fewer actions suggests confusion, so check Friction too.',
      },
      {
        title: 'Where attention goes',
        section: 'heatmaps',
        look: 'Clicks and scrolling across the charts.',
        why: 'It shows whether the new layout puts the important charts in view.',
        read: 'If people no longer reach a chart they used in version 1, move it up.',
      },
    ],
    note: NO_CAMPAIGN_TAGS,
  },
  [MUSEUMHOP_ID]: {
    name: 'MuseumHop',
    goal: 'A planner for one night. It works when groups make a plan together and use it during Museumnacht.',
    steps: [
      {
        title: 'Your main page',
        href: '/admin/museumhop',
        look: 'The MuseumHop admin page, and the reading guide at its top.',
        why: 'It combines these stats with the planner’s own numbers, so it answers far more than this page can.',
        read: 'Start there. Use the pages below only for the questions it doesn’t cover.',
      },
      {
        title: 'Which channel worked',
        section: 'utm',
        look: 'Visitors per utm_source.',
        why: 'It tells you which places to use next year.',
        read: 'Tags only started being recorded in November 2026, so earlier visits have none. People who share a link without the tag will show as direct.',
      },
      {
        title: 'On the night',
        section: 'realtime',
        look: 'Current visitors and errors as they happen.',
        why: 'It’s the quickest way to spot a problem while people are out.',
        read: 'Sudden silence during the event is more alarming than a dip. Check that the site opens on your phone.',
      },
      {
        title: 'Phone speed',
        section: 'performance',
        look: 'Load speed on phones.',
        why: 'People will open this on mobile data, outside, between venues.',
        read: 'Slower numbers on the night can simply reflect a busy network.',
      },
    ],
    skip: 'Bounce rate and Views. MuseumHop is one page, so someone can plan for ten minutes and still count as one view and a bounce.',
  },
  '66f795fe-4ad5-4cad-939e-35692e289d94': {
    name: 'the old MuseumHopper address',
    goal: 'Only forwards people to MuseumHop. It works when traffic here fades to nothing.',
    steps: [
      {
        title: 'Is it still used?',
        section: 'events',
        look: 'forward events over time.',
        why: 'It tells you when the old address can be retired.',
        read: 'Check it after Museumnacht. While people still arrive, keep the forward running.',
      },
    ],
  },
};

export const MUSEUMHOP_READING: SiteGuide = {
  name: 'MuseumHop',
  goal: 'A group of two or more with at least two stops on a shared route is your main result: one group that actually planned together. Read this page by moment, because the questions change around the night itself.',
  steps: [
    {
      title: 'Before the night: are people getting to a plan?',
      look: 'Groups with a real plan in Planner: nights and people, then From visit to a planned night.',
      why: 'Visitors alone say little. A group with a plan is what the app is for.',
      read: 'Find the biggest drop in the funnel and work on that step only. The last three steps can happen in any order, so a later one can be higher: judge the drops up to In a night. If many people look but few enter a night, the first step needs to be clearer. If many enter but few add stops, they aren’t sure what to do next.',
    },
    {
      title: 'Before the night: is it spreading?',
      look: 'Group sizes, the Nights table (time to second member), and invite-copy against night-join in Features used.',
      why: 'One person inviting friends is your cheapest way to grow.',
      read: 'Lots of solo nights means inviting isn’t happening. Invites copied with few joins means friends get the link but don’t act on it.',
    },
    {
      title: 'Before the night: can people get back in?',
      look: 'Personal links and Emails on file in the planner, and get-back-in in Features used.',
      why: 'Anonymous sign-in lives on one device, so a new phone or a cleared browser can lose someone’s place.',
      read: 'A low personal link share is a risk on the night. Many get-back-in uses mean people are already hitting this.',
    },
    {
      title: 'On the night: is it working?',
      look: 'Problems on this page, then Realtime on the website page.',
      why: 'Fixing what is broken matters more than learning anything new. Avoid new features on the day.',
      read: 'Act on an error that repeats or grows, and ignore one-offs. ResizeObserver messages are usually harmless, and Script error hides its real cause. The website’s Engagement page also shows failed saves.',
      href: `/websites/${MUSEUMHOP_ID}/realtime`,
    },
    {
      title: 'On the night: is the plan being used?',
      look: 'Features used, for google-maps, locate and ride-select, and visits by hour in When people plan.',
      why: 'This separates a tool people planned in from a tool they relied on while out.',
      read: 'Activity during the event, from people who already planned, is your best proof of value. Peaks only before the night mean it’s a planning tool, not a companion.',
    },
    {
      title: 'Afterwards: what worked?',
      look: 'Devices and places, Most wanted, Reactions and roles, and the UTM page for each channel.',
      why: 'This is what you can use next year, or share as a story.',
      read: 'Compare channels by groups created, not by visitors alone. A high Dutch share in languages suggests a Dutch version is worth making. Most wanted shows real demand per venue.',
      href: `/websites/${MUSEUMHOP_ID}/utm`,
    },
    {
      title: 'Afterwards: did the introduction help?',
      look: 'Intro and Tour in How features are used.',
      why: 'It shows where first-time visitors lose patience.',
      read: 'If most leave at the same step, shorten it there.',
    },
  ],
  note: 'Copy the planner numbers you want to keep before 7 December 2026: MuseumHop deletes night data 30 days after the event, and the Planner sections here will then lose it.',
  skip: 'Returning visitors and Bounce rate. Most people have one night to plan, and one page can hold a long session, so neither says much here. Numbers also rise and fall quickly around the event, so compare whole days.',
};

export function getSiteSection(pathname: string): { websiteId: string; section: string } | null {
  const match = pathname.replace(/\/$/, '').match(/\/websites\/([^/]+)(?:\/([^/]+))?/);

  return match ? { websiteId: match[1], section: match[2] ?? '' } : null;
}

export function getSiteGuide(pathname: string): SiteGuide | null {
  const site = getSiteSection(pathname);

  return site ? (SITE_GUIDES[site.websiteId] ?? null) : null;
}
