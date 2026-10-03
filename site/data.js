// Sample content for the demo. Every name and number here is made up.

// The office name can be set in the link, for example ?name=Mehta Trading
const asked = new URLSearchParams(location.search).get('name') || '';
export const NAME = asked.replace(/[^A-Za-z0-9 .&-]/g, '').trim().slice(0, 22) || 'Market Desk';
const RS = '₹';

// Each bot: where its cabin sits, what it says about itself, and what it shows.
export const BOTS = [
  {
    id: 'chief', name: 'Kavya', role: 'Chief of staff', desk: 'Front office', live: true,
    pos: [0, -6.4], size: [6.4, 5], shirt: 0xC7522A, skin: 0xC98F68, hair: 0x1A120E, bun: true,
    line: 'Runs the AI team and gives you the whole trading day on one page.',
    links: ['Every desk', 'WhatsApp'],
    before: 'You piece the day together from the broker app, the group chat and memory.',
    after: 'One page every morning and evening: what happened, what each desk found, and what needs you.',
    does: [
      'Collects every desk report into one daily briefing',
      'Keeps the list of things waiting for your OK',
      'Flags it when desks disagree, such as a group idea that breaks one of your risk rules'
    ],
    briefing: 'Good morning. The open looks flat. Two stocks on your watchlist report results today, so your no-trade rule applies to them. Your group has shared 5 ideas since last evening: 3 fit your rules and 2 do not. You have had two losing days, so Kabir suggests half size today.',
    kpis: [['14', 'Trades this week', '8 winners'], ['+' + RS + '18,400', 'Net this week', 'after charges'], ['5', 'Group ideas today', '3 fit your rules'], ['40%', 'Loss limit used', 'yesterday']],
    status: 'Briefing written at 8:30'
  },
  {
    id: 'brief', name: 'Arjun', role: 'Morning brief analyst', desk: 'Morning brief', live: true,
    pos: [-9.4, 0.4], size: [4.4, 4.2], shirt: 0xE9EDF0, skin: 0xB97C56, hair: 0x120D0B,
    tv: ['8:45', 'brief sent'],
    line: 'Reads the market before you wake up and tells you only what matters to your plan.',
    links: ['Market data', 'Results calendar', 'Your watchlist', 'WhatsApp'],
    before: 'You scroll the news, the group chat and three apps before the bell, and still miss a results date.',
    after: 'A one-minute brief at 8:45, built around your watchlist and your own rules.',
    does: [
      'Reads overnight markets, the results calendar and news on your watchlist',
      'Sets price alerts at the levels you marked',
      'Reminds you which of your own rules apply today'
    ],
    kpis: [['8:45', 'Brief sent', 'every trading day'], ['2', 'Results today', 'on your watchlist'], ['4', 'Alerts set', 'at your levels'], ['1 min', 'Reading time', 'no scrolling']],
    rows: {
      title: 'In the brief this morning',
      list: [
        ['Open', 'Flat open expected after a mixed night'],
        ['Results', '2 watchlist stocks report today. No fresh trades in them before the numbers.'],
        ['Expiry', 'Weekly expiry is tomorrow. Half size, by your rule.'],
        ['Alerts', '4 levels are set from last evening'],
        ['Group', '5 new ideas overnight, passed to Meera at the ideas desk']
      ]
    },
    steps: [
      'At 7:30 he reads overnight markets, results dates and watchlist news',
      'He checks which of your rules apply today',
      'At 8:45 the brief reaches your phone',
      'He sets your alerts and tells Kabir the size rule for the day'
    ],
    decide: {
      short: 'Pause alerts on 2 results-day stocks',
      ask: 'Pause alerts on the 2 results-day stocks until their numbers are out?',
      done: 'Paused. Alerts on both stocks restart after results.'
    },
    wa: {
      to: 'To you, at 8:45 on every trading day',
      text: 'Good morning. Flat open expected. 2 watchlist stocks report results today. 4 alerts are set at your levels. Half size today, as your rule says.'
    },
    status: 'Brief sent at 8:45, 4 alerts set'
  },
  {
    id: 'ideas', name: 'Meera', role: 'Ideas desk keeper', desk: 'Group ideas', live: true,
    pos: [-4.2, 0.4], size: [4.4, 4.2], shirt: 0x7A4DB8, skin: 0xD9A47C, hair: 0x23160F, bun: true,
    tv: ['5', 'ideas today'],
    line: 'Catches every idea your group shares, checks it against your rules, and keeps score.',
    links: ['WhatsApp group', 'Telegram', 'Your rules', 'Journal'],
    before: 'Ideas fly past in the group chat. You act on the loudest one and never learn whose ideas actually work.',
    after: 'Every idea is logged with who shared it, checked against your rules, and scored by how it played out.',
    does: [
      'Picks trade ideas out of the group chat and logs who shared each one',
      'Checks every idea against your rules before it reaches you',
      'Tracks how each idea played out, taken or not, and keeps a hit rate for every member'
    ],
    kpis: [['5', 'Ideas today', 'from 4 members'], ['3', 'Fit your rules', '2 do not'], ['61%', 'Group hit rate', 'last 30 days'], ['3', 'Ideas you shared', '2 worked']],
    ideas: [
      { who: 'Rajesh', what: `Large-cap bank, breakout above yesterday's high`, fit: true, note: 'Fits your rules', state: 'Watching' },
      { who: 'Sunil', what: 'Index weekly call, momentum trade at 2:40 pm', fit: false, note: 'Breaks your rule: no new trades after 2 pm', state: 'Skipped' },
      { who: 'Amit', what: 'IT stock, buy before results', fit: false, note: 'Breaks your rule: no trades before results', state: 'Skipped' },
      { who: 'Vikram', what: 'Metal stock, pullback to the 20-day average', fit: true, note: 'Fits your rules', state: 'Taken, +1.4R' },
      { who: 'Rajesh', what: 'Auto stock, range breakout with volume', fit: true, note: 'Fits your rules', state: 'Watching' }
    ],
    bars: {
      title: 'Whose ideas work, last 30 days', unit: '%', max: 100,
      list: [['Vikram', 71, '17 ideas'], ['Rajesh', 64, '22 ideas'], ['You', 62, '13 ideas'], ['Amit', 52, '21 ideas'], ['Sunil', 44, '18 ideas']]
    },
    steps: [
      'A member posts an idea in the group',
      'Meera logs who shared it, what it is and when',
      'She checks it against your rules and marks it fit or not',
      'Ira records what happened, and that member gets a score'
    ],
    decide: {
      short: 'Add 2 group ideas to the watchlist',
      ask: 'Add the 2 untaken ideas that fit your rules to the watchlist, with alerts at their levels?',
      done: 'Added. Arjun has set alerts for both.'
    },
    wa: {
      to: 'To you, when a group idea fits your rules',
      text: `New from Rajesh: large-cap bank, breakout above yesterday's high. It fits your rules. His ideas have worked 64 percent of the time in the last 30 days. Add it to the watchlist?`
    },
    status: '5 ideas logged, 3 fit your rules'
  },
  {
    id: 'journal', name: 'Ira', role: 'Trade journal keeper', desk: 'Journal', live: true,
    pos: [1, 0.4], size: [4.4, 4.2], shirt: 0x3C6FB0, skin: 0xD9A47C, hair: 0x23160F, bun: true,
    tv: ['14', 'trades this week'],
    line: 'Writes your trading diary for you and shows where the money is really made.',
    links: ['Broker tradebook', 'Contract notes', 'Ideas desk'],
    before: 'The journal gets filled for a week and then forgotten. You remember the big win and not the six small leaks.',
    after: 'Every trade is logged without typing, tagged by setup, time and source, and reviewed every Friday.',
    does: [
      'Imports every trade from your broker each evening',
      'Tags each trade by setup, time of day, and whether it was your idea or the group',
      'Sends a Friday review of what worked and what did not'
    ],
    kpis: [['14', 'Trades this week', '8 winners'], ['+' + RS + '18,400', 'Net this week', 'after charges'], ['1.6', 'Reward to risk', 'average'], ['2', 'Off-plan trades', 'both lost money']],
    bars: {
      title: 'Profit by setup, this month', unit: '', max: 27000,
      list: [['Opening range breakout', 26400, RS + '26,400'], ['Pullback to average', 9800, RS + '9,800'], ['Group ideas taken', 6200, RS + '6,200'], ['Results-day trades', -8300, '-' + RS + '8,300'], ['Trades after 2 pm', -14700, '-' + RS + '14,700']]
    },
    steps: [
      'Every evening Ira pulls your trades from the broker',
      'She matches them with contract notes and with the ideas desk',
      'Each trade gets a setup, a time slot and a plan check',
      'On Friday you get a review you can read in two minutes'
    ],
    decide: {
      short: 'File 2 off-plan trades as rule breaks',
      ask: 'File the 2 trades taken outside your plan as rule breaks, so they show in the Friday review?',
      done: 'Filed. Both will show in the Friday review.'
    },
    wa: {
      to: 'To you, every Friday evening',
      text: 'Week review: 14 trades, 8 winners, net ' + RS + '18,400. Your breakout setup paid. Trades after 2 pm did not. 2 trades broke your rules. Tap to see each one.'
    },
    status: '14 trades logged, review due Friday'
  },
  {
    id: 'risk', name: 'Kabir', role: 'Risk officer', desk: 'Risk', live: true,
    pos: [6.2, 0.4], size: [4.4, 4.2], shirt: 0x2F8F86, skin: 0xCB956F, hair: 0x1C1210,
    tv: ['40%', 'of loss limit'],
    line: 'Holds you to your own rules, most of all on the days you would rather forget them.',
    links: ['Broker positions', 'Your rules', 'WhatsApp'],
    before: 'After two losses the next trade gets bigger, not smaller. The rule exists, but nobody enforces it.',
    after: 'Your limits are watched all day, and the warning comes before a rule breaks, not after.',
    does: [
      'Watches loss, position size and margin against the limits you set',
      'Warns you on WhatsApp before a limit is reached',
      'Applies your own cool-off rules, such as half size after two losing days'
    ],
    kpis: [['40%', 'Loss limit used', 'yesterday'], ['62%', 'Margin in use', 'your ceiling is 75%'], ['13 of 14', 'Trades within size rule', 'this week'], ['0', 'Rule breaches', 'this week']],
    meters: {
      title: 'Your limits right now',
      list: [['Daily loss limit', 40, 'Stop for the day at 100 percent'], ['Margin in use', 62, 'Your ceiling is 75 percent'], ['Largest position', 80, 'Of your 1 percent per trade rule'], ['Trades today', 30, '3 of your 10-trade cap']]
    },
    steps: [
      'You write your rules once: loss limit, position size, margin ceiling',
      'Kabir watches your positions through the day',
      'He warns you before a rule breaks',
      'Every trading decision stays yours'
    ],
    decide: {
      short: 'Set tomorrow to half size',
      ask: 'Set tomorrow to half size, as your own rule says after two losing days?',
      done: 'Done. Half size is set for tomorrow and will show in the morning brief.'
    },
    wa: {
      to: 'To you, during market hours',
      text: 'You have used 70 percent of the daily loss limit after 3 trades. Your rule: stop for the day at 100 percent.'
    },
    status: 'All limits inside your rules'
  },
  {
    id: 'tax', name: 'Tax desk', role: 'Next phase', live: false, pos: [-11.5, -6.6], size: [4.4, 4.6],
    line: 'Works out F&amp;O turnover and profit and loss from your contract notes, ready for your CA.',
    plan: ['Reads contract notes and the broker tax report', 'Keeps a running profit and loss for each segment', 'Reminds you of advance tax dates']
  },
  {
    id: 'backtest', name: 'Backtest lab', role: 'Next phase', live: false, pos: [-6.5, -6.6], size: [4.4, 4.6],
    line: 'Tests a strategy you describe in plain words against past market data, before you risk money on it.',
    plan: ['Turns your rules into a test', 'Shows how it would have done, including the bad months', 'Tests a group idea before anyone trades it']
  },
  {
    id: 'research', name: 'Research desk', role: 'Next phase', live: false, pos: [6.5, -6.6], size: [4.4, 4.6],
    line: 'Reads results, concalls and exchange filings for your watchlist and gives you the two-minute version.',
    plan: ['Summarises quarterly results on the day', 'Pulls out what management said on the call', 'Shares the summary with your group if you choose']
  }
];

