// All portfolio copy lives here. Edit this file to change what the site says.

export const profile = {
  name: 'Ahtshamdev',
  role: 'Mobile & full-stack engineer',
  location: 'Lahore, Pakistan. Remote across time zones',
  email: 'jugnubhai225@gmail.com',
  github: 'https://github.com/Ahtshamdev',
  linkedin: '', // add a full profile URL to show the link
  available: 'Open to senior mobile roles from November 2026',
  headline: 'I build mobile apps that keep working when the network doesn’t.',
  intro:
    'Seven years shipping iOS and Android apps with React Native, Swift and Kotlin, plus the Node and Postgres services behind them. Most of my work is for people using an app at a job site, on a delivery route or at a pharmacy counter, where a spinner is not an option.',
};

export type Metric = { value: string; label: string };
export type Decision = { title: string; body: string };

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  year: string;
  role: string;
  team: string;
  platforms: string;
  stack: string[];
  color: string;
  metrics: Metric[];
  problem: string[];
  constraints: string[];
  decisions: Decision[];
  outcome: string[];
  retro: string;
};

export const projects: Project[] = [
  {
    slug: 'tidewell',
    name: 'Tidewell',
    tagline: 'Offline-first inspections for water utilities',
    summary:
      'Field crews inspect hydrants, valves and pump stations in basements and rural sites with no signal. I led the rebuild of their paper-and-spreadsheet process into an app that works fully offline and syncs without losing a single edit.',
    year: '2022 – 2023',
    role: 'Lead mobile engineer',
    team: '3 mobile, 2 backend, 1 designer',
    platforms: 'iOS, Android, tablets',
    stack: ['React Native', 'TypeScript', 'SQLite', 'WatermelonDB', 'Node.js', 'PostgreSQL', 'PostGIS'],
    color: '#0E7C86',
    metrics: [
      { value: '11,400', label: 'inspections filed per month' },
      { value: '0', label: 'lost edits since launch' },
      { value: '38%', label: 'less time per inspection' },
    ],
    problem: [
      'Inspectors filled in paper forms, photographed them, and an office team re-typed everything into a spreadsheet. Records arrived days late, and roughly one in twelve had a transcription error that sent a crew back to the same asset.',
      'An earlier attempt at an app had failed because it needed a connection to load each form. Half the assets are underground.',
    ],
    constraints: [
      'Must work for a full 10-hour shift with no connectivity, including maps and photo capture.',
      'Two inspectors can edit the same asset on the same day.',
      'Crews use a mix of five-year-old Android phones and new iPads.',
    ],
    decisions: [
      {
        title: 'Local database is the source of truth',
        body: 'Every screen reads from SQLite through WatermelonDB, never from the network. Sync runs in the background as a pull-then-push against a change log, so the UI never waits on a request.',
      },
      {
        title: 'Field-level merges instead of last-write-wins',
        body: 'Each record stores per-field timestamps. When two crews touch the same valve, the server merges field by field and only asks a supervisor to resolve a true conflict. That happened 14 times in the first year.',
      },
      {
        title: 'Pre-cut map tiles per route',
        body: 'The backend builds a vector tile pack for each crew’s route overnight, around 40 MB, so maps and asset pins load instantly underground.',
      },
      {
        title: 'Photos upload on their own queue',
        body: 'Images compress to WebP on device and upload separately with resumable chunks, so a 200 MB day of photos never blocks the text data a supervisor is waiting for.',
      },
    ],
    outcome: [
      'Rolled out to 140 inspectors across three utilities in four months. Records now reach the office within minutes of reconnecting, and the transcription team moved to data quality work.',
      'Median inspection time dropped from 21 to 13 minutes, mostly from pre-filled asset history and not re-typing serial numbers.',
    ],
    retro:
      'I would introduce the per-field sync model from day one. We started with record-level timestamps and migrating 60,000 records mid-pilot cost us three weeks.',
  },
  {
    slug: 'kilo',
    name: 'Kilo Courier',
    tagline: 'Live routing for a same-day grocery fleet',
    summary:
      'A courier app for 900 drivers delivering groceries in under two hours. I built the real-time dispatch channel and the driver app’s route screen, and cut battery drain enough that drivers stopped carrying power banks.',
    year: '2023 – now',
    role: 'Senior mobile engineer',
    team: '5 mobile, 6 backend',
    platforms: 'Android, iOS',
    stack: ['React Native', 'Expo', 'Reanimated', 'Node.js', 'WebSockets', 'Redis', 'PostgreSQL'],
    color: '#E0482B',
    metrics: [
      { value: '900', label: 'drivers on shift daily' },
      { value: '−46%', label: 'battery use per shift' },
      { value: '1.8s', label: 'order to driver, p95' },
    ],
    problem: [
      'Dispatch pushed orders by polling every 15 seconds. Drivers saw jobs late, two drivers sometimes accepted the same order, and GPS tracking drained a phone before the shift ended.',
    ],
    constraints: [
      'Drivers move between 4G and dead zones constantly.',
      'Most drivers use budget Android phones with aggressive battery managers.',
      'An order must never be assigned to two drivers.',
    ],
    decisions: [
      {
        title: 'One WebSocket, many channels',
        body: 'Replaced polling with a single socket per driver, fanned out through Redis pub/sub. Messages carry a sequence number, so the app replays anything it missed after a reconnect instead of refetching everything.',
      },
      {
        title: 'Accepting an order is a server lease',
        body: 'Tapping accept takes a 20-second lease in Redis. The app shows the order as pending until the lease is confirmed, which ended double assignments completely.',
      },
      {
        title: 'Adaptive location sampling',
        body: 'GPS frequency follows speed and distance to the next stop: every 3 seconds near a drop-off, every 30 when parked. This was most of the battery win.',
      },
    ],
    outcome: [
      'Order-to-driver time went from 9 seconds to 1.8 seconds at p95. Double assignments went to zero. Crash-free sessions rose from 97.1% to 99.6% after moving map rendering off the JS thread.',
    ],
    retro:
      'We underestimated Android OEM battery killers. Next time I would budget a device lab of the ten most common driver phones from week one.',
  },
  {
    slug: 'dose',
    name: 'Dose',
    tagline: 'Medication reminders designed for older eyes',
    summary:
      'A native iOS app for a pharmacy chain that helps patients over 65 take the right pill at the right time. Built in SwiftUI with accessibility as the primary requirement, not a checklist at the end.',
    year: '2021',
    role: 'iOS engineer',
    team: '2 iOS, 1 designer, 1 pharmacist advisor',
    platforms: 'iOS, watchOS',
    stack: ['Swift', 'SwiftUI', 'HealthKit', 'WidgetKit', 'Core Data', 'CloudKit'],
    color: '#6B4EE6',
    metrics: [
      { value: '4.8', label: 'App Store rating, 2,300 reviews' },
      { value: '91%', label: 'doses logged on time, month 3' },
      { value: 'AX5', label: 'largest Dynamic Type, fully supported' },
    ],
    problem: [
      'Patients on five or more medications miss doses often, and the chain’s existing app buried reminders three screens deep behind a login.',
    ],
    constraints: [
      'Must be usable at the largest accessibility text size and with VoiceOver.',
      'Reminders must fire even if the app has not been opened in weeks.',
      'Health data cannot leave the device without explicit consent.',
    ],
    decisions: [
      {
        title: 'Layouts that reflow, not shrink',
        body: 'Every screen switches from rows to stacked layouts at accessibility sizes. We tested each screen at AX5 with VoiceOver on, with patients, before it was merged.',
      },
      {
        title: 'Notifications scheduled from a rolling window',
        body: 'iOS caps pending notifications at 64. A background task keeps the next 7 days scheduled and re-plans whenever a prescription changes.',
      },
      {
        title: 'Private by default',
        body: 'Data lives in Core Data and syncs only through the user’s own iCloud via CloudKit. The pharmacy never sees dose history unless the patient shares a report.',
      },
    ],
    outcome: [
      'Featured by Apple in an accessibility collection. On-time dose logging reached 91% by month three, and pharmacy refill calls dropped by a third.',
    ],
    retro:
      'The watch app was an afterthought and it shows. Half of daily check-ins now happen on the wrist, and it deserved the same design attention.',
  },
  {
    slug: 'ledger',
    name: 'Ledger',
    tagline: 'Shared budgets for households',
    summary:
      'A Kotlin and Jetpack Compose app for couples and housemates to split bills and track a shared budget. I built the Android app and the Ktor API, from first commit to 60,000 installs.',
    year: '2020',
    role: 'Android & backend engineer',
    team: 'Solo engineer, 1 designer',
    platforms: 'Android',
    stack: ['Kotlin', 'Jetpack Compose', 'Room', 'Hilt', 'Ktor', 'PostgreSQL'],
    color: '#1F8A4C',
    metrics: [
      { value: '60k', label: 'installs in the first year' },
      { value: '4.7', label: 'Play Store rating' },
      { value: '< 1s', label: 'cold start on a Moto G7' },
    ],
    problem: [
      'Households tracked shared costs in group chats and spreadsheets. Existing apps were built for one person and bolted sharing on later.',
    ],
    constraints: [
      'Money math must be exact, with no floating-point rounding surprises.',
      'Must feel instant on low-end Android devices.',
    ],
    decisions: [
      {
        title: 'Money as integers everywhere',
        body: 'Amounts are stored and sent as minor units with an ISO currency code. Splits distribute remainders deterministically, so three people splitting 100 always see 33.34, 33.33, 33.33 on every device.',
      },
      {
        title: 'Baseline profiles and a lean startup path',
        body: 'Shipped baseline profiles and moved non-critical initialisation behind the first frame, bringing cold start under a second on the budget phones most users had.',
      },
    ],
    outcome: [
      'Grew to 60,000 installs through word of mouth, with a 42% 30-day retention rate, high for a finance app.',
    ],
    retro:
      'I would add a web view of the ledger earlier. Many users asked for one to check balances from a laptop.',
  },
];

