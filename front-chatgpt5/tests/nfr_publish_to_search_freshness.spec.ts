import { test, expect } from "@playwright/test";

/**
 * Acceptance Plan #2: Publish-to-Search Freshness
 *
 * This UI-level test approximates:
 *  - "Publish 500 jobs, poll search until each is visible, compute P95 and P99
 *    of latency (first_indexed_at - published_at)."
 *
 * Backend prerequisites (tracing, logging of published_at/first_indexed_at,
 * peak vs off-peak scheduling, seeded data volume) must be handled outside
 * this script as part of environment setup.
 */

// -------- Configuration & helpers --------

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "http://localhost:5173";

/**
 * To match the Acceptance Plan you would set:
 *   FRESHNESS_JOB_COUNT=500
 * and run at both peak & off-peak times from CI/scheduler.
 *
 * Default is smaller so the test remains practical by default.
 */
const JOB_COUNT = Number(process.env.FRESHNESS_JOB_COUNT || "250");

// Default polling interval is 15 seconds per the Acceptance Plan.
const POLL_INTERVAL_MS = Number(
  process.env.FRESHNESS_POLL_INTERVAL_MS || "15000"
);

// Maximum time we will wait for any single job to appear in search.
const MAX_WAIT_MS = Number(
  process.env.FRESHNESS_MAX_WAIT_MS || String(10 * 60 * 1000)
);

// Thresholds from Acceptance Plan #2.
const P95_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const P99_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new Error("Cannot compute percentile of empty set");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * sorted.length;
  const index = Math.ceil(rank) - 1;
  const safeIndex = Math.min(Math.max(index, 0), sorted.length - 1);
  return sorted[safeIndex];
}

/**
 * Format milliseconds as mm:ss for logging.
 */
function formatMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

// -------- Core test --------

