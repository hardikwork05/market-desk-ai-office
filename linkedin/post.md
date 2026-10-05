# LinkedIn post: Market Desk, an AI office for a solo trader

Draft post for this project: the images to attach, every real name that appears in it, and the caption.
Images are in [`images/`](images/).

**Repo:** https://github.com/hardikwork05/market-desk-ai-office (public)
**Live:** https://market-desk-ai-office.vercel.app

**Images** (multi-image post, in this order):

| # | File | Shows |
|---|---|---|
| 1 | [`b04-01-market-desk-overview.jpg`](images/b04-01-market-desk-overview.jpg) | The whole floor: five lit cabins, three dark ones, the trading group's lounge and the floor plan |
| 2 | [`b04-01-market-desk-ideas.jpg`](images/b04-01-market-desk-ideas.jpg) | Meera's cabin open: "Without Meera / With Meera", 5 ideas today, 3 fit your rules, group hit rate 61% |
| 3 | [`b04-01-market-desk-risk.jpg`](images/b04-01-market-desk-risk.jpg) | Kabir's cabin open: the risk rules and how much of each limit is used |

**Names in this post:**

| Name | What it is | Before posting |
|---|---|---|
| Market Desk | A name invented for the demo | Nothing to do |
| Kavya, Arjun, Meera, Ira, Kabir | Invented names for the AI desks | Nothing to do |
| Rajesh, Sunil, Amit, Vikram | Placeholder group members in the ideas list (image 2) | Change them in `site/data.js` if they match real people in the group |
| WhatsApp, Telegram | Shown as connection labels in image 2 | Fine as labels. The demo is not connected to either |
| SEBI | Named in the caption as the regulator | Keep the "no tips, no orders" line with it |

**Caption:**

A trader I know works alone. His best ideas don't come from a screen. They come from a small group of people who message each other all day.

That is also the problem. Ideas fly past in the chat, he acts on the loudest one, and nobody ever checks whose ideas actually work.

So I built him an office.

Market Desk is a 3D room with five glass cabins. Each one holds an AI staff member with one job:

→ Kavya, chief of staff: one page, morning and evening, with what happened and what needs his OK
→ Arjun, morning brief: the overnight market, the results calendar and his watchlist, as a one-minute read at 8:45
→ Meera, ideas desk: logs every idea from the group, checks it against his own rules, and keeps a hit rate for each member
→ Ira, journal: pulls his trades from the broker so nothing is typed by hand, then shows which setups make money
→ Kabir, risk: watches the loss limit, position size and margin all day and warns before a rule breaks

Every cabin opens with the same two columns: what the day looks like without this desk, and what it looks like with it. That did more for the pitch than any feature. People don't buy "an AI agent". They buy the before and after.

Two decisions I'd defend.

It gives no tips and places no orders. In India, paid advice needs SEBI registration, and I don't think a trader needs one more voice telling him what to buy. He needs help sticking to the plan he already wrote.

Nothing changes without his OK. The office prepares. He approves.

The room is plain JavaScript and WebGL with no libraries. The whole renderer is about 11 KB.

A note on names: Market Desk is a name I made up. The people in the ideas list are placeholders, and every number on screen is sample data.

If five desks watched your trading day, which one would you want first?

#buildinpublic #trading #automation #webgl
