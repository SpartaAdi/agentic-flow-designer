# Blueprint — Phase 2 Handoff

> Start the next chat with: "Continue Blueprint Phase 2 from PHASE2-HANDOFF.md"

---

## What Phase 1 Built (Complete ✅)

The entire Next.js migration is live on `main`. The monolithic `index.html` is gone.

**Live URL:** https://agentic-flow-designer.vercel.app  
**GitHub:** https://github.com/SpartaAdi/agentic-flow-designer  
**Branch strategy:** Single `main` branch. No more `nextjs-migration`.

### File structure now on `main`
```
app/
├── layout.tsx               ← Root layout, Inter font, theme-flash prevention script
├── page.tsx                 ← Full intake screen (5 user types, conditional fields)
├── questions/page.tsx       ← Full questions screen (multi-select, no maxSel cap)
├── result/page.tsx          ← Fresh-result client wrapper (reads Zustand)
├── result/[id]/page.tsx     ← SSR permalink (Redis load server-side)
├── result/[id]/PermalinkView.tsx ← Client wrapper for SSR page
└── api/
    ├── generate/route.ts    ← Gemini proxy (2.5-flash, JSON mode)
    ├── save/route.ts        ← Redis save, 90-day TTL, URL = /result/${id}
    └── load/route.ts        ← Redis load by ID

components/
├── Header.tsx               ← Sticky header, theme toggle, save/share buttons, progress dots
├── Footer.tsx               ← Static footer with credit line
├── Loading.tsx              ← Spinner, progress bar, rotating tips carousel (4.5s)
├── FlowChart.tsx            ← Click-to-expand task nodes, affiliate + verify links
├── CostBreakdown.tsx        ← Per-LLM breakdown + collapsible Assumption Transparency Card
├── RefinementBox.tsx        ← Textarea + re-analyse + start-over buttons
└── ResultView.tsx           ← 3-tab result (Summary & ROI | Architecture | Step-by-Step)

lib/
├── state.ts                 ← Zustand store, persists to localStorage as 'blueprint_v1'
├── constants.ts             ← PLATDATA, LLMDATA, TIPS, TCOL, AFFILIATE_LINKS, VERIFY_LINKS
├── prompts.ts               ← CLARIFY + SYSPROMPT (with Verification Layer additions)
├── calcCost.ts              ← Pure cost function, per-LLM breakdown
└── api.ts                   ← extractJSON (strips <thinking> blocks), callAPI, typed wrappers

styles/
└── globals.css              ← All CSS variables (light + dark), component classes
```

### Features confirmed in the build
- 3-tab result layout (Summary & ROI, Workflow Architecture, Step-by-Step Guide)
- Confidence score badge (green/amber/red, 1–10 scale) ← Verification Layer
- ↗ Verify pricing buttons on platform + LLM names ← Verification Layer
- Assumption Transparency Card (collapsible under cost) ← Verification Layer
- estimatedTimeSaved pill in hero
- Affiliate links on all platform/LLM names
- Interactive FlowChart with click-to-expand nodes
- 1-click prompt copy buttons (per-step in Guide tab)
- Share/permalink via /result/[id] (SSR from Redis)
- Legacy ?id= URL redirect to /result/[id]
- Theme toggle with no flash on load
- Session persistence via localStorage (Zustand persist, key: blueprint_v1)
- RefinementBox + FAB for refinement
- isUxSuggestion badges
- Per-LLM cost breakdown

---

## What Phase 2 Must Do

### 1. Vercel Configuration (YOU do this, 2 minutes)
**Before the app will work**, change the Vercel framework preset:
- Vercel dashboard → `agentic-flow-designer` → Settings → General → Framework Preset
- Change from **`Other`** to **`Next.js`**
- Save → Vercel will trigger a new build

Then verify these 3 URLs:
- `https://agentic-flow-designer.vercel.app/` → Shows intake form (not a placeholder)
- `https://agentic-flow-designer.vercel.app/api/generate` → Returns `405 Method Not Allowed`
- `https://agentic-flow-designer.vercel.app/api/load?id=fake` → Returns `404 Blueprint not found`

### 2. Playwright Test Updates (Claude does this)
The current test suite (`tests/tests/blueprint.spec.js`) points at the live URL and was written for the `index.html` monolith. Several tests will fail because:

| Old behaviour | New behaviour |
|---|---|
| Single-page app, `screen` state | Multi-page router (`/`, `/questions`, `/result`) |
| `waitForSelector("text=A few more details")` | `waitForURL("**/questions")` |
| `waitForSelector("text=Your blueprint")` | `waitForURL("**/result")` |
| `scrollToRefine()` JS function | `#refinement-section` scroll via FAB click |
| `localStorage.getItem("blueprint_v1")` | Same key — still works |
| `?id=UUID` permalink | `/result/UUID` permalink |

Tests that need URL updates: Suites 4, 6, 7, 8, 12, 13, 14 (navigation-dependent tests).
Tests that should still pass unchanged: Suites 1, 2, 3, 5, 9, 10, 11, 15 (static UI, validation, mobile).

### 3. Known Potential Runtime Issues to Check
- **`useRouter` in Server Components**: `app/result/[id]/page.tsx` is a server component — must NOT import useRouter. Confirmed clean.
- **Zustand hydration flash**: `app/result/page.tsx` has `mounted` guard that returns `null` before hydration. Should prevent flash.
- **Theme flash**: layout.tsx has inline script to set `data-theme` before first paint. Verify on Vercel.
- **`next-env.d.ts`**: Auto-generated by Next.js — must be in .gitignore (it is).

### 4. `.gitignore` Status
The migration added a `.gitignore`. Confirm it has:
```
node_modules/
.next/
.env.local
```

---

## Deferred Features (Phase 3, already in Claude's memory)
1. **Live Pricing Option B** — Vercel cron + Redis cache replacing hardcoded April 2026 rates
2. **Autonomous Agent exec option** — reinstate "🤖 AI handles end-to-end" as 3rd execution preference

---

## Environment Variables (already set in Vercel, no changes needed)
- `GEMINI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

---

## How to Start Phase 2 Chat

Paste this into the next chat window:

> "Continue Blueprint Phase 2. The full Next.js migration is live on main at https://github.com/SpartaAdi/agentic-flow-designer — built by Phase 1. Read PHASE2-HANDOFF.md for the complete context. Phase 2 tasks: (1) update Playwright tests for Next.js routing, (2) fix any runtime issues after Vercel deploy verification. Please clone the repo, read the current test file, and proceed."

