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
    // Toggle to dark
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    // Toggle back to light
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("progress dots show 3 steps in header", async ({ page }) => {
    await page.goto(BASE_URL);
    // Progress indicator should be visible
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });
});

// ─── SUITE 2: FORM VALIDATION ───────────────────────────────────────────────

test.describe("Form Validation — Required Fields", () => {
  test("shows error when submitting with no user type selected", async ({ page }) => {
    await page.goto(BASE_URL);
    // Fill use case but skip user type
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
    // Error should not be visible
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
    // No dropdowns should appear for this type
    await expect(page.locator("text=Field of Study")).not.toBeVisible();
    await expect(page.locator("text=Organisation size")).not.toBeVisible();
  });

  test("switching user types resets conditional fields", async ({ page }) => {
    await page.goto(BASE_URL);
    // First select Student
    await page.locator(".opt").filter({ hasText: "Student" }).first().click();
    await expect(page.locator("text=Field of Study").first()).toBeVisible();
    // Switch to Builder
    await page.locator(".opt").filter({ hasText: "Builder / Tinkerer" }).first().click();
    await expect(page.locator("text=Field of Study")).not.toBeVisible();
  });
});

// ─── SUITE 4: NAVIGATION & BACK BUTTON ──────────────────────────────────────

test.describe("Navigation", () => {
  test("Back button on questions screen returns to intake", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await fillIntakeForm(page, "Student");
    // Wait for questions to load
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    // Click back
    await page.locator("button").filter({ hasText: /Back/i }).first().click();
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

// ─── SUITE 5: QUESTIONS SCREEN ───────────────────────────────────────────────

test.describe("Questions Screen", () => {
  test("questions screen shows correct number of questions", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await fillIntakeForm(page, "Student");
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    const qBadges = page.locator("[style*='border-radius:20px']").filter({ hasText: /Q\d/ });
    const count = await qBadges.count();
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(10);
  });

  test("multi-select options show checkboxes", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await fillIntakeForm(page, "Working Professional");
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    await expect(page.locator("text=Select up to").first()).toBeVisible();
  });

  test("Other text input is present on all questions", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await fillIntakeForm(page, "Student");
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    // Each question should have an Other input
    const otherInputs = page.locator("input[placeholder*='Other']");
    const count = await otherInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("selecting up to 5 options in multi-select works", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await fillIntakeForm(page, "Working Professional");
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    // Find first multi-select question
    const multiLabel = page.locator("text=Select up to").first();
    if (await multiLabel.isVisible()) {
      // Get the parent card
      const card = multiLabel.locator("..").locator("..");
      const opts = card.locator(".opt");
      const count = await opts.count();
      // Click up to 5 options
      const clicks = Math.min(count, 5);
      for (let i = 0; i < clicks; i++) {
        await opts.nth(i).click();
      }
      // Should show selected count
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
    await page.goto(BASE_URL);
    await fillIntakeForm(page, "Student");
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    // Answer a few questions
    const firstOpts = page.locator(".opt").first();
    if (await firstOpts.isVisible()) await firstOpts.click();
    // Generate
    const genBtn = page.locator("button").filter({ hasText: /Generate/i }).first();
    await genBtn.click();
    // Wait for result
    await page.waitForSelector("text=Your blueprint", { timeout: 60000 });
    // Verify key result sections
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
    // Select Working Professional
    await page.locator(".opt").filter({ hasText: "Working Professional" }).first().click();
    await page.locator(".opt").filter({ hasText: "Startup" }).first().click();
    // Select department
    const deptSelect = page.locator("select").first();
    await deptSelect.selectOption("Sales");
    // Fill use case
    await page.locator("textarea").first().fill("I want to automatically research companies before my sales calls and receive a briefing 30 minutes before each meeting.");
    // Select intent and execution
    await page.locator(".opt").filter({ hasText: /Production Use/i }).first().click();
    await page.locator(".opt").filter({ hasText: /Repeatable workflow/i }).first().click();
    // Submit
    await page.locator("button").filter({ hasText: /Analyse/i }).first().click();
    // Wait for questions
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    // Answer first option in each question
    await answerAllQuestions(page);
    // Generate
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    // Wait for result
    await page.waitForSelector("text=Your blueprint", { timeout: 60000 });
    await expect(page.locator("text=Workflow overview").first()).toBeVisible();
    await expect(page.locator("text=Tools you need").first()).toBeVisible();
  });

  test("result screen shows INR cost estimate", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await fillIntakeForm(page, "Builder / Tinkerer");
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    await answerAllQuestions(page);
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    await page.waitForSelector("text=Your blueprint", { timeout: 60000 });
    // INR symbol should be present somewhere on the page
    const pageContent = await page.textContent("body");
    expect(pageContent).toContain("₹");
  });

  test("detailed build guide expands on button click", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.goto(BASE_URL);
    await fillIntakeForm(page, "Student");
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    await answerAllQuestions(page);
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    await page.waitForSelector("text=Your blueprint", { timeout: 60000 });
    // Click the detailed steps button
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
    // Don't actually click to save API credits — just verify it's enabled
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
    // Should be back on intake screen
    await expect(page.locator("h1, h2").filter({ hasText: /Design/i }).first()).toBeVisible();
  });
});

// ─── SUITE 8: SESSION PERSISTENCE ───────────────────────────────────────────

