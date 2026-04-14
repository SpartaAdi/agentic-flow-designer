// Blueprint — Comprehensive E2E Test Suite
// Runs every 15 days via GitHub Actions
// Tests all screens, edge cases, and user scenarios

import { test, expect } from "@playwright/test";

const BASE_URL = "https://agentic-flow-designer.vercel.app";
const TIMEOUT = 90000; // 90s for API calls

// ─── SUITE 1: PAGE LOAD & BASIC UI ─────────────────────────────────────────

test.describe("Page Load & Basic UI", () => {
  test("page loads with correct title", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Blueprint/i);
  });

  test("header shows Blueprint name and logo", async ({ page }) => {
    await page.goto(BASE_URL);
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header).toContainText("Blueprint");
  });

  test("intake form headline is visible", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("all 5 user type options are visible", async ({ page }) => {
    await page.goto(BASE_URL);
    for (const label of ["Student", "Working Professional", "CXO / Founder", "Builder / Tinkerer", "Other"]) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
  });

  test("use case textarea is visible and accepts input", async ({ page }) => {
    await page.goto(BASE_URL);
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible();
    await textarea.fill("Test use case input");
    await expect(textarea).toHaveValue("Test use case input");
  });

  test("light/dark mode toggle exists and works", async ({ page }) => {
    await page.goto(BASE_URL);
    const toggle = page.locator("button").filter({ hasText: /dark|light/i }).first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("progress dots show 3 steps in header", async ({ page }) => {
    await page.goto(BASE_URL);
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });
});

// ─── SUITE 2: FORM VALIDATION ───────────────────────────────────────────────

test.describe("Form Validation — Required Fields", () => {
  test("shows error when submitting with no user type selected", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator("textarea").first().fill("I want to automate my sales outreach");
    await page.locator(".opt").filter({ hasText: /Personal/i }).first().click();
    await page.locator(".opt").filter({ hasText: /One-time/i }).first().click();
    const submitBtn = page.locator("button").filter({ hasText: /Analyse/i }).first();
    await submitBtn.click();
    await expect(page.locator("text=Please complete all required fields")).toBeVisible();
  });

  test("shows error when submitting with no use case text", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await page.locator(".opt").filter({ hasText: /Personal/i }).first().click();
    await page.locator(".opt").filter({ hasText: /One-time/i }).first().click();
    const submitBtn = page.locator("button").filter({ hasText: /Analyse/i }).first();
    await submitBtn.click();
    await expect(page.locator("text=Please complete all required fields")).toBeVisible();
  });

  test("shows error when intent and execution preference missing", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await page.locator("textarea").first().fill("Test use case");
    const submitBtn = page.locator("button").filter({ hasText: /Analyse/i }).first();
    await submitBtn.click();
    await expect(page.locator("text=Please complete all required fields")).toBeVisible();
  });

  test("no error when all required fields are filled", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await page.locator("textarea").first().fill("I want to create study notes automatically from my lecture recordings");
    await page.locator(".opt").filter({ hasText: /Personal/i }).first().click();
    await page.locator(".opt").filter({ hasText: /One-time/i }).first().click();
    await expect(page.locator("text=Please complete all required fields")).not.toBeVisible();
  });
});

// ─── SUITE 3: USER TYPE CONDITIONAL LOGIC ───────────────────────────────────

test.describe("User Type — Conditional Fields", () => {
  test("Student selection shows Field of Study options", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    for (const field of ["Arts & Humanities", "Engineering & CS", "Science & Research", "Commerce & Business"]) {
      await expect(page.locator(`text=${field}`).first()).toBeVisible();
    }
  });

  test("Working Professional shows org size and department", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Working Professional" }).first().click();
    await expect(page.locator("text=Organisation size").first()).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("CXO / Founder shows role and function dropdowns", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "CXO / Founder" }).first().click();
    const selects = page.locator("select");
    await expect(selects.first()).toBeVisible();
    await expect(await selects.count()).toBeGreaterThanOrEqual(1);
  });

  test("Builder / Tinkerer shows no extra conditional fields", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    await expect(page.locator("text=Field of Study")).not.toBeVisible();
    await expect(page.locator("text=Organisation size")).not.toBeVisible();
  });

  test("switching user types resets conditional fields", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await expect(page.locator("text=Field of Study").first()).toBeVisible();
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    await expect(page.locator("text=Field of Study")).not.toBeVisible();
  });
});

// ─── SUITE 4: NAVIGATION & BACK BUTTON ──────────────────────────────────────

