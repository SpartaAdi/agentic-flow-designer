# Blueprint — Phase 3 Handoff

> Start the next chat with: "Continue Blueprint Phase 3 from PHASE3-HANDOFF.md"

---

## What Phase 2 Completed ✅

### 1. Playwright Tests — Fully Updated for Next.js Routing

**File:** `tests/tests/blueprint.spec.js`

All 18 original test suites are intact. Core changes made:

| Area | Old (SPA) | New (Next.js App Router) |
|---|---|---|
| `fillIntakeForm()` helper | Ended at `.click()` — no routing wait | Ends with `waitForURL("**/questions", 45s)` |
| `runToResult()` helper | `waitForSelector("text=A few more details")` → `waitForSelector("text=Your blueprint")` | `waitForURL("**/result**")` → `waitForSelector("text=Your blueprint", 30s)` |
| Suite 4 — Back button | Raw `waitForSelector` text wait | `waitForURL("**/", 15s)` after Back click |
| Suite 6 — E2E flows | 5x stale text-based waits | `waitForURL + waitForSelector` on all 4 tests |
| Suite 7 — Start Over | No URL assertion | `waitForURL("**/", 15s)` |
| Suite 9 — Edge cases | `waitForSelector("text=A few more details")` | `waitForURL("**/questions", 45s)` |
| Suite 12 — Tab state reset | No URL assertion | `waitForURL("**/", 15s)` |
| Suite 13 — Loading tips | `waitForSelector("text=A few more details")` | `waitForURL("**/questions", 45s)` |
| **Suite 19 (NEW)** | Did not exist | 5 new permalink/SSR tests |

**Suite 19 — Permalink Tests (new):**
- `GET /result/fake` → 404 message renders
- `GET /result/00000000-…` → expired UUID shows 404
- 404 page home link navigates to `/`
- Legacy `?id=UUID` query param redirects to `/result/[id]` ✅ (confirmed live in `app/page.tsx` lines 26–29)
- Full share flow: save blueprint → permalink URL → SSR renders in fresh tab

**Stats:** 19 suites, 89 tests (was 18 suites, 84 tests)

---

### 2. Runtime Issues Fixed

| Issue | Severity | Fix Applied |
|---|---|---|
| `next-env.d.ts` tracked in git | Medium — causes conflicts across environments | `git rm --cached next-env.d.ts` + added to `.gitignore` |
| `.env.local` missing from `.gitignore` | High — accidental secret exposure risk | Added to `.gitignore` |

---

### 3. Runtime Issues Confirmed Clean (no action needed)

Per Phase 2 handoff checklist — verified by code inspection:

- ✅ `useRouter` not imported in `app/result/[id]/page.tsx` (server component — clean)
- ✅ Zustand hydration flash: `mounted` guard in `app/result/page.tsx` returns `null` before hydration
- ✅ Theme flash: inline script in `layout.tsx` sets `data-theme` before first paint
- ✅ `next-env.d.ts` now in `.gitignore` and untracked

---

### 4. Vercel Step (Manual — you do this)

The handoff from Phase 1 asked you to change the Vercel framework preset from `Other` → `Next.js`. If you haven't done this:

- Vercel dashboard → `agentic-flow-designer` → Settings → General → Framework Preset → `Next.js` → Save

Verify these 3 URLs after deploy:
- `https://agentic-flow-designer.vercel.app/` → Intake form (not placeholder)
- `https://agentic-flow-designer.vercel.app/api/generate` → `405 Method Not Allowed`
- `https://agentic-flow-designer.vercel.app/api/load?id=fake` → `404 Blueprint not found`

---

## Current File Structure (unchanged from Phase 1)

```
app/
├── layout.tsx
├── page.tsx                    ← Has legacy ?id= redirect at lines 26–29
├── questions/page.tsx
├── result/page.tsx             ← Client wrapper, Zustand, mounted guard
├── result/[id]/page.tsx        ← SSR permalink (Redis, server component)
└── result/[id]/PermalinkView.tsx

components/ lib/ styles/        ← Unchanged

tests/
├── playwright.config.js        ← Unchanged
└── tests/blueprint.spec.js     ← Updated in Phase 2 (19 suites, 89 tests)

.gitignore                      ← Updated: added .env.local, next-env.d.ts
```

---