export type Role = {
  period: string;
  title: string;
  company: string;
  body: string;
};

export const experience: Role[] = [
  {
    period: '2023 – now',
    title: 'Senior mobile engineer',
    company: 'Northpass Logistics',
    body: 'Own the courier app and its real-time dispatch channel. Mentor three engineers and run the mobile release train, shipping every two weeks.',
  },
  {
    period: '2021 – 2023',
    title: 'Lead mobile engineer',
    company: 'Tidewell Systems',
    body: 'Rebuilt field inspections as an offline-first React Native app and designed the sync protocol with the backend team.',
  },
  {
    period: '2019 – 2021',
    title: 'Full-stack developer',
    company: 'Brightline Studio',
    body: 'Agency work for health and fintech clients: native iOS, Android and the Node or Kotlin services behind them.',
  },
  {
    period: '2018 – 2019',
    title: 'Freelance developer',
    company: 'Self-employed',
    body: 'Built websites and first mobile apps for local businesses while finishing a BS in Computer Science.',
  },
];

export const capabilities = [
  {
    title: 'Mobile',
    body: 'React Native and Expo, Swift and SwiftUI, Kotlin and Jetpack Compose. Offline data, background work, push, deep links, widgets and store releases.',
  },
  {
    title: 'Backend',
    body: 'Node.js and TypeScript, Ktor, PostgreSQL and PostGIS, Redis, WebSockets. APIs designed around what the app needs on a bad connection.',
  },
  {
    title: 'Quality',
    body: 'Detox and Maestro end-to-end tests, performance profiling on real low-end devices, crash triage, CI with Fastlane and EAS.',
  },
];