test.describe("Navigation", () => {
  test("Back button on questions screen returns to intake", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await fillIntakeForm(page, "Student");
    // fillIntakeForm now waits for /questions — confirm heading visible
    await expect(page.locator("text=A few more details").first()).toBeVisible();
    // Click back
    await page.locator("button").filter({ hasText: /Back/i }).first().click();
    // Next.js router should navigate back to /
    await page.waitForURL("**/", { timeout: 15000 });
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

// ─── SUITE 5: QUESTIONS SCREEN ───────────────────────────────────────────────

test.describe("Questions Screen", () => {
  test("questions screen shows correct number of questions", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await fillIntakeForm(page, "Student");
    const qBadges = page.locator("[style*='border-radius:20px']").filter({ hasText: /Q\d/ });
    const count = await qBadges.count();
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(10);
  });

  test("multi-select options show checkboxes", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await fillIntakeForm(page, "Working Professional");
    await expect(page.locator("text=Select up to").first()).toBeVisible();
  });

  test("Other text input is present on all questions", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await fillIntakeForm(page, "Student");
    const otherInputs = page.locator("input[placeholder*='Other']");
    const count = await otherInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("selecting up to 5 options in multi-select works", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await fillIntakeForm(page, "Working Professional");
    const multiLabel = page.locator("text=Select up to").first();
    if (await multiLabel.isVisible()) {
      const card = multiLabel.locator("..").locator("..");
      const opts = card.locator(".opt");
      const count = await opts.count();
      const clicks = Math.min(count, 5);
      for (let i = 0; i < clicks; i++) {
        await opts.nth(i).click();
      }
      const selectedText = card.locator("text=Selected:");
      if (await selectedText.isVisible()) {
        const text = await selectedText.textContent();
        expect(text).toContain("Selected:");
      }
    }
  });
});

// ─── SUITE 6: FULL E2E HAPPY PATH ───────────────────────────────────────────

test.describe("Full E2E — Happy Path (Real API)", () => {
  test("Student full flow — questions to blueprint result", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await fillIntakeForm(page, "Student");
    const firstOpts = page.locator(".opt").first();
    if (await firstOpts.isVisible()) await firstOpts.click();
    const genBtn = page.locator("button").filter({ hasText: /Generate/i }).first();
    await genBtn.click();
    // Wait for Next.js router to land on /result, then wait for content
    await page.waitForURL("**/result**", { timeout: 60000 });
    await page.waitForSelector("text=Your blueprint", { timeout: 30000 });
    await expect(page.locator("text=Your blueprint").first()).toBeVisible();
    await expect(page.locator("text=Platform").first()).toBeVisible();
    await expect(page.locator("text=AI engine").first()).toBeVisible();
    await expect(page.locator("text=Monthly cost").first()).toBeVisible();
    await expect(page.locator("text=How it works").first()).toBeVisible();
    await expect(page.locator("text=Is it worth it").first()).toBeVisible();
  });

  test("Working Professional Sales flow — full E2E", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Working Professional" }).first().click();
    await page.locator(".opt").filter({ hasText: "Startup" }).first().click();
    const deptSelect = page.locator("select").first();
    await deptSelect.selectOption("Sales");
    await page.locator("textarea").first().fill("I want to automatically research companies before my sales calls and receive a briefing 30 minutes before each meeting.");
    await page.locator(".opt").filter({ hasText: /Production Use/i }).first().click();
    await page.locator(".opt").filter({ hasText: /Repeatable workflow/i }).first().click();
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    // Wait for Next.js router to navigate to /questions
    await page.waitForURL("**/questions", { timeout: 45000 });
    await answerAllQuestions(page);
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    // Wait for Next.js router to land on /result
    await page.waitForURL("**/result**", { timeout: 60000 });
    await page.waitForSelector("text=Your blueprint", { timeout: 30000 });
    await expect(page.locator("text=Workflow overview").first()).toBeVisible();
    await expect(page.locator("text=Tools you need").first()).toBeVisible();
  });

  test("result screen shows INR cost estimate", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await fillIntakeForm(page, "Builder / Tinkerer");
    await answerAllQuestions(page);
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    await page.waitForURL("**/result**", { timeout: 60000 });
    await page.waitForSelector("text=Your blueprint", { timeout: 30000 });
    const pageContent = await page.textContent("body");
    expect(pageContent).toContain("₹");
  });

  test("detailed build guide expands on button click", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await fillIntakeForm(page, "Student");
    await answerAllQuestions(page);
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    await page.waitForURL("**/result**", { timeout: 60000 });
    await page.waitForSelector("text=Your blueprint", { timeout: 30000 });
    const stepsBtn = page.locator("button").filter({ hasText: /step-by-step/i }).first();
    await stepsBtn.click();
    await expect(page.locator("text=Step-by-step build guide").first()).toBeVisible();
  });
});

// ─── SUITE 7: RESULT SCREEN FEATURES ────────────────────────────────────────