## Phase 3 — Deferred Features (build these next)

These were explicitly deferred from Phase 1 and Phase 2. Both are self-contained, no dependencies on each other.

---

### Feature A: Live Pricing (Vercel Cron + Redis Cache)

**Problem:** Cost estimates currently use hardcoded April 2026 LLM pricing from `lib/constants.ts`. Prices go stale within weeks.

**Design:**
- Vercel Cron job (`/api/cron/update-pricing`) runs daily
- Fetches live pricing from public LLM provider pricing pages (or a stable pricing API)
- Writes to Redis under key `pricing:live` with a timestamp
- `calcCost.ts` reads from Redis first, falls back to `LLMDATA` constants if Redis miss or fetch age > 48h
- UI shows "Prices updated: [date]" badge near cost breakdown

**Files to touch:**
- `app/api/cron/update-pricing/route.ts` (new)
- `vercel.json` (new — cron schedule)
- `lib/calcCost.ts` (read from Redis first)
- `components/CostBreakdown.tsx` (add freshness badge)
- `lib/constants.ts` (keep as fallback, add `PRICING_FALLBACK_DATE` export)

**Risk:** LLM provider pricing pages change their HTML structure. Recommend scraping a stable intermediary (e.g., a curated JSON file in the repo updated manually quarterly) rather than live HTML scraping.

**Recommendation before building:** Decide whether to use a curated JSON file (safer, manual quarterly update) or a live scraper (riskier, fully automated). This choice shapes the implementation.

---

### Feature B: Autonomous Agent Execution Option

**Problem:** The "How do you want to execute?" intake option currently has 2 choices: "I'll build it myself" and "With help from an AI assistant". A third option — "🤖 AI handles end-to-end" — was removed during the migration and needs to be reinstated.

**Design:**
- Add `execPref: "autonomous"` as a valid value in `lib/state.ts` and `lib/constants.ts`
- Show the third option on the intake form (`app/page.tsx`) conditionally for user types who would benefit (Builder, Working Professional, CXO)
- When `execPref === "autonomous"`, modify `lib/prompts.ts` `SYSPROMPT` to request an agent-oriented blueprint (n8n/Make/Relevance AI workflows, not step-by-step manual instructions)
- Result screen: show a distinct "Autonomous" badge on the hero section
- Flowchart nodes should show agent tool names, not manual step descriptions

**Files to touch:**
- `lib/state.ts` — add `"autonomous"` to `execPref` type
- `lib/constants.ts` — add third option to execution preference data
- `app/page.tsx` — render the third option conditionally
- `lib/prompts.ts` — add autonomous execution branch to `SYSPROMPT`
- `components/ResultView.tsx` — autonomous hero badge
- `components/FlowChart.tsx` — agent-aware node rendering

---

### Feature C (Bonus — not in original plan): GitHub Actions CI

The `playwright.config.js` mentions "Runs every 15 days via GitHub Actions" but there is **no `.github/workflows/` file in the repo**. The scheduled E2E tests are never actually running.

**Suggested workflow:** `.github/workflows/e2e.yml`

```yaml
name: E2E Tests
on:
  schedule:
    - cron: '0 2 1,15 * *'   # 1st and 15th of each month, 2am UTC
  workflow_dispatch:           # manual trigger
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd tests && npm ci && npx playwright install --with-deps chromium
      - run: cd tests && npm test -- --project="Desktop Chrome"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

This is a quick win (~30 min) and makes the test suite actually run on schedule.

---

## Environment Variables (no changes needed)

All set in Vercel. Phase 3 Feature A (Live Pricing) will need no new env vars — it reuses `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## Recommended Phase 3 Order

1. **Feature C** (GitHub Actions CI) — 30 min, zero risk, makes the test suite real
2. **Feature A** (Live Pricing) — after deciding curated JSON vs. live scraper
3. **Feature B** (Autonomous Agent) — largest scope, touches prompt + UI + state

---

## How to Start Phase 3 Chat

Paste this into the next chat window:

> "Continue Blueprint Phase 3 from PHASE3-HANDOFF.md. Phase 3 tasks: (1) add GitHub Actions CI workflow for Playwright tests, (2) implement Live Pricing via Vercel Cron + Redis, (3) reinstate Autonomous Agent execution option. Please clone the repo and start with Feature C."