test.describe("Non-functional: Publish-to-Search Freshness", () => {
  test(
    "P95 ≤ 5 min and P99 ≤ 10 min for publish-to-search latency",
    async ({ page }) => {
      // ------- Step 0: Register + login as employer -------

      const uniq = Date.now();
      const employerEmail = `freshness-employer+${uniq}@example.com`;
      const employerPassword = "FreshnessTestPassword123!";

      // Register as employer
      await page.goto(`${FRONTEND_BASE_URL}/register`);

      // Register page has a single email + password input and a role <select>.
      await page.locator('input[type="email"]').fill(employerEmail);
      await page.locator('input[type="password"]').fill(employerPassword);
      await page.locator("select").selectOption("employer");

      await page.getByRole("button", { name: /register/i }).click();

      // The Register page navigates to /login after a short delay.
      await page.waitForURL("**/login", { timeout: 10000 });

      // Login as the new employer
      await page.locator('input[type="email"]').fill(employerEmail);
      await page.locator('input[type="password"]').fill(employerPassword);
      await page.getByRole("button", { name: /login/i }).click();

      // After login we land on Home ("/").
      // await page.waitForURL("**/", { timeout: 10000 });


      // ------- Step 1 & 2 per Acceptance Plan (adapted to UI) -------
      //
      // Plan:
      //  1. During peak hours, publish 250 jobs; during off-peak, publish 250 (total 500).
      //  2. For each job, run the search query every 15 seconds until the job appears.
      //  3. Record latency = first_indexed_at − published_at.
      //
      // Here:
      //  - We create JOB_COUNT jobs via the Employer Jobs form.
      //  - For each job we:
      //      * Click "Create job"
      //      * Immediately start polling search page every POLL_INTERVAL_MS
      //        until the job appears (or MAX_WAIT_MS elapses).
      //      * Measure latency from "publish" (after create completion) to
      //        first appearance in search UI.

      const latenciesMs: number[] = [];

      for (let i = 0; i < JOB_COUNT; i++) {

        await page.waitForURL("**/", { timeout: 10000 });

        // Navigate to Employer Jobs page via Navbar link.
        await page.getByRole("link", { name: /employer/i }).click();
        await page.waitForURL("**/employer/jobs", { timeout: 10000 });



        const title = `Freshness Test Job ${uniq}-${i}`;
        const company = `Freshness Co ${i}`;
        const location = "Remote";
        const description = `End-to-end freshness test job #${i}`;
        const teaser = `Teaser for freshness job #${i}`;

        // Fill the "Create a new job" form.
        const textInputs = page.locator('form input[type="text"]');
        const textareas = page.locator("form textarea");

        // According to src/pages/EmployerJobs.tsx:
        //  input[0] => Title
        //  input[1] => Company
        //  input[2] => Location
        await textInputs.nth(0).fill(title);
        await textInputs.nth(1).fill(company);
        await textInputs.nth(2).fill(location);

        // textarea[0] => Description
        // textarea[1] => Teaser (optional)
        await textareas.nth(0).fill(description);
        await textareas.nth(1).fill(teaser);

        const createButton = page.getByRole("button", { name: /create job/i });

        // Click Create and wait until the request finishes (button text toggles).
        await Promise.all([
          // The UI toggles the button label to "Creating..." while in-flight.
          page.waitForResponse(
            (resp) =>
              resp.url().includes("/employer/jobs") &&
              resp.request().method() === "POST"
          ),
          createButton.click(),
        ]);

        // Confirm the job appears in the employer's own list (sanity check).
        await expect(page.getByText(title)).toBeVisible({
          timeout: 10000,
        });

        // "published_at" approximation: the moment the creation request completes.
        const publishedAt = Date.now();

        // Now measure time until the job appears in public search.
        const latencyMs = await measureLatencyViaSearch(
          page,
          title,
          publishedAt
        );
        latenciesMs.push(latencyMs);

        console.log(
          `[Freshness] Job ${i + 1}/${JOB_COUNT} (${title}) indexed in ${formatMs(
            latencyMs
          )}`
        );
      }

      // ------- Metrics & Pass/Fail per Acceptance Plan -------

      // Metrics: Latency distribution, P95, P99.
      const p95 = percentile(latenciesMs, 95);
      const p99 = percentile(latenciesMs, 99);

      console.log(
        `[Freshness] Latencies (ms): count=${latenciesMs.length}, P95=${p95}, P99=${p99}`
      );
      console.log(
        `[Freshness] P95=${formatMs(p95)} (threshold ${formatMs(
          P95_THRESHOLD_MS
        )}), P99=${formatMs(p99)} (threshold ${formatMs(P99_THRESHOLD_MS)})`
      );

      // Pass/Fail rule from Acceptance Plan:
      // "Pass if P95 ≤ 5:00 and P99 ≤ 10:00. Otherwise Fail."
      expect(p95, "P95 publish-to-search latency must be ≤ 5 minutes").toBeLessThanOrEqual(
        P95_THRESHOLD_MS
      );
      expect(p99, "P99 publish-to-search latency must be ≤ 10 minutes").toBeLessThanOrEqual(
        P99_THRESHOLD_MS
      );
    }
  );
});

// -------- Helper for polling search page --------

async function measureLatencyViaSearch(
  page: import("@playwright/test").Page,
  jobTitle: string,
  publishedAt: number
): Promise<number> {
  // Navigate to the Home page where search lives.
  await page.goto(`${FRONTEND_BASE_URL}/`);

  // Home page (src/pages/Home.tsx) has:
  //  - "Keyword" input (first text input)
  //  - "Location" input
  //  - "Company" input
  //  - "Search" button
  const keywordInput = page
    .locator('form input[type="text"]')
    .first();
  const searchButton = page.getByRole("button", { name: /search/i });

  const start = publishedAt;
  let found = false;

  while (!found && Date.now() - start < MAX_WAIT_MS) {
    await keywordInput.fill(jobTitle);
    await searchButton.click();

    // Wait for network settle to give the search API time to respond.
    await page.waitForLoadState("networkidle");

    // The Home page renders jobs as <li> items with a <Link> containing job.title.
    const resultLocator = page.locator("li", { hasText: jobTitle });
    if ((await resultLocator.count()) > 0) {
      found = true;
      break;
    }

    // Not found yet; wait POLL_INTERVAL_MS per Acceptance Plan.
    await page.waitForTimeout(POLL_INTERVAL_MS);
  }

  if (!found) {
    throw new Error(
      `Job "${jobTitle}" did not appear in search within ${formatMs(
        MAX_WAIT_MS
      )}`
    );
  }

  const firstIndexedAt = Date.now();
  return firstIndexedAt - start;
}
