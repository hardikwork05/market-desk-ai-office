// Sample content for the demo. Every name and number here is made up.

// The office name can be set in the link, for example ?name=Mehta Trading
const asked = new URLSearchParams(location.search).get('name') || '';
export const NAME = asked.replace(/[^A-Za-z0-9 .&-]/g, '').trim().slice(0, 22) || 'Market Desk';
const RS = '₹';

export const DESKS = [
  {
    id: 'front', name: 'Front desk', person: 'Kavya', role: 'AI desk manager', live: true,
    pos: [0, 4.2], rot: 0, yaw: -0.28, shirt: 0xC7522A, skin: 0xC98F68, hair: 0x1A120E, bun: true,
    figures: [['14', 'trades this week'], ['8', 'winners']],
    report: [
      'The morning brief went out at 8:45. 2 stocks on your watchlist have results today.',
      'The journal is up to date. All 14 trades this week are imported from your broker.',
      'Risk is within your limits. Yesterday closed at 40 percent of the daily loss limit.',
      'You have had two losing days in a row, so one of your own rules now applies.'
    ]
  },
  {
    id: 'brief', name: 'Morning brief desk', person: 'Arjun', role: 'AI market analyst', live: true,
    pos: [-6.6, -5], rot: 0, yaw: 0.3, shirt: 0xE9EDF0, skin: 0xB97C56, hair: 0x120D0B,
    tv: ['Morning brief', '8:45', 'sent before the bell'],
    figures: [['8:45', 'brief sent'], ['2', 'results today'], ['4', 'alerts set']],
    report: [
      'Overnight markets are mixed and the open looks flat. Nothing changes your plan.',
      'Results today on your watchlist: 2 stocks. Your rule is no fresh trades in them before results.',
      'Weekly expiry is tomorrow. Your notes say you trade half size on expiry day.',
      '4 price alerts are set at the levels you marked last evening.'
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
    steps: [
      'Arjun reads the overnight markets, the results calendar and news on your watchlist.',
      'He writes a one-minute brief built around your own plan and rules.',
      'It reaches your phone before the market opens.'
    ]
  },
  {
    id: 'journal', name: 'Journal desk', person: 'Ira', role: 'AI journal keeper', live: true,
    pos: [0, -5], rot: 0, yaw: 0.24, shirt: 0x3C6FB0, skin: 0xD9A47C, hair: 0x23160F, bun: true,
    tv: ['Journal', '14', 'trades this week'],
    figures: [['14', 'trades this week'], ['8', 'winners'], ['2', 'off-plan trades']],
    report: [
      'All 14 trades are imported from your broker and matched with the contract notes.',
      'Opening range breakouts: 6 trades, 5 winners. This is your best setup this month.',
      'Trades after 2 pm: 4 trades, 1 winner. They cost more than the morning made on Tuesday.',
      '2 trades were taken outside your written plan.'
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
    steps: [
      'Ira pulls your trades from the broker every evening. Nothing to type.',
      'She tags each trade by setup, time of day and whether it followed your plan.',
      'Every Friday she sends a review of what worked and what did not.'
    ]
  },
  {
    id: 'risk', name: 'Risk desk', person: 'Kabir', role: 'AI risk officer', live: true,
    pos: [6.6, -5], rot: 0, yaw: -0.3, shirt: 0x2B3A36, skin: 0xCB956F, hair: 0x1C1210,
    tv: ['Risk', '40%', 'of loss limit used'],
    figures: [['40%', 'of loss limit used'], ['3', 'open positions'], ['62%', 'margin in use']],
    report: [
      'Daily loss limit: 40 percent used yesterday. No breach this week.',
      'Position size stayed within your 1 percent rule on 13 of 14 trades.',
      'Margin in use is 62 percent. Your own ceiling is 75 percent.',
      'Two losing days in a row. Your rule says trade half size on the next day.'
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
    steps: [
      'You write your rules once: loss limit, position size and margin ceiling.',
      'Kabir watches your positions through the day and compares them with those rules.',
      'He warns you before a rule breaks. Every trading decision stays yours.'
    ]
  },
  {
    id: 'tax', name: 'Tax desk', live: false, pos: [-10.6, 1.4], rot: Math.PI / 2, yaw: -0.3,
    what: 'Works out F&amp;O turnover and profit and loss from your contract notes, ready for your CA.',
    does: [
      'Reads contract notes and the broker tax report',
      'Keeps a running profit and loss for each segment',
      'Reminds you of advance tax dates'
    ]
  },
  {
    id: 'backtest', name: 'Backtest desk', live: false, pos: [10.6, 1.4], rot: -Math.PI / 2, yaw: 0.3,
    what: 'Tests a strategy you describe in plain words against past market data, before you risk money on it.',
    does: [
      'Turns your rules into a test',
      'Shows how it would have done, including the bad months',
      'Compares it with what you actually trade'
    ]
  }
];

// Guided tour: desk to visit, caption, seconds on screen.
export const TOUR = [
  { desk: null, dur: 7, text: 'This is the ' + NAME + ' AI office. Each cabin is one AI staff member looking after one part of your trading.' },
  { desk: 'front', dur: 7, text: 'Kavya at the front desk gives you the whole picture: the week so far, what each desk found, what needs you.' },
  { desk: 'brief', dur: 8, text: 'Arjun reads the overnight markets and your watchlist, and sends a one-minute brief before the bell.' },
  { desk: 'journal', dur: 8, text: 'Ira imports every trade from your broker and shows which setups make money and which do not.' },
  { desk: 'risk', dur: 8, text: 'Kabir watches your positions against your own rules and warns you before one breaks.' },
  { desk: 'risk', dur: 7, scroll: 0.6, approve: 3, text: 'Nothing changes until you say so. Every trading decision stays yours.' },
  { desk: 'tax', dur: 6, text: 'More desks can open when you are ready. Tax and backtesting come next.' },
  { desk: null, dur: 6, text: 'The office does not give tips or place orders. It keeps you disciplined on your own plan.' }
];
