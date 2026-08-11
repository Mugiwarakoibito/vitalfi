# Sentience Engine — Session Memory

## Last Updated: August 11, 2026

## Session: Milestone Path — one smart tool (Milestones panel final form)

### What was done
- User: "too much data, fewer options, merge them into ONE smart tool, come up with a new spirit" → Milestones panel is now **Milestone Path**, a single glanceable tool with NO sections:
  - **Header**: "Milestone Path" + "One mission · one path · keep moving" + dot strip X/10 chip
  - **Mission card** (the whole point): rank row (icon, title, rank N, slim level bar X/next-min) + **SVG progress ring** (animated gradient stroke, % in center) + mission name/category, "N more % consistency to go", X/target chip, ETA chip, LIVE badge, and the 🤖 coach line folded inside the card (truncated >150 chars)
  - **The Path**: one horizontal track — 10 connected nodes (✓ emerald glow for earned, pulsing amber for current mission, dim for rest); per-node tooltip = name — desc + progress; no per-card data visible
  - **Quick stats**: single inline chip row (Streak · This month · Pace) — consistency dropped (it's the mission %)
- **Removed entirely**: badge grid, 4-card live-stats grid, Quests section (6 challenge cards), `activeChallenges` useMemo, `Award` import
- Verified live via Playwright (17/17 PASS, zero console errors): header, MISSION label, Locked In mission, ring %, ETA ~Sep 22, LIVE, coach line, THE PATH, 2/10 milestones, 10 nodes/2 unlocked, Streak/This month/Pace chips, no Quests, no badge grid

### Key learnings (verification — CRITICAL)
- **Storage is IndexedDB `LifeSyncDB` (v5), NOT localStorage** — seeding localStorage is useless; seed via `indexedDB.open('LifeSyncDB', 5)` in `addInitScript` (onupgradeneeded creates the 16 stores w/ keyPath 'id'; onsuccess puts settings row `app_settings` + workouts). Old memory entries claiming localStorage seeding were wrong in practice
- Landing `/` shows a country/currency onboarding modal (Continue disabled until country picked + name filled) only for fresh profiles; direct `https://vitalfi.vercel.app/fitness?tab=habits` skips it once IDB-seeded
- **Milestones toggle is an ICON button** — text selectors fail; use `button[title="Milestones"]`; also the page is reached via the `habits` tab (not "Workout Logger" click)
- CSS `uppercase` classes transform innerText → always match case-insensitively (MISSION / THE PATH / STREAK)
- Final round-trip: commit + push + `npx vercel --prod --yes` (≥600s) → verify live → delete probe scripts

### Files modified
- `src/components/fitness/Habits.tsx` — Milestone Path replaces Engine (commit `fee55f4`; glanceable-flow intermediate was `2b27f62`), file now ~1160 lines

### Deployed to
- **GitHub:** https://github.com/Mugiwarakoibito/vitalfi (commits `2b27f62`, `fee55f4`)
- **Vercel:** https://vitalfi.vercel.app

---

## Session: Unified Milestone Path (Milestones panel redesign)

### What was done
- User: "too many options" → trimmed ACHIEVEMENTS 16 → **10** (removed Veteran, Unbreakable, Busy Month, Rhythm, Explorer, Pace Setter); unlocked rhythm gone → chip math for seed = 2/10
- User: "Levels, achievements & challenges in ONE well developed option, like the most powerful tool" → Milestones panel now a single unified flow:
  - **Level Hero** (unchanged, all-time progression)
  - **Milestone Path** section: header + unlock dot strip + X/10 chip, then a **Current Mission spotlight** card — the closest unearned achievement: pulsing icon tile with glowing dot, "CURRENT MISSION" label, big % counter, "N more workouts/days/% consistency to go" ETA, animated gradient progress bar with shimmer (unit derived from category: Milestones→workouts, Streaks→days, Monthly→workouts this month, Consistency→% consistency)
  - **Achievement grid** below (10 cards, progress bars, ✓ badges, category chips, tooltips) — **filter tabs REMOVED** (and `achFilter` state deleted)
  - **Challenges** divider (hairline + centered label) merges Active Challenges into the same flow
- Verified on live Vercel via Playwright (msedge headless + app_settings seed): 10 cards with exact names, removed ones absent, Milestone Path header ✓, Current Mission label ✓, filter buttons gone ✓, Challenges divider ✓, chip 2/10, zero console errors

### Key learnings (infra)
- **vite preview via Start-Process gets killed when the bash tool call ends** — background servers do NOT survive between calls (worked once by timing luck). Local verification now unreliable → **deploy first, then verify against https://vitalfi.vercel.app directly** (works every time)
- Foreground `node node_modules/vite/bin/vite.js preview --port 4173` works fine (killed by tool timeout — expected)

### Files modified
- `src/components/fitness/Habits.tsx` — ACHIEVEMENTS 16→10 entries; Achievements Grid IIFE replaced with unified Milestone Path (mission spotlight + grid); Active Challenges → Challenges divider header; `achFilter` state removed; file now ~1295 lines

### Deployed to
- **GitHub:** https://github.com/Mugiwarakoibito/vitalfi (commit `431234c`; trim itself was uncommitted when redesign landed — single commit covers both)
- **Vercel:** https://vitalfi.vercel.app

---

## Session: Expand Achievements section (Milestones panel)

### What was done
- User asked to make the Achievements section in Milestones more developed with helpful options/data
- `ACHIEVEMENTS` array grown 8 → **16 achievements** with 4 categories (Milestones / Streaks / Monthly / Consistency): added Double Century 💯, Veteran 🗓️ (365 days since first), Unbreakable 🔗 (50-day streak), Busy Month 📅 (10/month), Rhythm ⚖️ (50% consistency), Locked In 🔒 (75%), Explorer 🧭 (30 unique days), Pace Setter 🏃 (4/wk avg). New type shape adds `desc`, `category`, `progress: (s) => { current, target }`, `color` — unlock effect unchanged (uses `check`)
- Every card now shows: icon + ✓ badge (unlocked) or **percent label** (locked), name, category chip, and an animated **progress bar** in the achievement's accent color; `title` tooltip = desc + current/target · pct
- **Next Up tracker** bar (amber, animated): closest unearned achievement by % (computed once, drives both bar and "NEXT" badge on the card)
- **Filter tabs**: All (16) / Unlocked (n) / In progress (n) via `achFilter` state; framer `layout` animates filtering
- Verified locally + on live Vercel via Playwright (msedge headless): 16 cards, chip 3/16, per-card pct correct (Dedicated 9/30 · 30%, Pace Setter 3.9/4 · 98%, Veteran 16/365 · 4%), Unlocked filter = 3 (First Step/Week Warrior/Rhythm), In-progress = 13 (no unlocked cards), back to All = 16, zero console errors

### Key learnings (verification)
- **Seed must write settings row with id `app_settings`** + `onboardingComplete: true` (NOT `id: 'onboarding'`) — otherwise app shows onboarding screen and panels never render (failed both locally and live)
- Card selector trick: cards have `title` with a `\n` — must filter in JS (`title.includes('\n')`), newline in CSS attribute selector is invalid; `[` in `.text-[7px]` classes also invalid in querySelectorAll → walk DOM instead
- `node verify.cjs` must run from repo root (playwright-core resolution); vite preview via `Start-Process node -ArgumentList 'node_modules/vite/bin/vite.js','preview','--port','4173'` — server dies if spawned in a separate bash call; run server + test in the SAME call; preview process must be killed after

### Files modified
- `src/components/fitness/Habits.tsx` — ACHIEVEMENTS const (16 entries, new shape), `achFilter` state, Achievements Grid rewritten (filters, Next Up tracker, progress bars, category chips, ✓ badges), file now 1302 lines

### Deployed to
- **GitHub:** https://github.com/Mugiwarakoibito/vitalfi (commit `787f4c6`)
- **Vercel:** https://vitalfi.vercel.app

---

## Session: Goals tab → per-habit weekly goals

### What was done
- User asked to change the kind of data the 🎯 Goals tab shows
- Replaced the single workout-goal "This Week" card with a **Weekly Goals** panel: all 6 habits × smart weekly targets (workout = max(round(weeklyAverage), 3) dynamic; nutrition 6, sleep 7, hydration 5, recovery 3, supplements 6 fixed), per-habit progress bar + `done/target` + status chip (✅ goal met / 🔥 almost there / ⚡ halfway / 🌱 started / 💤 no days), header "X/6 met" chip, footer total bar `X/31`; week-scoped via scopeWeek
- Habit Balance radar unchanged (week-scoped)
- Verified via Playwright: rows/goal chips/met count/total all present, zero console errors (note: with seed data weeklyAverage 3.7 → workout goal 4 → no "goal met" in current week — expected)

### Files modified
- `src/components/fitness/Habits.tsx` — goals IIFE rewritten (1230 lines total)

### Deployed to
- **GitHub:** https://github.com/Mugiwarakoibito/vitalfi (commit `3a534b4`)
- **Vercel:** https://vitalfi.vercel.app

---

## Session: Differentiate Goals tab from Milestones panel

### What was done
- User reported the Milestones panel and 🎯 Goals tab showed the same data (Level card + similar streak milestones)
- 🎯 Goals tab now shows ONLY week-scoped data: "This Week" card (week workout goal bar + 7 day dots + week streak power X/42 + all-time context + pace-based 🏆 100 by {date} ETA) + Habit Balance radar; removed the Level card and streak milestones grid (and their now-unused locals: level/nextLevel/levelProgress/estimateDate/milestoneTargets/milestones; paceEta now checks `stats.totalWorkouts < 100` directly)
- Milestones panel unchanged: Level card (all-time progression) + Achievements + Active Challenges + Workout Diversity — completely different data from Goals now
- Verified via Playwright: 11/12 checks (Goals has no level/milestones text, Milestones has no week card; "Workout Diversity" guard hides section when seed has no exercises — expected)

### Files modified
- `src/components/fitness/Habits.tsx` — goals IIFE trimmed (~172 → ~77 lines), file now 1227 lines

### Deployed to
- **GitHub:** https://github.com/Mugiwarakoibito/vitalfi (commit `8a805a8`)
- **Vercel:** https://vitalfi.vercel.app

---

## Session: Make Analytics tabs week-scoped (Streaks / History / Goals)

### What was done
- All three Analytics tabs in `Habits.tsx` now reflect the **selected week** (scopeOffset/scopeWeek navigation in the Analytics header), not just all-time data
- **🏆 Streaks:** each habit row now shows the streak *as of the end of the selected week* (current week = live streak; past weeks = week-end streak), adds a `wk N/7` chip, header shows scopeWeekLabel + "X/6 in week", footer X/42 is now week-scoped, and a new per-day habit bar strip (7 bars, weekday letters, title tooltips) was added
- **📋 History:** now TWO panels — "Week Snapshot" (per-habit N/7 coverage bars + heat status: 🔥N-day streak / ⚡ / scattered / off) and "Segments in this week" (streak segments filtered to intersect the selected week, month-grouped, longest-N chip, Live badges) with a proper empty state per week
- **🎯 Goals:** kept all-time Level card (added "+N this week" chip), replaced old "Total Streak Power" with a new "This Week" card (week workout goal bar `X/{max(round(weeklyAverage),3)}`, 7 workout day dots, week streak power X/42 + all-time context, pace-based "🏆 100 by {date}" ETA), milestones grid unchanged
- **Habit Balance radar** is now week-scoped: each axis = (days done in week / 7) × max, header shows `· {scopeWeekLabel}` + X/100 chip
- Helper pattern: each IIFE defines local `getDates(habit)` (habit → date array), `countInWeek(dates)`, `streakAt(dates, weekEnd)` — no new memos needed

### Key decisions
- `weeklyCompletion` (rolling last-7-days) was NOT week-scoped — replaced its usage inside the streaks IIFE with week-set-based `countInWeek`; memo still used by the dashboard panel (line 433), so kept
- `scoreBreakdown` (90-day) kept for the dashboard mini panel; the radar IIFE computes week values locally
- `overallTarget` variable removed (no longer used); `Flame` icon no longer used in goals (still used at line 355 dashboard)
- Scope weeks only go to the past (offset ≤ 0), future weeks impossible by design
- Verified locally via Playwright (msedge channel — NO playwright browsers installed; `chromium.launch({ channel: 'msedge' })`): 17/17 checks passed, zero console errors; seed must set `vitalfi_seeded=true` (demo data) + `lifesync_license_email` (license gate) + `settings.onboardingComplete` (onboarding gate) + hydration entries need `drinkType` (seed.ts cleanup deletes entries without it); navigate to `/fitness?tab=habits`; analytics toggle button is icon-only → click via `getByTitle('Analytics')`; CSS `uppercase` classes transform innerText (match case-insensitively)

### Files modified
- `src/components/fitness/Habits.tsx` — 4 IIFEs rewritten (streaks 575–685, history 686–835, goals 836–1008, radar 1009–1054), ~1331 lines total

### Deployed to
- **GitHub:** https://github.com/Mugiwarakoibito/vitalfi (commit `4b61167`)
- **Vercel:** https://vitalfi.vercel.app

---

## Session: Fix BodyMetricsTracker not appearing in build

### What was done
- Diagnosed why `BodyMetricsTracker` component was silently excluded from the production bundle
- Root cause: `console.log('BODY_METRICS_TRACKER_LOADED')` on line 1 before all `import` statements — ESM syntax violation causes esbuild to silently fail module graph resolution, tree-shaking out the entire named export
- Fixed by moving debug statement after imports (changed to `export const BODY_METRICS_DEBUG = 'LOADED'`)
- Rebuilt and verified BodyMetricsTracker code is in `Fitness-C9kpH8-S.js` chunk
- Deployed to Vercel production — live at https://vitalfi.vercel.app

### Key decisions
- Never put code before import statements in ESM modules — even if esbuild/vite appear to handle it, it can silently break module bundling

### Files modified
- `src/components/fitness/BodyMetricsTracker.tsx` — moved `console.log` debug statement after imports

### Deployed to
- **Vercel:** https://vitalfi.vercel.app

---

## Session: Simplify Recovery.tsx to match HydraCoach patterns

### What was done

### What was done
- Replaced the 200-line full-screen Settings modal with a small inline dropdown (Target icon with range slider) — matching HydraCoach's settings pattern
- Removed complex RecoverySettings interface (30+ fields → single recoveryGoal number)
- Added date navigation (left/right arrows + calendar input + jump-to-today) — matching HydraCoach toolbar
- Changed stat cards from dynamic runtime colors to fixed accent colors per metric — matching HydraCoach's 6-card layout
- Removed Achievements panel, Body panel toggle, and the large merged 3-section RECOVERYCOACH card
- Replaced with HydraCoach-style RECOVERYCOACH panel: 4-item stats bar, 2 simple coach cards (Recovery Status + Quality Trend), AI tips section
- Simplified form modal: removed all conditional fields (HRV, RHR, body temp, training load, protocols, journal) — only core metrics + sleep + DOMS + notes
- Removed ~1025 lines of dead code: exportCSV, exportJSON, importJSON, ACCENT_COLORS, Toggle component, unused state variables, settings modal sections, achievements panel
- Total file reduction: ~1539 lines → ~514 lines (66% smaller)

### Key decisions
- Settings are now a single recoveryGoal slider (Target icon) instead of a full modal — complexity deferred
- Stat cards use fixed accent colors per type (emerald=Today, violet=Week Avg, amber=Streak, indigo=Sleep Q, sky=Goal Hit, rose=DOMS) matching HydraCoach
- Only 2 toggle panels (RECOVERYCOACH + Trends) instead of 4 (Trends, Body, Achievements, Settings) — matching HydraCoach's 2-panel pattern
- RECOVERYCOACH panel mirrors HydraCoach layout exactly: stats bar, 2 coach cards, AI tips section
- Date navigation now works (was previously missing from Recovery toolbar)
- Form no longer has conditional fields — always shows core 4 sliders + sleep + DOMS + notes

### Dependencies added
- None

### Dependencies removed
- None

### Files created
- None

### Files modified
- `src/components/fitness/Recovery.tsx` — major simplification (~1539 → ~514 lines)

### Environment variables needed
- None

### Known issues
- DayRange (7d/14d/30d) toggle moved from RECOVERYCOACH header into Trends panel — matches HydraCoach where chart controls live inside the Scope panel
- RECOVERYCOACH panel only appears when entries exist (matching HydraCoach behavior)
- Sleep-Recovery Correlation panel (previously replaced Settings) is now removed entirely — trends data is visible in the Trends panel

### Next steps
1. Deploy to Vercel
2. Verify on deployed site

### Deployed to
- **GitHub:** https://github.com/Mugiwarakoibito/vitalfi

---

## Session: Fix Analytics charts not rendering in Habits.tsx

### What was done
- Added 3 Recharts charts to the Analytics section of Habits.tsx (Streaks, History, Goals tabs)
- Strukts tab: Daily Completion bar chart (week scope, per-habit completion count, violet/gray Cell coloring)
- History tab: Monthly Workout Trend area chart (last 12 months, amber gradient)
- Goals tab: Habit Balance radar chart (6-axis score distribution, emerald fill)

### Debugging journey
- All 3 charts silently failed to render in the live build — no TS errors
- Suspected Recharts `ResponsiveContainer` width resolution inside the analytics card
- Simplified to plain `<div>` placeholders — containers were present but Recharts elements invisible
- After adding Recharts back, hit `TS1005: ')' expected` at the history chart IIFE closing
- Root cause: the history section originally had TWO separate `{chartTab === 'history' && (() => { ... })()}` IIFE expressions (timeline + chart). The TypeScript JSX parser got confused by consecutive IIFE patterns for the same tab condition
- Fix: combined both timeline and chart into a SINGLE IIFE returning a Fragment `<>...</>`
- The closing pattern `)})()` must include the `)` for `return (...)` wrapper (streaks and goals chart IIFEs already used this pattern correctly)

### Key decisions
- All three charts live in their own IIFEs within the same `{chartTab === 'X' && ...}` expression — no Fragments for tab-level content
- Single `chartTab === 'history' && (() => { ... })()` IIFE contains both timeline and trend chart inside `<>...</>` Fragment
- Removed `overflow-hidden` and `h-full` from content area to prevent chart clipping
- All data guards removed — charts always render with whatever data is available

### Files modified
- `src/components/fitness/Habits.tsx` — added 3 charts, combined history tab IIFE, adjusted imports

### Next steps
- Deploy to Vercel and verify charts render on live site