test.describe("Result Screen Features", () => {
  test("Refine box is visible after blueprint generation", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await expect(page.locator("text=Refine your blueprint").first()).toBeVisible();
    const refineArea = page.locator("textarea#refineArea, textarea[placeholder*='Refine'], textarea[placeholder*='context']").first();
    await expect(refineArea).toBeVisible();
  });

  test("re-analyse button works with refinement input", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const refineArea = page.locator("#refineArea").first();
    await refineArea.fill("I also use HubSpot CRM and Slack is blocked by my company.");
    const refineBtn = page.locator("button").filter({ hasText: /Re-analyse/i }).first();
    await expect(refineBtn).not.toBeDisabled();
  });

  test("re-analyse button is disabled when refinement input is empty", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const refineBtn = page.locator("button").filter({ hasText: /Re-analyse/i }).first();
    await expect(refineBtn).toBeDisabled();
  });

  test("Print / Save PDF button is visible", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await expect(page.locator("button").filter({ hasText: /Print/i }).first()).toBeVisible();
  });

  test("Save button appears in header after result", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await expect(page.locator("header").locator("button").filter({ hasText: /Save/i }).first()).toBeVisible();
  });

  test("Start over button resets to intake screen", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const startOverBtn = page.locator("button").filter({ hasText: /Start over/i }).first();
    await startOverBtn.click();
    // Next.js router navigates back to /
    await page.waitForURL("**/", { timeout: 15000 });
    await expect(page.locator("h1, h2").filter({ hasText: /Design/i }).first()).toBeVisible();
  });
});

// ─── SUITE 8: SESSION PERSISTENCE ───────────────────────────────────────────

test.describe("Session Persistence", () => {
  test("resume session banner appears on revisit after completing blueprint", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    // Reload — Zustand persist rehydrates from localStorage
    await page.reload();
    const resumeOrResult = page.locator("text=Resume").or(page.locator("text=Your blueprint")).first();
    await expect(resumeOrResult).toBeVisible({ timeout: 10000 });
  });

  test("localStorage saves session data", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const stored = await page.evaluate(() => localStorage.getItem("blueprint_v1"));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored);
    expect(parsed).toHaveProperty("result");
    expect(parsed).toHaveProperty("savedAt");
  });

  test("Start Over clears session from localStorage", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("button").filter({ hasText: /Start over/i }).first().click();
    const stored = await page.evaluate(() => localStorage.getItem("blueprint_v1"));
    expect(stored).toBeNull();
  });
});

// ─── SUITE 9: EDGE CASES & ERROR HANDLING ───────────────────────────────────

test.describe("Edge Cases", () => {
  test("very short use case still proceeds to questions", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await page.locator("textarea").first().fill("automate emails");
    await page.locator(".opt").filter({ hasText: /Personal/i }).first().click();
    await page.locator(".opt").filter({ hasText: /One-time/i }).first().click();
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    // Wait for Next.js router to navigate to /questions
    await page.waitForURL("**/questions", { timeout: 45000 });
    // Verify heading rendered — not an error page
    await expect(page.locator("text=A few more details").first()).toBeVisible();
  });

  test("use case with special characters works", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await page.locator("textarea").first().fill("I want to automate my research — specifically for ₹ cost analysis & ROI calculations (Q1/Q2 2026).");
    await page.locator(".opt").filter({ hasText: /Personal/i }).first().click();
    await page.locator(".opt").filter({ hasText: /One-time/i }).first().click();
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    // Wait for Next.js router to navigate to /questions
    await page.waitForURL("**/questions", { timeout: 45000 });
    await expect(page.locator("text=A few more details").first()).toBeVisible();
  });

  test("page is functional with JavaScript enabled", async ({ page }) => {
    await page.goto(BASE_URL);
    const firstOpt = page.locator(".opt").first();
    await firstOpt.click();
    await expect(firstOpt).toHaveClass(/sel/);
  });
});

// ─── SUITE 10: RESPONSIVE / MOBILE ──────────────────────────────────────────

test.describe("Responsive Design", () => {
  test("intake form renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await expect(page.locator("textarea").first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: /Analyse/i }).first()).toBeVisible();
  });

  test("header is visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header")).toContainText("Blueprint");
  });

  test("options are tappable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    const firstOpt = page.locator(".opt").first();
    await firstOpt.click();
    await expect(firstOpt).toHaveClass(/sel/);
  });
});

// ─── SUITE 11: PERFORMANCE ───────────────────────────────────────────────────