// Activity log: [desk, minutes ago, what happened, detail]
export const FEED = [
  ['ideas', 2, 'New idea from Rajesh', 'Auto stock, range breakout with volume. Fits your rules.'],
  ['risk', 6, 'Margin check passed', '62 percent in use against a 75 percent ceiling'],
  ['journal', 14, 'Imported 3 trades', 'Matched with the contract note'],
  ['ideas', 21, 'Idea from Sunil marked not fit', 'Breaks your rule: no new trades after 2 pm'],
  ['brief', 35, 'Alert set', 'Level 3 of 4 from last evening'],
  ['journal', 52, 'Tagged a trade as opening range breakout', 'It followed your plan'],
  ['risk', 75, 'Size rule applied', 'Half size today after two losing days'],
  ['brief', 95, 'Morning brief sent', 'At 8:45, one minute to read'],
  ['ideas', 110, 'Vikram closed his idea at +1.4R', 'His 30-day hit rate is now 71 percent'],
  ['journal', 130, 'Friday review drafted', '14 trades, 8 winners']
];

// New activity that arrives while the page is open.
export const LIVE = [
  ['risk', 'Position size checked', 'New trade is 0.8 percent of capital, inside your rule'],
  ['ideas', 'New idea from Amit', 'Pharma stock, gap-up continuation. Fits your rules.'],
  ['journal', 'Imported 1 trade', 'Tagged as pullback to average'],
  ['brief', 'Alert hit', 'Price crossed your second level'],
  ['ideas', 'Idea from Rajesh moved to watching', 'Alert set at his level'],
  ['risk', 'Loss limit update', '45 percent used after 2 trades today']
];

// Guided tour: cabin to visit, caption, seconds on screen.
export const TOUR = [
  { go: null, dur: 7, text: 'This is the ' + NAME + ' AI office. Each cabin is one AI staff member looking after one part of your trading.' },
  { go: 'chief', dur: 8, text: 'Kavya is the chief of staff. She turns every desk report into one briefing and keeps the list of what needs you.' },
  { go: 'brief', dur: 8, text: 'Arjun reads the overnight markets and your watchlist, and sends a one-minute brief before the bell.' },
  { go: 'ideas', dur: 9, text: 'Meera logs every idea your group shares, checks it against your rules, and keeps a score for each member.' },
  { go: 'journal', dur: 8, text: 'Ira imports every trade and shows which setups make money, including the group ideas you took.' },
  { go: 'risk', dur: 8, text: 'Kabir watches your positions against your own rules and warns you before one breaks.' },
  { go: 'risk', dur: 7, scroll: 0.6, approve: 3, text: 'Nothing changes until you say so. Every trading decision stays yours.' },
  { go: null, dur: 7, text: 'The office does not give tips or place orders. It keeps you and your group disciplined on your own plan.' }
];