export const education = 'BS Computer Science, University of the Punjab, 2019';

export type Architecture = { device: string[]; link: string; server: string[] };

export const architecture: Record<string, Architecture> = {
  tidewell: {
    device: ['Inspection screens', 'WatermelonDB on SQLite', 'Sync engine with change log', 'Photo upload queue'],
    link: 'Pull, then push, over HTTPS',
    server: ['Sync API in Node.js', 'PostgreSQL with PostGIS', 'Nightly map tile builder', 'Object storage for photos'],
  },
  kilo: {
    device: ['Route and order screens', 'Socket client with replay', 'Adaptive location sampler'],
    link: 'One WebSocket per driver',
    server: ['WebSocket gateway', 'Redis pub/sub and order leases', 'Dispatch service', 'PostgreSQL'],
  },
  dose: {
    device: ['SwiftUI views', 'Core Data store', 'Rolling notification planner', 'watchOS companion'],
    link: 'The patient’s own iCloud',
    server: ['CloudKit private database', 'HealthKit, with consent', 'Shareable PDF reports'],
  },
  ledger: {
    device: ['Compose UI', 'Room database', 'WorkManager sync worker'],
    link: 'REST over HTTPS',
    server: ['Ktor API', 'PostgreSQL', 'Push notifications via FCM'],
  },
};