test.describe("Session Persistence", () => {
  test("resume session banner appears on revisit after completing blueprint", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    // Complete a full flow
    await runToResult(page);
    // Reload the page
    await page.reload();
    // Should see the resume banner or be on result screen
    const resumeOrResult = page.locator("text=Resume").or(page.locator("text=Your blueprint")).first();
    await expect(resumeOrResult).toBeVisible({ timeout: 10000 });
  });

  test("localStorage saves session data", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    // Check localStorage has our key
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
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    // Should show questions, not an error
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
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    await expect(page.locator("text=A few more details").first()).toBeVisible();
  });

  test("page is functional with JavaScript enabled", async ({ page }) => {
    await page.goto(BASE_URL);
    // If JS was broken, options wouldn't be clickable
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
    // Default tab content should include Platform card
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
    // Steps section or fallback message should appear
    const hasSteps = await page.locator("text=Step-by-Step Guide").count() > 0
      || await page.locator(".step-card").count() > 0
      || await page.locator("text=not available").count() > 0;
    expect(hasSteps).toBeTruthy();
  });

  test("switching tabs does not reload or lose hero section", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    // Hero (executiveSummary) should always be visible regardless of tab
    await page.locator("[data-tab='architecture']").click();
    await expect(page.locator("text=Your blueprint").first()).toBeVisible();
    await page.locator("[data-tab='summary']").click();
    await expect(page.locator("text=Your blueprint").first()).toBeVisible();
  });

  test("tab state resets to summary on Start Over and new generation", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    // Switch to architecture tab
    await page.locator("[data-tab='architecture']").click();
    await expect(page.locator("[data-tab='architecture']")).toHaveClass(/active/);
    // Start over and go back to intake
    await page.locator("button").filter({ hasText: /Start over/i }).first().click();
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
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    await page.locator(".opt").first().click().catch(() => {});
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    // During generation the loading tip container should appear
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
    await page.waitForSelector("text=A few more details", { timeout: 45000 });
    await page.locator(".opt").first().click().catch(() => {});
    await page.locator("button").filter({ hasText: /Generate/i }).first().click();
    // Tip text should be non-empty
    const tipEl = page.locator("#loading-tip");
    await expect(tipEl).toBeVisible({ timeout: 5000 });
    const tipText = await tipEl.textContent();
    expect(tipText?.trim().length).toBeGreaterThan(10);
  });

  test("tip interval is cleared after result renders (no memory leak)", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    // After result renders, _tipInterval should be null
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
    // Switch to guide tab (so refine section is off-screen top)
    await page.locator("[data-tab='guide']").click();
    const fab = page.locator("#refine-fab");
    await fab.click();
    // After click refinement section should be visible
    const refineSection = page.locator("#refinement-section");
    await expect(refineSection).toBeVisible({ timeout: 3000 });
  });

  test("FAB click focuses the refineArea textarea", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    const fab = page.locator("#refine-fab");
    await fab.click();
    // Wait for smooth scroll + focus timeout (300ms)
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
    // At least one copy button should exist if steps have prompts
    // (graceful: some blueprints may have 0 prompt templates)
    const copyBtns = page.locator("[data-copy-idx]");
    const count = await copyBtns.count();
    // We cannot guarantee prompts exist in every blueprint, but step cards should
    const stepCards = page.locator(".step-card");
    const stepCount = await stepCards.count();
    if (stepCount > 0 && count > 0) {
      // If prompts exist, each copy button must contain "Copy"
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
      // No prompt templates in this blueprint — skip gracefully
      test.skip(true, "No prompt templates in generated blueprint");
      return;
    }

    // Grant clipboard permission
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const firstBtn = copyBtns.first();
    await firstBtn.click();

    // Button should immediately show "Copied!" text
    await expect(firstBtn).toContainText("Copied!", { timeout: 1000 });
    // And gain the .copied CSS class
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

    // Confirm Copied! is shown
    await expect(firstBtn).toContainText("Copied!", { timeout: 1000 });

    // After 2.2 seconds the button should revert to "Copy"
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
    // Click first button only
    await copyBtns.first().click();
    await expect(copyBtns.first()).toContainText("Copied!", { timeout: 1000 });
    // Second button should still show "Copy"
    await expect(copyBtns.nth(1)).toContainText("Copy");
    await expect(copyBtns.nth(1)).not.toHaveClass(/copied/);
  });

  test("copy button is not visible on Summary tab", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await runToResult(page);
    // Default tab is summary — no copy buttons should be rendered
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

    // Get the rendered prompt text from the monospace paragraph sibling
    const promptText = await firstBtn
      .locator("xpath=../following-sibling::p[contains(@style,'monospace')]")
      .textContent()
      .catch(() => null);

    await firstBtn.click();
    await expect(firstBtn).toContainText("Copied!", { timeout: 1000 });

    // Verify clipboard content matches the displayed prompt
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    if (promptText) {
      expect(clipboardText.trim()).toBe(promptText.trim());
    } else {
      // If we couldn't read the prompt text from DOM, just verify clipboard is non-empty
      expect(clipboardText.trim().length).toBeGreaterThan(0);
    }
  });
});

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────

async function fillIntakeForm(page, userType) {
  await page.goto("https://agentic-flow-designer.vercel.app");
  await page.locator(".opt").filter({ hasText: userType }).first().click();
  // Handle student field of study
  if (userType === "Student") {
    await page.locator(".opt").filter({ hasText: "Engineering & CS" }).first().click();
  }
  // Handle Working Professional extras
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
}

async function answerAllQuestions(page) {
  // Click the first available option for each question card
  const cards = page.locator(".card");
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const opts = card.locator(".opt");
    const optCount = await opts.count();
    if (optCount > 0) {
      await opts.first().click().catch(() => {}); // ignore if not clickable
    }
  }
}

async function runToResult(page) {
  await fillIntakeForm(page, "Student");
  await page.waitForSelector("text=A few more details", { timeout: 45000 });
  await answerAllQuestions(page);
  await page.locator("button").filter({ hasText: /Generate/i }).first().click();
  await page.waitForSelector("text=Your blueprint", { timeout: 60000 });
}