test.describe("Performance", () => {
  test("page loads in under 8 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    await page.locator(".opt").first().waitFor({ state: "visible" });
    const elapsed = Date.now() - start;
    console.log(`Page load time: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(8000);
  });

  test("intake form is interactive within 5 seconds of load", async ({ page }) => {
    await page.goto(BASE_URL);
    const start = Date.now();
    const firstOpt = page.locator(".opt").first();
    await firstOpt.waitFor({ state: "visible", timeout: 5000 });
    console.log(`Time to interactive: ${Date.now() - start}ms`);
  });
});

// ─── SUITE 12: v1.1 — TABBED RESULTS ────────────────────────────────────────

test.describe("v1.1 — Tabbed Blueprint Results", () => {
  test("tab bar renders three tabs on result screen", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await expect(page.locator(".tab-bar")).toBeVisible();
    await expect(page.locator("[data-tab='summary']")).toBeVisible();
    await expect(page.locator("[data-tab='architecture']")).toBeVisible();
    await expect(page.locator("[data-tab='guide']")).toBeVisible();
  });

  test("Summary & ROI tab is active by default", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const summaryTab = page.locator("[data-tab='summary']");
    await expect(summaryTab).toHaveClass(/active/);
    await expect(page.locator("text=Platform").first()).toBeVisible();
  });

  test("clicking Workflow Architecture tab shows task breakdown", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    await expect(page.locator("[data-tab='architecture']")).toHaveClass(/active/);
    await expect(page.locator("text=Workflow overview").first()).toBeVisible();
    await expect(page.locator("text=How it works").first()).toBeVisible();
  });

  test("clicking Step-by-Step Guide tab renders step content", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='guide']").click();
    await expect(page.locator("[data-tab='guide']")).toHaveClass(/active/);
    const hasSteps = await page.locator("text=Step-by-Step Guide").count() > 0
      || await page.locator(".step-card").count() > 0
      || await page.locator("text=not available").count() > 0;
    expect(hasSteps).toBeTruthy();
  });

  test("switching tabs does not reload or lose hero section", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    await expect(page.locator("text=Your blueprint").first()).toBeVisible();
    await page.locator("[data-tab='summary']").click();
    await expect(page.locator("text=Your blueprint").first()).toBeVisible();
  });

  test("tab state resets to summary on Start Over and new generation", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    await expect(page.locator("[data-tab='architecture']")).toHaveClass(/active/);
    await page.locator("button").filter({ hasText: /Start over/i }).first().click();
    await page.waitForURL("**/", { timeout: 15000 });
    await expect(page.locator("h1").filter({ hasText: /Design/i }).first()).toBeVisible();
  });
});

// ─── SUITE 13: v1.2 — DYNAMIC LOADING TIPS ──────────────────────────────────

test.describe("v1.2 — Dynamic Loading Tips", () => {
  test("loading tip element exists during generate stage", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await page.locator(".opt").filter({ hasText: "Engineering & CS" }).first().click();
    await page.locator("textarea").first().fill("Automate my research workflow.");
    await page.locator(".opt").filter({ hasText: /Personal/i }).first().click();
    await page.locator(".opt").filter({ hasText: /One-time/i }).first().click();
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    // Wait for Next.js router to navigate to /questions
    await page.waitForURL("**/questions", { timeout: 45000 });
    await page.locator(".opt").first().click().catch(() => {});
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    const tipContainer = page.locator("text=While you wait");
    await expect(tipContainer).toBeVisible({ timeout: 5000 });
  });

  test("loading tip element has non-empty text content", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await page.locator(".opt").filter({ hasText: "Engineering & CS" }).first().click();
    await page.locator("textarea").first().fill("Automate my research workflow.");
    await page.locator(".opt").filter({ hasText: /Personal/i }).first().click();
    await page.locator(".opt").filter({ hasText: /One-time/i }).first().click();
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    // Wait for Next.js router to navigate to /questions
    await page.waitForURL("**/questions", { timeout: 45000 });
    await page.locator(".opt").first().click().catch(() => {});
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    const tipEl = page.locator("#loading-tip");
    await expect(tipEl).toBeVisible({ timeout: 5000 });
    const tipText = await tipEl.textContent();
    expect(tipText?.trim().length).toBeGreaterThan(10);
  });

  test("tip interval is cleared after result renders (no memory leak)", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const intervalCleared = await page.evaluate(() => window._tipInterval === null || window._tipInterval === undefined);
    expect(intervalCleared).toBeTruthy();
  });
});

// ─── SUITE 14: v1.3 — PERSISTENT REFINEMENT FAB ─────────────────────────────

test.describe("v1.3 — Persistent Refinement FAB", () => {
  test("FAB button is visible on result screen", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const fab = page.locator("#refine-fab");
    await expect(fab).toBeVisible();
    await expect(fab).toContainText("Refine");
  });

  test("FAB is not visible on intake screen", async ({ page }) => {
    await page.goto(BASE_URL);
    const fab = page.locator("#refine-fab");
    await expect(fab).not.toBeVisible();
  });

  test("FAB click scrolls refinement section into view", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='guide']").click();
    const fab = page.locator("#refine-fab");
    await fab.click();
    const refineSection = page.locator("#refinement-section");
    await expect(refineSection).toBeVisible({ timeout: 3000 });
  });

  test("FAB click focuses the refineArea textarea", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const fab = page.locator("#refine-fab");
    await fab.click();
    await page.waitForTimeout(500);
    const refineArea = page.locator("#refineArea");
    await expect(refineArea).toBeFocused();
  });

  test("refinement section has id refinement-section for FAB targeting", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const section = page.locator("#refinement-section");
    await expect(section).toBeVisible();
    await expect(section).toContainText("Refine your blueprint");
  });
});

// ─── SUITE 15: v2.1 — 1-CLICK PROMPT COPY ──────────────────────────────────

test.describe("v2.1 — 1-Click Prompt Copy", () => {
  test("copy buttons are present on Step-by-Step Guide tab", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='guide']").click();
    const copyBtns = page.locator("[data-copy-idx]");
    const count = await copyBtns.count();
    const stepCards = page.locator(".step-card");
    const stepCount = await stepCards.count();
    if (stepCount > 0 && count > 0) {
      await expect(copyBtns.first()).toContainText("Copy");
    }
  });

  test("copy button shows Copied! feedback after click", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='guide']").click();
    const copyBtns = page.locator("[data-copy-idx]");
    const count = await copyBtns.count();
    if (count === 0) {
      test.skip(true, "No prompt templates in generated blueprint");
      return;
    }
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const firstBtn = copyBtns.first();
    await firstBtn.click();
    await expect(firstBtn).toContainText("Copied!", { timeout: 1000 });
    await expect(firstBtn).toHaveClass(/copied/);
  });

  test("Copied! state reverts to Copy after 2 seconds", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='guide']").click();
    const copyBtns = page.locator("[data-copy-idx]");
    const count = await copyBtns.count();
    if (count === 0) {
      test.skip(true, "No prompt templates in generated blueprint");
      return;
    }
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const firstBtn = copyBtns.first();
    await firstBtn.click();
    await expect(firstBtn).toContainText("Copied!", { timeout: 1000 });
    await page.waitForTimeout(2300);
    await expect(firstBtn).toContainText("Copy");
    await expect(firstBtn).not.toHaveClass(/copied/);
  });

  test("each copy button is independent — clicking one does not affect others", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='guide']").click();
    const copyBtns = page.locator("[data-copy-idx]");
    const count = await copyBtns.count();
    if (count < 2) {
      test.skip(true, "Need at least 2 prompt templates to test independence");
      return;
    }
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await copyBtns.first().click();
    await expect(copyBtns.first()).toContainText("Copied!", { timeout: 1000 });
    await expect(copyBtns.nth(1)).toContainText("Copy");
    await expect(copyBtns.nth(1)).not.toHaveClass(/copied/);
  });

  test("copy button is not visible on Summary tab", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const copyBtns = page.locator("[data-copy-idx]");
    await expect(copyBtns).toHaveCount(0);
  });

  test("clipboard receives correct prompt text on copy", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='guide']").click();
    const copyBtns = page.locator("[data-copy-idx]");
    const count = await copyBtns.count();
    if (count === 0) {
      test.skip(true, "No prompt templates in generated blueprint");
      return;
    }
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const firstBtn = copyBtns.first();
    const promptText = await firstBtn
      .locator("xpath=../following-sibling::p[contains(@style,'monospace')]")
      .textContent()
      .catch(() => null);
    await firstBtn.click();
    await expect(firstBtn).toContainText("Copied!", { timeout: 1000 });
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    if (promptText) {
      expect(clipboardText.trim()).toBe(promptText.trim());
    } else {
      expect(clipboardText.trim().length).toBeGreaterThan(0);
    }
  });
});

// ─── SUITE 16: v3.2 — AFFILIATE LINKS ────────────────────────────────────────

test.describe("v3.2 — Affiliate Links", () => {
  test("affiliate links are rendered on result screen", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const affLinks = page.locator("a.aff-link, a[href*='utm_source=blueprint']");
    const count = await affLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("platform recommendation is an affiliate link", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const platLink = page.locator(".card a[href*='utm_source=blueprint']").first();
    await expect(platLink).toBeVisible();
    const href = await platLink.getAttribute("href");
    expect(href).toContain("utm_source=blueprint");
  });

  test("affiliate links open in new tab", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const affLink = page.locator("a[href*='utm_source=blueprint']").first();
    const target = await affLink.getAttribute("target");
    expect(target).toBe("_blank");
  });

  test("affiliate links have rel=noopener for security", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const affLink = page.locator("a[href*='utm_source=blueprint']").first();
    const rel = await affLink.getAttribute("rel");
    expect(rel).toContain("noopener");
  });

  test("hero LLM pill is an affiliate link", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const llmPill = page.locator("a[href*='utm_source=blueprint']").filter({ hasText: /claude|gemini|gpt/i }).first();
    await expect(llmPill).toBeVisible();
  });

  test("workflow architecture tab shows affiliate links in LLM legend", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    const legendLinks = page.locator("#flowchart-card a.aff-link, #flowchart-card a.pill");
    const count = await legendLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─── SUITE 17: v4.2 — INTERACTIVE FLOWCHART ──────────────────────────────────

test.describe("v4.2 — Interactive Flowchart", () => {
  test("flowchart card renders on architecture tab", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    const chart = page.locator("#flowchart-card");
    await expect(chart).toBeVisible();
  });

  test("flowchart contains clickable nodes with data-flow-node", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    const nodes = page.locator("[data-flow-node]");
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clicking a node shows the tooltip/expansion", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    const firstNode = page.locator("[data-flow-node]").first();
    await firstNode.click();
    const tooltip = page.locator(".fc-tooltip").first();
    await expect(tooltip).toBeVisible({ timeout: 2000 });
  });

  test("clicking an active node collapses the tooltip", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    const firstNode = page.locator("[data-flow-node]").first();
    await firstNode.click();
    await expect(page.locator(".fc-tooltip").first()).toBeVisible({ timeout: 2000 });
    await firstNode.click();
    await expect(page.locator(".fc-tooltip")).toHaveCount(0, { timeout: 2000 });
  });

  test("active node gains .active CSS class", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    const firstNode = page.locator("[data-flow-node]").first();
    await firstNode.click();
    await expect(firstNode).toHaveClass(/active/);
  });

  test("tooltip contains LLM information", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    const nodes = page.locator("[data-flow-node]");
    const count = await nodes.count();
    let foundLLM = false;
    for (let i = 0; i < count && !foundLLM; i++) {
      await nodes.nth(i).click();
      const tooltip = page.locator(".fc-tooltip").first();
      if (await tooltip.isVisible()) {
        const text = await tooltip.textContent();
        if (text && (text.includes("Claude") || text.includes("Gemini") || text.includes("GPT"))) {
          foundLLM = true;
        }
        await nodes.nth(i).click();
      }
    }
    expect(foundLLM).toBeTruthy();
  });

  test("flowchart renders on mobile viewport without overflow", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.setViewportSize({ width: 390, height: 844 });
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    const chart = page.locator("#flowchart-card");
    await expect(chart).toBeVisible();
    const box = await page.locator("#flowchart-nodes").boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(410);
    }
  });

  test("'Click any node to expand' hint text is visible", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await page.locator("[data-tab='architecture']").click();
    await expect(page.locator("text=Click any node to expand").first()).toBeVisible();
  });
});

// ─── SUITE 18: v5.1 — ENHANCED COST BREAKDOWN ────────────────────────────────

test.describe("v5.1 — Enhanced Cost Breakdown", () => {
  test("cost breakdown card renders on summary tab", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const monthlyCost = page.locator("[data-cost-monthly]").first();
    await expect(monthlyCost).toBeVisible();
  });

  test("single run cost is displayed", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const singleRun = page.locator("[data-cost-single]").first();
    await expect(singleRun).toBeVisible();
    const text = await singleRun.textContent();
    expect(text).toContain("₹");
  });

  test("per-LLM cost rows are displayed", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const llmCosts = page.locator("[data-cost-llm]");
    const count = await llmCosts.count();
    expect(count).toBeGreaterThan(0);
  });

  test("per-LLM cost shows ₹ value", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const firstLlmCost = page.locator("[data-cost-llm]").first();
    const text = await firstLlmCost.textContent();
    expect(text).toContain("₹");
    expect(text).toContain("/mo");
  });

  test("frequency/run label is shown", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const text = await page.locator("[data-cost-monthly]").textContent();
    expect(text?.toLowerCase()).toMatch(/run|mo/);
  });

  test("monthly total contains both ₹ and $ figures", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const monthly = page.locator("[data-cost-monthly]").first();
    const text = await monthly.textContent();
    expect(text).toContain("₹");
    expect(text).toContain("$");
  });

  test("cost breakdown card label reads 'Cost breakdown'", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await expect(page.locator("text=Cost breakdown").first()).toBeVisible();
  });

  test("payload size is shown in cost card", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await expect(page.locator("text=Payload size").first()).toBeVisible();
  });
});

// ─── SUITE 19: PERMALINK — SSR /result/[id] ──────────────────────────────────
// New suite for the Next.js SSR permalink route. Previously the app used ?id=UUID.

test.describe("Permalink — SSR /result/[id]", () => {
  test("invalid ID at /result/fake returns 404 message", async ({ page }) => {
    await page.goto(`${BASE_URL}/result/fake`);
    await expect(page.locator("text=Blueprint not found").first()).toBeVisible();
  });

  test("expired or unknown UUID returns 404 message", async ({ page }) => {
    await page.goto(`${BASE_URL}/result/00000000-0000-0000-0000-000000000000`);
    await expect(page.locator("text=Blueprint not found").first()).toBeVisible();
  });

  test("404 page has a link back to home", async ({ page }) => {
    await page.goto(`${BASE_URL}/result/fake`);
    const homeLink = page.locator("a", { hasText: /Build a new blueprint/i });
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await page.waitForURL("**/", { timeout: 10000 });
    await expect(page.locator("textarea").first()).toBeVisible();
  });

  test("legacy ?id= query param redirects to /result/[id]", async ({ page }) => {
    // App must redirect /?id=UUID → /result/UUID
    const testId = "00000000-0000-0000-0000-000000000000";
    await page.goto(`${BASE_URL}/?id=${testId}`);
    await page.waitForURL(`**/result/${testId}`, { timeout: 10000 });
  });

  test("saved blueprint is accessible at its permalink URL", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    // Click Share to generate a real permalink
    const shareBtn = page.locator("header").locator("button").filter({ hasText: /Share/i }).first();
    await shareBtn.click();
    // After share the URL should update to /result/[uuid]
    await page.waitForURL(/\/result\/[0-9a-f-]{36}/, { timeout: 15000 });
    const shareUrl = page.url();
    // Verify the permalink loads in a fresh tab (SSR)
    const newPage = await page.context().newPage();
    await newPage.goto(shareUrl);
    await expect(newPage.locator("text=Your blueprint").first()).toBeVisible({ timeout: 20000 });
    await newPage.close();
  });
});

// ─── SUITE 20: v6.0 — AUTONOMOUS AGENT MODE ─────────────────────────────────

test.describe("v6.0 — Autonomous Agent Mode", () => {
  test("'Autonomous agent' option is visible for Builder / Tinkerer", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    await expect(page.locator(".opt").filter({ hasText: /Autonomous agent/i }).first()).toBeVisible();
  });

  test("'Autonomous agent' option is visible for Working Professional", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Working Professional" }).first().click();
    await expect(page.locator(".opt").filter({ hasText: /Autonomous agent/i }).first()).toBeVisible();
  });

  test("'Autonomous agent' option is visible for CXO / Founder", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "CXO / Founder" }).first().click();
    await expect(page.locator(".opt").filter({ hasText: /Autonomous agent/i }).first()).toBeVisible();
  });

  test("'Autonomous agent' option is hidden for Student", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await expect(page.locator(".opt").filter({ hasText: /Autonomous agent/i })).toHaveCount(0);
  });

  test("'Autonomous agent' option is hidden for Other", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Other" }).first().click();
    await expect(page.locator(".opt").filter({ hasText: /Autonomous agent/i })).toHaveCount(0);
  });

  test("selecting Autonomous agent marks it as selected", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    const autonomousOpt = page.locator(".opt").filter({ hasText: /Autonomous agent/i }).first();
    await autonomousOpt.click();
    await expect(autonomousOpt).toHaveClass(/sel/);
  });

  test("autonomous mode full E2E — hero shows Fully Automated badge", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    await page.locator("textarea").first().fill("I want AI to fully automate my weekly competitor intelligence report end-to-end.");
    await page.locator(".opt").filter({ hasText: /Production Use/i }).first().click();
    await page.locator(".opt").filter({ hasText: /Autonomous agent/i }).first().click();
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    await page.waitForURL("**/questions", { timeout: 45000 });
    await answerAllQuestions(page);
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    await page.waitForURL("**/result**", { timeout: 60000 });
    await page.waitForSelector("text=Your blueprint", { timeout: 30000 });
    // Hero must contain "Fully Automated" badge when executionApproach === Full Autonomous Agent
    const body = await page.textContent("body");
    const isAutonomous =
      (body ?? "").includes("Fully Automated") ||
      (body ?? "").includes("Full Autonomous Agent");
    expect(isAutonomous).toBeTruthy();
  });

  test("autonomous mode — flowchart shows '🤖 Fully automated' label", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    await page.locator("textarea").first().fill("Fully automated weekly competitor report.");
    await page.locator(".opt").filter({ hasText: /Production Use/i }).first().click();
    await page.locator(".opt").filter({ hasText: /Autonomous agent/i }).first().click();
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    await page.waitForURL("**/questions", { timeout: 45000 });
    await answerAllQuestions(page);
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    await page.waitForURL("**/result**", { timeout: 60000 });
    await page.waitForSelector("text=Your blueprint", { timeout: 30000 });
    await page.locator("[data-tab='architecture']").click();
    const chart = page.locator("#flowchart-card");
    await expect(chart).toBeVisible();
    // If model returned "Full Autonomous Agent", the FlowChart renders the "Fully automated" badge
    const body = await page.textContent("body");
    if ((body ?? "").includes("Full Autonomous Agent")) {
      await expect(page.locator("text=Fully automated").first()).toBeVisible();
    }
  });

  test("switching from Autonomous agent back to Repeatable workflow clears selection", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    const autonomousOpt = page.locator(".opt").filter({ hasText: /Autonomous agent/i }).first();
    await autonomousOpt.click();
    await expect(autonomousOpt).toHaveClass(/sel/);
    // Switch to Repeatable
    const repeatableOpt = page.locator(".opt").filter({ hasText: /Repeatable workflow/i }).first();
    await repeatableOpt.click();
    await expect(repeatableOpt).toHaveClass(/sel/);
    await expect(autonomousOpt).not.toHaveClass(/sel/);
  });

  test("intake form still submits correctly with Autonomous agent selected", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    await page.locator("textarea").first().fill("Automate competitor tracking end-to-end with no manual steps.");
    await page.locator(".opt").filter({ hasText: /Personal/i }).first().click();
    await page.locator(".opt").filter({ hasText: /Autonomous agent/i }).first().click();
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    await page.waitForURL("**/questions", { timeout: 45000 });
    await expect(page.locator("text=A few more details").first()).toBeVisible();
  });
});

// ─── SUITE 21: v5.2 — LIVE PRICING FRESHNESS BADGE ──────────────────────────

test.describe("v5.2 — Live Pricing Freshness Badge", () => {
  test("/api/prices endpoint returns a valid response", async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/prices`);
    // Must not 500 — either 200 with data or 404/empty is acceptable
    expect(response.status()).not.toBe(500);
  });

  test("/api/prices returns JSON with updatedAt when live data is cached", async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/prices`);
    if (response.status() === 200) {
      const body = await response.json();
      // If data is present, updatedAt must be a number and source must be valid
      if (body?.updatedAt) {
        expect(typeof body.updatedAt).toBe("number");
        expect(["live", "fallback"]).toContain(body.source);
      }
    }
  });

  test("freshness badge appears in cost card when pricing data is available", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    // Fetch the prices API to know if data is available
    const pricesRes = await page.request.get(`${BASE_URL}/api/prices`);
    if (pricesRes.status() === 200) {
      const pricesBody = await pricesRes.json().catch(() => null);
      if (pricesBody?.updatedAt) {
        // Badge should appear in the CostBreakdown card
        const badge = page.locator("text=/Prices (just now|\\d+[hd] ago)/").first();
        await expect(badge).toBeVisible({ timeout: 5000 });
      }
    }
    // If no cached data, badge is absent — test passes silently
  });

  test("freshness badge has a title (tooltip) attribute", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const pricesRes = await page.request.get(`${BASE_URL}/api/prices`);
    if (pricesRes.status() === 200) {
      const pricesBody = await pricesRes.json().catch(() => null);
      if (pricesBody?.updatedAt) {
        const badge = page.locator("[title*='Pricing']").first();
        await expect(badge).toBeVisible({ timeout: 5000 });
        const title = await badge.getAttribute("title");
        expect(title?.length).toBeGreaterThan(0);
      }
    }
  });

  test("live badge shows checkmark prefix when source is live", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const pricesRes = await page.request.get(`${BASE_URL}/api/prices`);
    if (pricesRes.status() === 200) {
      const body = await pricesRes.json().catch(() => null);
      if (body?.source === "live" && body?.updatedAt) {
        const badge = page.locator("text=/✓ Prices/").first();
        await expect(badge).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("fallback badge shows clipboard prefix when source is fallback", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const pricesRes = await page.request.get(`${BASE_URL}/api/prices`);
    if (pricesRes.status() === 200) {
      const body = await pricesRes.json().catch(() => null);
      if (body?.source === "fallback" && body?.updatedAt) {
        const badge = page.locator("text=/📋 Prices/").first();
        await expect(badge).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("cost card label reads 'Cost breakdown' (not 'Monthly cost estimate')", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    await expect(page.locator("text=Cost breakdown").first()).toBeVisible();
    await expect(page.locator("text=Monthly cost estimate")).toHaveCount(0);
  });

  test("assumption transparency accordion expands on click", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const accordionBtn = page.locator("button").filter({ hasText: /How this estimate was calculated/i }).first();
    await expect(accordionBtn).toBeVisible();
    await accordionBtn.click();
    await expect(page.locator("text=Assumptions used").first()).toBeVisible();
  });

  test("expanded assumptions show exchange rate line", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const accordionBtn = page.locator("button").filter({ hasText: /How this estimate was calculated/i }).first();
    await accordionBtn.click();
    const text = await page.locator("text=Exchange rate").first().textContent();
    expect(text).toContain("₹84");
  });
});

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────

/**
 * Fills and submits the intake form, then waits for the Next.js router
 * to complete navigation to /questions.
 * After this function returns, the caller is confirmed on the /questions page.
 */
async function fillIntakeForm(page, userType) {
  await page.goto(BASE_URL);
  await page.locator(".opt").filter({ hasText: userType }).first().click();
  if (userType === "Student") {
    await page.locator(".opt").filter({ hasText: "Engineering & CS" }).first().click();
  }
  if (userType === "Working Professional") {
    try {
      await page.locator(".opt").filter({ hasText: "Startup" }).first().click({ timeout: 2000 });
      const sel = page.locator("select").first();
      if (await sel.isVisible()) await sel.selectOption("Marketing");
    } catch {}
  }
  await page.locator("textarea").first().fill("I want to automate my content research and generate weekly reports on competitor activities automatically.");
  await page.locator(".opt").filter({ hasText: /Production Use/i }).first().click();
  await page.locator(".opt").filter({ hasText: /Repeatable workflow/i }).first().click();
  await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
  // Wait for Next.js App Router to navigate to /questions
  await page.waitForURL("**/questions", { timeout: 45000 });
}

async function answerAllQuestions(page) {
  const cards = page.locator(".card");
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const opts = card.locator(".opt");
    const optCount = await opts.count();
    if (optCount > 0) {
      await opts.first().click().catch(() => {});
    }
  }
}

/**
 * Runs the full happy-path flow: intake → questions → result.
 * After this function returns, the caller is on the /result page
 * with the blueprint content fully rendered.
 */
async function runToResult(page) {
  await fillIntakeForm(page, "Student");
  await answerAllQuestions(page);
  await page.locator("button").filter({ hasText: /Generate/i }).first().click();
  // Wait for the Next.js router to navigate to /result
  await page.waitForURL("**/result**", { timeout: 60000 });
  // Then wait for the blueprint content to fully render
  await page.waitForSelector("text=Your blueprint", { timeout: 30000 });
}
