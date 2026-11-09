# Starting and splitting big tasks: product and UX brief (Pomodeal research council, product/UX seat)

Research date: 2026-11-08. Method: ~17 web searches/fetches. Important caveat about sources: almost every "review" of ADHD/productivity apps that ranks in search in 2026 is written by a competing vendor (Saner.ai, Thawly, BrightMind, Inflow, Focus Bear, Reclaim, Morgen, Syncmodo, Roomie). Search did **not** surface primary Reddit threads (r/ADHD, r/productivity, r/GetStudying) at all; community sentiment below is therefore second-hand and flagged as such. Anything marked "(training knowledge, unverified this session)" comes from my prior knowledge, not from a source fetched today, and belongs with the gaps until someone checks it.

## 1. How existing products handle breakdown and starting, and what users praise or complain about

### Takeaway
Two separate jobs show up across the market, and few products do both well: (a) **cracking the start** (Goblin Tools' Magic ToDo, Marvin's Procrastination Wizard and "Smallest Step", one sec's friction pause) and (b) **holding the plan over time** (Sunsama, Motion, Reclaim, Tiimo, Structured). Users praise starter tools for being instant and low-commitment, and they leave planners over rigidity, setup cost, AI changes they didn't ask for, and price. Nobody frames starting as a *negotiation with terms*; the closest are Marvin's strategy menu and one sec's "do you still want to open this?" pause.

### Cited Findings
**Goblin Tools (Magic ToDo)**
- Magic ToDo breaks a task into subtasks. Its "spiciness" slider, per the official description quoted by a blog, gives the tool "a hint about how hard or stressful you find the task. The spicier, the more steps it will attempt to break it down into." — [Saner.ai review (competitor)](https://www.saner.ai/blogs/goblin-tools-review); [Warwick library guide](https://warwick.ac.uk/services/library/using/productivity-tools/magic-todo-gobin-tools)
- Reviewers praise the slider. One says turning it up on bad days gives "micro-steps so small they remove any excuse not to start." — [Thawly review (competitor)](https://thawly.ai/reviews/goblin-tools); [ToolRadar 2026](https://www.gotoolradar.com/2026/05/goblintools-review-2026-anxiety-cure.html)
- Complaint: the default breakdown can be too granular even with the slider. A Product Hunt commenter said the breakdown "sometimes seemed excessive" but that it was otherwise "like magic for my ADHD mind." — [Thawly](https://thawly.ai/reviews/goblin-tools); [Product Hunt](https://www.producthunt.com/posts/goblin-tools)
- Complaint: it stops at the list. There's no scheduling, so users pair it with a calendar or to-do app. Breakdowns feel generic on repeat use, and without an account or Pro ($3/mo per one source) a breakdown is gone once you close the tab. — [Saner.ai](https://blog.saner.ai/goblin-tools-review/) (vendor of a competing app); [Thawly](https://thawly.ai/reviews/goblin-tools)
- It's free in the browser and needs no account. Sources disagree on the slider's range (1–5 chilis; "3–5 broad steps" up to "10–20 micro-steps"), so treat step counts as approximate. — [Saner.ai](https://www.saner.ai/blogs/goblin-tools-review); [Thawly](https://thawly.ai/reviews/goblin-tools)
- Sunsama's public roadmap has a "Goblin Tools" integration request, a sign that users want the breakdown inside their planner. — [Sunsama roadmap](https://roadmap.sunsama.com/integrations/p/goblin-tools)

**Amazing Marvin**
- The "For Procrastinators" page lists: Procrastination Wizard (asks what feels hard and whether you're anxious or unmotivated, then suggests strategies), "The Smallest Step" (marked *Coming Soon*: "Break any task into its tiniest possible first action"), Time Estimates, Focus Music, Mark Your Frogs (tag dreaded tasks), Weighing On Me, Procrastination Count (rescheduled-count shown as exclamation marks), Mood Tracking, Gamification, Accountability Pledges (money at stake), Beat the Clock (race the estimate), Satisfying Completions, and a 30-day procrastination video course. — [amazingmarvin.com/for/procrastinators](https://amazingmarvin.com/for/procrastinators/)
- Marvin names the guilt loop itself: "The guilt makes the task feel even worse". It frames the reschedule counter as "not to shame you, but to show what needs attention." — [Marvin](https://amazingmarvin.com/for/procrastinators/)
- One user found that every task they put off was over 30 minutes long, which they spotted through time estimates. — [Marvin "how to beat procrastination"](https://playground.amazingmarvin.com/how-to-beat-procrastination-with-marvin/)
- Complaints: 100+ toggleable strategies, and the first week is described as overwhelming. One review says the Procrastination Wizard is missing on mobile. Price figures conflict ($8–12/mo). — [Saner.ai Marvin review](https://www.saner.ai/blogs/amazing-marvin-review) (competitor); [Marvin help: "will Marvin fix my procrastination"](https://help.amazingmarvin.com/en/articles/1949435-will-marvin-fix-my-procrastination-problem)

**Tiimo** (visual planner, AI Co-Planner)
- Apple named it iPhone App of the Year 2025, with a reported 4.6★ from about 19K App Store ratings. Another aggregator shows 3.2/5 from about 4,300 reviews (different window or platform). — [Wikipedia](https://en.wikipedia.org/wiki/Tiimo); [JustUseApp reviews](https://justuseapp.com/en/app/1480220328/tiimo-ai-planner-to-do/reviews)
- One analysis of the 100 most recent US App Store reviews (Dec 2025 to Aug 2026) found 49 at 3★ or lower. About 27% of complaints were about AI-focused changes and about 24% about calendar sync bugs. Price (~$10/mo) and aggressive subscription prompts also came up. This analysis is by a competitor and I didn't verify it. — [Soothfy Tiimo alternatives](https://soothfy.com/blog/tiimo-alternatives.html)
- Users split on the AI Co-Planner. Some say it mostly transcribes what you say into tasks and isn't helpful, or is "rigid and inaccurate". A hands-on reviewer found it understood requests well. — [JustUseApp](https://justuseapp.com/en/app/1480220328/tiimo-ai-planner-to-do/reviews); [AnyGen review](https://www.anygen.io/showcase/tiimo-review/index.html)

**Sunsama** (daily planning ritual)
- Unfinished tasks roll over automatically at midnight. Users can roll them over by hand during the evening review, or set rollover to automatic versus "prompt me which ones carry forward". — [Sunsama help: Evening daily planning](https://help.sunsama.com/docs/evening-daily-planning)
- Sunsama describes the Daily Shutdown as a chance "to review your work for the day, reflect, and then pack up and go home". Reviewers credit it with ending "open-loop anxiety". These are vendor and testimonial claims, with no independent evidence that it reduces guilt. — [Sunsama changelog](https://roadmap.sunsama.com/changelog/daily-shutdown); [Asian Efficiency review](https://www.asianefficiency.com/schedule-management/sunsama-review/)

**Motion and Reclaim** (auto-scheduling)
- The most cited Motion complaint is that the AI reschedules the whole day when one thing slips, with no "suggest then approve" mode. Users who want external structure like it; people who want control find it rigid. A Capterra user said auto-scheduling "can feel rigid" for short-notice changes. One review notes the plan "keeps reshuffling itself". — [Morgen Motion review (competitor)](https://www.morgen.so/blog-posts/motion-review); [Capterra AU](https://www.capterra.com.au/software/214264/motion); [Carly review](https://www.usecarly.com/blog/motion-ai-review/); [Reclaim blog (competitor)](https://reclaim.ai/blog/motion-alternatives)
- Counterpoint: some users describe the automation as "the psychological shift" that makes Motion stick. — [DEV review](https://dev.to/skilaai/motion-ai-review-2026-pricing-features-pros-cons-5g95)

**Llama Life** (a countdown timer on every task)
- Product Hunt users praise "the timer on each task", which helps them stop bouncing between things. Play reviewers ask for 1-minute and 5-minute audio warnings. The changelog fixed an alarm that didn't fire while the app was closed. Ratings are modest: 3.93★ from 125 on Android, 4.56★ from 155 on iOS. — [Product Hunt](https://www.producthunt.com/p/llama-life); [Google Play](https://play.google.com/store/apps/details?id=com.llamaapp); [Neurolaunch summary](https://neurolaunch.com/llama-life/)

**one sec** (friction before distracting apps; the closest analogue to Pomodeal's planned Intercept)
- A PNAS field study (2023; 280 participants over 6 weeks) found the app cut opening of target apps by 57%. In a follow-up experiment (N=500), the **option to dismiss the attempt** had the strongest effect, the time delay also helped, and the deliberation message alone did not. — [one sec / Max Planck study page](https://one-sec.app/max-planck-study); [PubMed record via BVS](https://pesquisa.bvsalud.org/ses/resource/pt/mdl-36795756)
- Another summary of the same study: 36% of open attempts ended with closing the app after the pause, and attempts fell 37% across the 6 weeks. — [Time](https://time.com/6240981/social-media-addiction-app); [Synosys publication page](https://synosys.github.io/publication/phillipp-2023-smartphone)

**Body doubling (Focusmate and newer)**
- In 2026 the market is crowded and mostly sold through vendor "best of" posts. StudyStream is the most cited student option ("24/7 focus rooms", 270,000+ students, absorbed Study Together). Focusmate's free tier gives 3 sessions a week. Pricing claims for Flow Club, FLOWN and Focusmate conflict across sources. — [Syncmodo (vendor)](https://www.syncmodo.com/blog/best-focusmate-alternatives); [Roomie (vendor)](https://roomie.cafe/blog/best-body-doubling-apps-2026); [FLOWN](https://flown.com/blog/adhd/best-body-doubling-apps)
- Vendors are pushing camera-free body doubling as a category. — [FocusLive (vendor)](https://www.focuslive.app/blog/focusmate-alternatives)

**Others**
- Saner.ai: a focus mode that pins one task at a time, voice capture that extracts to-dos, and a daily assistant that reads notes, email and calendar to propose a schedule (vendor's own claims). Focus Bear: website and app blocking with goal reminders, $4.99/mo. Finch: a virtual pet for small self-care goals, not built for task initiation. Inflow and Routinery: I found no independent detail on their start-task features. — [Saner.ai](https://blog.saner.ai/best-adhd-apps/); [Inflow blog](https://www.getinflow.io/post/best-alternatives-finch-adhd); [Focus Bear](https://www.focusbear.io/blog-post/best-10-adhd-apps-for-enhancing-focus-and-productivity-in-2024)
- A 2026 App Store entrant, "Ravi: ADHD To-Do starter", is built around showing one small first step and lists "calm daily rhythm instead of streaks or guilt". This suggests "first step, no streaks" is becoming a crowded positioning. — [App Store](https://apps.apple.com/us/app/-/id6755695867)

### Inferences
- The market splits into **starter toys** (instant, stateless, forgotten) and **planner systems** (stateful, heavy, abandoned). A product that is as light as Goblin Tools at the start but **remembers where you left off** across days fills a real gap. Goblin's biggest complaints (forgets everything, no scheduling) and the planners' biggest complaints (setup, rigidity) point to the same space.
- Spiciness is the most praised breakdown control in the category because it asks about *feelings* ("how hard does this feel") rather than *structure* ("how many steps"). That maps directly onto negotiation: the user tells you how hard the deal is, and the terms change.
- one sec's evidence that the *dismiss option* drives the effect supports Pomodeal's "I need this always works" rule. Friction that respects autonomy beats friction that lectures.
- Motion's lesson: never silently re-plan the user's days. Re-planning should be a proposal the user signs, which is a deal.

### Gaps
- No primary data on Structured, Routinery, Opal, Forest, Inflow or Todoist breakdown features was retrieved this session. Training knowledge (unverified): Forest's tree dies if you leave the app; Opal is a screen-time blocker with "Deep Focus" sessions that are hard to break; Structured is a visual timeline planner with an inbox; Todoist offers AI "break down task" via its assistant. Verify before relying on these.
- No retention or churn numbers for any of these apps.
- I found no independent evaluation of Marvin's Procrastination Wizard.

## 2. Why big-task tools get abandoned (community and review signal)

### Takeaway
Second-hand signal (Reddit wasn't directly reachable) points to four repeat causes: **setup cost and overwhelm** (Marvin's first week, Tiimo's learning curve), **guilt from visible backlog** (red overdue badges, growing lists), **plans that break on contact with real life** (Motion's reshuffles, rigid AI schedules), and **novelty decay** (app-hopping after about a week). Price and subscription pressure speed up leaving.

### Cited Findings
- A vendor blog describes the app-hopping cycle: excitement, then use fades after about a week, then the next app. It calls red overdue badges a trigger that "create a shame spiral that paralyzes you." — [Thawly (vendor), ADHD app hopping](https://thawly.ai/overcome/adhd-app-hopping-productivity-tools)
- The loop "open, freeze, close, guilt, avoid" is described in a practitioner newsletter. — [ADHD Wisdom Tools Substack](https://adhdwisdomtools.substack.com/p/the-done-effect-why-finishing-one)
- Marvin's own copy concedes that "storing your tasks in Marvin is not going to transform you", and reviewers call the first week overwhelming. — [Marvin help](https://help.amazingmarvin.com/en/articles/1949435-will-marvin-fix-my-procrastination-problem); [Saner.ai](https://www.saner.ai/blogs/amazing-marvin-review)
- Tiimo complaints (Dec 2025 to Aug 2026) cluster on AI-focused changes (~27%), calendar sync (~24%), missing features and price (competitor analysis). — [Soothfy](https://soothfy.com/blog/tiimo-alternatives.html)
- Motion: the plan "keeps reshuffling itself", and it falls out of date for people whose schedules change at an hour's notice, which describes many students. There are also refund and support complaints. — [Carly](https://www.usecarly.com/blog/motion-ai-review/); [Morgen](https://www.morgen.so/blog-posts/motion-review)
- Sunsama reviewers tie the product's appeal to guilt: as "the pressure from your ever-growing to-do list compounds, so does the guilt". — [Lifestack Sunsama review](https://lifestack.ai/blog/sunsama-review)
- Goblin Tools is abandoned for the opposite reason: it's stateless, so there's nothing to come back to. — [Thawly](https://thawly.ai/reviews/goblin-tools)

### Inferences
- Overdue counts, red badges and growing backlogs are the shame surfaces. Pomodeal's no-shame rule rules them out, but the *information* (this has slipped several times) is still useful. Marvin's reschedule counter shows the risk: it's framed as "a mirror", yet it's still exclamation marks.
- Novelty decay argues for a product whose value refreshes daily without new setup. A deal is made fresh each time, which is a structural advantage over list-maintenance tools.
- Students' schedules are volatile, so any plan-to-deadline must expect slippage as the normal case.

### Gaps
- **No direct Reddit or app-store quotes** from r/ADHD, r/productivity or r/GetStudying were retrieved; the search engine returned blogs instead. A follow-up should pull 10–20 real threads (for example via reddit.com search plus WebFetch of old.reddit.com) before the report states community sentiment as fact.
- No quantitative abandonment data (for example day-30 retention for productivity apps) was found.

## 3. UX patterns for multi-day tasks (deadlines, carry-forward, re-entry, fuzzy progress, "where I left off")

### Takeaway
Existing patterns: **rollover with a choice** (Sunsama: auto versus "pick what carries forward"), **a shutdown ritual** that closes the day, **reschedule counters** (Marvin), and **topic-based study plans** from university learning centres (spread over ~5 days, split by topic, active recall). Nobody owns *re-entry after a missed day* or a *"where I left off" note*. Fuzzy-progress tracking (exam studying) is handled by learning-centre advice, not by apps.

### Cited Findings
- Sunsama: unfinished tasks roll over at midnight. Users can choose automatic rollover or a prompt to select which tasks carry forward. — [Sunsama help](https://help.sunsama.com/docs/evening-daily-planning)
- Sunsama's Daily Shutdown is a ritual to review, reflect and "pack up". — [Sunsama changelog](https://roadmap.sunsama.com/changelog/daily-shutdown)
- Marvin's Procrastination Count shows how many times a task was rescheduled. — [Marvin](https://amazingmarvin.com/for/procrastinators/)
- Cornell's Learning Strategies Center recommends a five-day exam plan in short blocks, about 2 hours a day, and says people "learn faster and perform better if they work in brief blocks of time spread out over longer periods of time"; it also recommends active review (practice questions) over re-reading. — [Cornell LSC five-day study plan](https://lsc.cornell.edu/.../the-five-day-study-plan) (URL truncated in search result; verify)
- The University of Iowa tutoring centre's 7-day plan: list big-picture topics, split each into parts (vocabulary, readings, equations), and spend more time on weak areas. — [UIowa "Creating a Study Plan, 7 Days or Less" PDF](https://tutor.uiowa.edu/sites/tutor.uiowa.edu/files/2021-03/Creating%20a%20Study%20Plan%2C%207%20Days%20or%20Less.pdf)
- A library guide defines a "big" assignment as anything over a few hours and suggests 25-minute chunks. — [St Patrick's library guide](https://saintpatricks-nsw.libguides.com/library_general_study_skills/time_management)
- Yale advising has first-semester exam tips (study timing and spacing). — [Yale College advising PDF](https://advising.yalecollege.yale.edu/sites/default/files/files/Exam%20Study%20Tips%20for%20Students%20in%20Their%20First%20Semester.pdf)

### Inferences
- **Carry-forward without guilt** has two halves: (1) the *user chooses* what carries forward (Sunsama's prompt option), and (2) carried items are shown as *terms still open*, not as *overdue*. Pomodeal's ledger already has borrowed and repaid time, so an unfinished segment can be "time still owed to the essay", repayable on new terms.
- **Re-entry after a missed day** is the moment apps lose people (the novelty and guilt findings above). The re-entry screen should never show what was missed first. It should offer one small deal, then optionally a re-plan.
- **Fuzzy progress** (exam studying): use the learning-centre structure. Progress is "topics touched / practice done / weak spots", not hours or percent complete. Counting hours on exam prep risks rewarding passive re-reading.
- **"Where I left off"** fits a block's end: one line written while context is still fresh becomes the next session's first step. This uses the third-ask "first step" pattern Pomodeal already has.
- Different task types need different units. Writing: sections or word targets. Problem sets: problems. Exam study: topics times practice. Open-ended projects: "next visible artifact". A single "% done" bar fails three of the four.

### Gaps
- I found no product that explicitly designs a "missed-day re-entry" flow. That may be a real gap or a search miss.
- I found no evidence on whether users actually write "where I left off" notes when prompted (adoption rate).
- The Cornell URL is truncated in the search output, so cite the page title instead or re-fetch it.

## 4. AI breakdown UX: trust, editing, granularity, helpful versus patronizing

### Takeaway
User control over granularity (Goblin's spiciness) is the most praised AI-breakdown pattern. The main complaints are **too many steps by default**, **generic output on repeat use**, **AI changes nobody asked for** (Tiimo), and **AI that acts without approval** (Motion). Research on overreliance supports letting users edit AI output before accepting it. I found no study specifically on AI task-breakdown being patronizing.

### Cited Findings
- Spiciness is a user-set "how hard does this feel" hint that scales step count. It's praised for bad days, and some still find the default too detailed. — [Thawly](https://thawly.ai/reviews/goblin-tools); [Product Hunt](https://www.producthunt.com/posts/goblin-tools)
- Goblin breakdowns feel generic on repeat use (it's a general-purpose LLM with no memory of the user). — [Saner.ai (vendor)](https://blog.saner.ai/goblin-tools-review/)
- Tiimo: about a quarter of recent negative reviews cite AI-focused changes, and some say the AI mostly transcribes. — [Soothfy](https://soothfy.com/blog/tiimo-alternatives.html); [JustUseApp](https://justuseapp.com/en/app/1480220328/tiimo-ai-planner-to-do/reviews)
- Motion: no "suggest then approve" mode; the AI takes full control. — [Morgen](https://www.morgen.so/blog-posts/motion-review)
- Microsoft's Aether overreliance literature review (2022, older) lists user agency, meaning being able to edit AI recommendations before accepting them, as a factor in appropriate reliance. — [Microsoft Research PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2022/06/Aether-Overreliance-on-AI-Review-Final-6.21.22.pdf)
- A practitioner post proposes "edit depth" (how much users change AI output) as a trust metric. — [Substack, AI trust factors](https://paulstratbryan.substack.com/p/ai-trust-factors-how-confidence-drives)
- A preliminary arXiv study looked at human trust in LLM-based planners (not task breakdown specifically). — [arXiv 2502.20284](https://arxiv.org/pdf/2502.20284)

### Inferences
- "Patronizing" seems to come from **over-decomposing tasks the user already knows how to do** ("open your laptop", "find a pen"). The granularity control should default *low* and let the user ask for smaller pieces ("make the first one smaller"), not default high.
- For university work, the user knows the domain better than a generic LLM does (a specific essay prompt or problem set). The AI should propose *segments and a first step*, not lecture on content. Steps should be editable inline in one tap, and deleting a step should cost nothing.
- **Only the first step needs to be good.** Pomodeal could break down just the first segment in detail and leave later segments coarse until reached. That cuts generic-output fatigue and AI cost.
- Track edit depth and deletes as an internal quality signal. That would need an entry in the privacy inventory if stored per user.

### Gaps
- I found no peer-reviewed study on AI task decomposition for procrastination or executive function, or on perceived condescension in AI to-do breakdowns.
- No data on how often Goblin users edit generated steps.

## 5. What a PWA can do in late 2026 on iOS and Android

### Takeaway
On iOS, an **installed** (Home Screen) web app gets Web Push (16.4+), Declarative Web Push (18.4+), numeric Badging (16.4+, granted with notification permission), and a working Screen Wake Lock in standalone mode (fixed in 18.4). Since Safari 26 (Sept 2025), any site added to the Home Screen opens as a web app by default. iOS still ignores manifest `shortcuts`, can't be a Web Share Target, has no widgets and no background or periodic sync, and push subscriptions and storage can lapse after inactivity. Android and Chrome are broader (install prompt, and per training knowledge shortcuts, share target and notification actions), but push should still be designed iOS-first.

### Cited Findings
- Web Push for Home Screen web apps arrived in iOS/iPadOS 16.4. Notifications show on the Lock Screen, in Notification Center and on Apple Watch, and respect Focus. Permission must be requested from a direct user action. — [WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- Badging API on iOS 16.4 for Home Screen web apps; permission is "automatically granted when a user gives permission for notifications". — [WebKit: Safari 16.4 features](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/)
- Declarative Web Push (no service worker needed for simple pushes) arrived in Safari 18.4. — [TapPWA iOS limitations 2026](https://tappwa.com/blog/ios-pwa-limitations-2026); [Mobiloud](https://www.mobiloud.com/blog/progressive-web-apps-ios/)
- Screen Wake Lock: supported in Safari from 16.4, but broken in standalone Home Screen apps until iOS 18.4 (WebKit bug 254545). — [WebKit bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545); [caniuse](https://caniuse.com/wake-lock); [OpenPWA](https://openpwa.net/compatibility/wake-lock/)
- Safari 26 (shipped with iOS 26 on Sept 15, 2025) makes every site added to the Home Screen open as a web app by default, with or without a manifest. — [WebKit: Safari 26.0 features](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/); [Wikipedia iOS 26](https://en.wikipedia.org/wiki/IOS_26)
- iOS still lacks: manifest `shortcuts` ("ignored"), Web Share Target ("Cannot register a PWA as a share recipient"; `navigator.share()` out works), Background Sync and Periodic Background Sync, and home-screen widgets. Push subscriptions can lapse after weeks of inactivity ("Treat the subscription list as decaying"), and local storage can be cleared after about 7 days idle. Cache cap is about 50 MB. Note: this page's reference point is iOS 18.5, so it may predate iOS 26 changes. — [TapPWA](https://tappwa.com/blog/ios-pwa-limitations-2026); [PWA on iPhone 2026 (Synthetixis)](https://synthetixis.com/writing/pwa-ios-2026)
- EU: Apple reversed its 2024 plan to drop standalone PWAs in the EU before iOS 17.4 shipped, so EU standalone PWAs still work. — [TapPWA](https://tappwa.com/blog/ios-pwa-limitations-2026)
- Android Chrome fires `beforeinstallprompt` (one-tap install); iOS has no equivalent. One author estimates iOS install rates at 30–50% of Android's (anecdotal). — [TapPWA](https://tappwa.com/blog/ios-pwa-limitations-2026)

### Inferences
- **Install is the gate on iOS.** Push, badge and reliable wake lock all require Add to Home Screen. Onboarding has to earn the install early, for example "Want me to tap you when your break ends? Add me to your Home Screen."
- **The iOS Shortcuts "Intercept"** is the workaround for missing manifest shortcuts and share target: a Shortcuts automation that opens a Pomodeal URL with parameters (for example `?from=instagram`). Shortcuts can also be a pseudo-share-target (Share Sheet, then a Shortcut, then a Pomodeal URL). This is a design inference, not tested here.
- **Badge numbers can become shame.** A numeric badge means "unread/overdue" to most people. If used at all, the badge should mean "a deal is waiting" (count = 1) or show the running block, never a backlog count.
- **Notification copy must work without action buttons on iOS.** Design every push as a single tap to a pre-filled deal screen. Training knowledge (unverified): Chrome on Android supports notification `actions`; Safari/iOS web push does not show custom action buttons.
- Wake lock lets the timer screen stay on during a block on a desk-propped phone. It needs iOS 18.4+.
- Time-from-`startedAt` is the right model: no background execution on iOS, so block boundaries must come from server-scheduled pushes (Convex), which matches the project conventions.

### Gaps
- I found no primary WebKit source confirming iOS 26.x status for notification action buttons, manifest shortcuts, or any new web-app features in Safari 26.1–26.x; the Safari 26.0 post was found but not read in full.
- No source on iOS push delivery reliability or throttling for web apps versus native.
- Android Chrome support for shortcuts, share target and notification actions comes from training knowledge, not checked this session.
- No source on whether iOS 26 Live Activities or widgets are reachable from web apps (believed not).

## Novel feature ideas

Ideas that fit the negotiation framing (deal, terms, ticket, stamp, ledger). None is a straight copy of a competitor.

1. **Down-payment deal for big tasks.** When the user names something big ("essay due Friday"), Pomodeal doesn't plan it. It asks for a *down payment*: a tiny first block (5–15 min) with a named first step, stamped as "first payment on the Essay". The full plan is offered only *after* the down payment is made. *Signal:* Goblin's breakdowns are stateless, and Marvin's most anticipated feature is "Smallest Step"; planners lose people at setup (Marvin's first week, Tiimo's learning curve); Pomodeal already asks for a first step on the third extension.

2. **"How hard does this feel?" sets the terms, not just the step count.** A spiciness-style dial, but it changes the *deal*: a harder dial gives a smaller first block, a first-+5 that's free longer, and a bigger break credit; an easier dial gives the bonus-deal offers sooner. Granularity of steps defaults *low* and can be turned up ("make the first one smaller"). *Signal:* spiciness is the most praised breakdown control; "too many steps by default" is its main complaint; "patronizing" risk with over-decomposition (Section 4).

3. **Bookmark stamp ("where I left off").** At the end of every block on a multi-day task, a one-line prompt: "Leave yourself a bookmark: next time, start with…". The next deal on that task opens with the bookmark as its first step. It works for all four task types (paragraph to write next, problem 7, topic still weak, next artifact). *Signal:* nobody owns re-entry; Sunsama's shutdown is valued for closing open loops; Goblin is criticized for forgetting. *Privacy:* free text, so add it to the privacy inventory.

4. **Open terms, never overdue.** Unfinished segments of a multi-day task become *open terms* on the ledger ("45 min still owed to the Essay"). The next day, the user is offered fresh terms: repay now, split it, push it with a new date, or "I need this: not today". No red counts, no slip counter visible by default. *Signal:* red overdue badges as a "shame spiral"; Sunsama's choose-what-carries-forward; Marvin's reschedule counter shows how easily the same info becomes shame.

5. **Deadline contract with suggest-then-sign re-planning.** For a deadline task, Pomodeal drafts a schedule of tickets across the days left (spread per the Cornell and Iowa advice) and shows **slack as credit** ("you have 2 spare blocks"). When a day is missed, it *proposes* a revised contract that the user signs or haggles; it never silently reshuffles. *Signal:* Motion's top complaint is re-planning without approval; students' schedules change at short notice; spaced short blocks beat cramming (Cornell).

6. **Comeback deal after a missed day.** On first open after a gap, the app shows no history, only a single small "welcome back" deal, possibly with a one-time "clean slate" that forgives open terms ("Start from today: owed time cleared?"). The re-plan is optional and comes after the first block. *Signal:* abandonment after about a week and the guilt-avoid loop; no competitor found that designs for re-entry.

7. **Task-shaped progress, not hours.** Each task type gets its own unit on the ticket. Writing: sections or word targets. Problem sets: problems stamped. Exam study: topics times "practiced, not just re-read" stamps, with weak topics surfacing in the next deal. Projects: "next visible thing". *Signal:* the Iowa topic-split and weak-area method; Cornell's active review over re-reading; a single "% done" fails fuzzy tasks.

8. **Intercept that offers the big task's next payment.** When Instagram triggers the Intercept, the counteroffer is the *specific* open term ("10 more min of Reels, then 15 min on problem 7 — your bookmark"), always with a no-cost "not now" dismiss. *Signal:* one sec's PNAS result that the dismiss option drove the effect, and a deliberation message alone didn't; a concrete bookmark is a stronger counteroffer than a generic "focus".

9. **Co-signed deals in rooms.** In a private room, a friend can *co-sign* your deal for a big task (a stamp from them, not a video feed). When you finish, they see the stamp; when you renegotiate, they see nothing. Presence is ambient and camera-free. *Signal:* body doubling is crowded, but students go to StudyStream-style rooms and vendors push camera-free; Pomodeal's rooms are small and private, which suits low-pressure accountability without leaderboards or streaks.

10. **Push as a pre-filled counteroffer, badge as "deal waiting".** Block-end and planned-session pushes open straight into a pre-filled deal ("Break's done. Bookmark: intro paragraph. 25 min?"), since iOS web push can't show action buttons. The badge is only ever 1 ("a deal is waiting"), never a backlog count. Install is pitched at the moment it pays off ("Want me to tap you when the break ends?"). *Signal:* iOS web push and badging require Home Screen install; badges conventionally signal unread/overdue (a shame risk); there's no background execution, so server-timed pushes matter.
