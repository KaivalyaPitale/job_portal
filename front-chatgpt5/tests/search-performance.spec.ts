import { test, expect, type Page } from "@playwright/test";

/**
 * Non-functional requirement #4: Search Performance (P95 ≤ 800 ms)
 *
 * This test:
 *  - Assumes no users and no jobs at start (per instructions).
 *  - Registers a new EMPLOYER and logs in.
 *  - Creates 10 job posts via the Employer Jobs UI.
 *  - Executes 10 representative search queries on the Home page.
 *  - For each search, measures client-observed latency:
 *      click "Search" → GET /api/jobs response.
 *  - Computes P50/P90/P95 of the latency distribution and error rate.
 *  - Fails if P95 > 800 ms or error rate ≥ 0.5%.
 *
 * NOTE:
 *  - This approximates the Acceptance Plan (which calls for k6/JMeter
 *    at 100 rps with server-side timing logs).
 *  - It is a UI regression guard, not a full-load test.
 */

// Base URL for the frontend (Vite dev server or deployed app)
const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "http://localhost:5173";

// From Acceptance Plan #4
const P95_THRESHOLD_MS = 800; // 800 ms
const ERROR_RATE_THRESHOLD = 0.005; // 0.5%

// Max wait for a single search request before treating it as failed
const MAX_SEARCH_WAIT_MS = Number(
  process.env.SEARCH_PERF_MAX_WAIT_MS || "10000"
);

/**
 * Fixtures: 10 job postings that we will create via the Employer Jobs UI.
 * Titles / locations / companies are chosen to support representative queries.
 */
const JOB_FIXTURES = [
  {
    title: "Software Engineer",
    company: "Acme Corp",
    location: "Remote",
    teaser: "Build scalable backend services.",
    description: "Work on backend systems and APIs.",
  },
  {
    title: "Backend Engineer",
    company: "Globex",
    location: "New York",
    teaser: "Design services powering the platform.",
    description: "Develop and maintain backend microservices.",
  },
  {
    title: "Data Scientist",
    company: "Initech",
    location: "San Francisco",
    teaser: "Turn data into insights.",
    description: "Build models and analytics pipelines.",
  },
  {
    title: "Frontend Developer",
    company: "Umbrella",
    location: "Seattle",
    teaser: "Craft delightful user interfaces.",
    description: "Work with React to deliver great UX.",
  },
  {
    title: "Product Manager",
    company: "Hooli",
    location: "Remote",
    teaser: "Drive product direction and roadmap.",
    description: "Collaborate across engineering and design.",
  },
  {
    title: "DevOps Engineer",
    company: "Stark Industries",
    location: "Austin",
    teaser: "Automate infrastructure and deployments.",
    description: "Build CI/CD and observability tooling.",
  },
  {
    title: "QA Engineer",
    company: "Wayne Enterprises",
    location: "Boston",
    teaser: "Ensure product quality end-to-end.",
    description: "Design test plans and automation.",
  },
  {
    title: "Software Engineering Intern",
    company: "Wonka",
    location: "Remote",
    teaser: "Learn and contribute to real projects.",
    description: "Support development teams with coding tasks.",
  },
  {
    title: "Senior Software Engineer",
    company: "Pied Piper",
    location: "Chicago",
    teaser: "Lead engineering initiatives.",
    description: "Mentor others and drive technical decisions.",
  },
  {
    title: "Full Stack Developer",
    company: "Cyberdyne",
    location: "London",
    teaser: "Own features end-to-end.",
    description: "Work on both frontend and backend.",
  },
] as const;

/**
 * Representative queries derived from the fixtures (≤ 10 filters – we only have
 * three fields in the UI: q, location, company).
 */
const QUERIES = [
  {
    name: "Keyword: software engineer (Remote)",
    q: "software engineer",
    location: "Remote",
    company: "",
  },
  {
    name: "Keyword: backend (New York)",
    q: "backend",
    location: "New York",
    company: "",
  },
  {
    name: "Keyword: data (San Francisco, Initech)",
    q: "data",
    location: "San Francisco",
    company: "Initech",
  },
  {
    name: "Keyword: frontend (Seattle)",
    q: "frontend",
    location: "Seattle",
    company: "",
  },
  {
    name: "Keyword: product manager (Remote)",
    q: "product manager",
    location: "Remote",
    company: "",
  },
  {
    name: "Keyword: devops (Austin)",
    q: "devops",
    location: "Austin",
    company: "",
  },
  {
    name: "Keyword: qa (Boston)",
    q: "qa",
    location: "Boston",
    company: "",
  },
  {
    name: "Keyword: intern (Remote)",
    q: "intern",
    location: "Remote",
    company: "",
  },
  {
    name: "Keyword: senior engineer (Chicago)",
    q: "senior",
    location: "Chicago",
    company: "",
  },
  {
    name: "Keyword: full stack (London, Cyberdyne)",
    q: "full",
    location: "London",
    company: "Cyberdyne",
  },
];

/**
 * How many times to execute each query.
 * The Acceptance Plan calls for sustained high load from k6/JMeter; here we
 * approximate with repeated UI queries for a sample size.
 */
const REQUESTS_PER_QUERY = Number(
  process.env.SEARCH_PERF_REQUESTS_PER_QUERY || "10"
);

// ---------- Utility: percentile ----------

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new Error("Cannot compute percentile of empty array");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * sorted.length;
  const index = Math.ceil(rank) - 1;
  const clampedIndex = Math.min(Math.max(index, 0), sorted.length - 1);
  return sorted[clampedIndex];
}

// ---------- Helpers for setup ----------

async function registerAndLoginEmployer(page: Page) {
  const uniq = Date.now();
  const email = `search-perf-employer+${uniq}@example.com`;
  const password = "SearchPerfTestPassword123!";

  // Register as EMPLOYER
  await page.goto(`${FRONTEND_BASE_URL}/register`);

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator("select").selectOption("employer");

  await page.getByRole("button", { name: /register/i }).click();

  // Register page navigates to /login after ~800ms
  await page.waitForURL("**/login", { timeout: 10000 });

  // Login
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /login/i }).click();

  // After login, we land on Home ("/")
  await page.waitForURL("**/", { timeout: 10000 });

  return { email, password };
}

async function createEmployerJobs(page: Page) {
  // Navigate to Employer Jobs via Navbar
  await page.getByRole("link", { name: "Employer" }).click();
  await page.waitForURL("**/employer/jobs", { timeout: 10000 });

  for (const job of JOB_FIXTURES) {
    // Fill the "Create a new job" form.
    const textInputs = page.locator('form input[type="text"]');
    const textareas = page.locator("form textarea");

    // According to src/pages/EmployerJobs.tsx:
    //  input[0] => Title
    //  input[1] => Company
    //  input[2] => Location
    await textInputs.nth(0).fill(job.title);
    await textInputs.nth(1).fill(job.company);
    await textInputs.nth(2).fill(job.location);

    // textarea[0] => Description
    // textarea[1] => Teaser (optional)
    await textareas.nth(0).fill(job.description);
    await textareas.nth(1).fill(job.teaser);

    const createButton = page.getByRole("button", { name: /create job/i });

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/employer/jobs") &&
          res.request().method() === "POST",
        { timeout: 10000 }
      ),
      createButton.click(),
    ]);

    if (!response.ok()) {
      throw new Error(
        `Failed to create job "${job.title}". HTTP status ${response.status()}`
      );
    }

    // Created job should appear in the employer list (sanity check)
    await expect(page.getByText(job.title)).toBeVisible({
      timeout: 10000,
    });
  }
}

// ---------- Helper: run search and measure latency ----------

async function measureSearchPerformance(page: Page) {
  await page.goto(`${FRONTEND_BASE_URL}/`);
  // Ensure initial /jobs fetch is done before measuring
  await page.waitForLoadState("networkidle");

  const keywordInput = page.locator('form input[type="text"]').nth(0);
  const locationInput = page.locator('form input[type="text"]').nth(1);
  const companyInput = page.locator('form input[type="text"]').nth(2);
  const searchButton = page.getByRole("button", { name: /search/i });

  const latencies: number[] = [];
  let errorCount = 0;
  let attemptedRequests = 0;

  for (const query of QUERIES) {
    for (let i = 0; i < REQUESTS_PER_QUERY; i++) {
      attemptedRequests += 1;

      await keywordInput.fill(query.q);
      await locationInput.fill(query.location);
      await companyInput.fill(query.company);

      const start = Date.now();

      let response;
      try {
        [response] = await Promise.all([
          page.waitForResponse(
            (res) =>
              res.url().includes("/api/jobs") &&
              res.request().method() === "GET",
            { timeout: MAX_SEARCH_WAIT_MS }
          ),
          searchButton.click(),
        ]);
      } catch (err) {
        console.error(
          `Search request failed for query "${query.name}" (attempt ${
            i + 1
          }):`,
          err
        );
        errorCount += 1;
        continue;
      }

      const end = Date.now();
      const latency = end - start;
      latencies.push(latency);

      if (!response.ok()) {
        errorCount += 1;
      }
    }
  }

  if (latencies.length === 0) {
    throw new Error(
      "No successful search responses recorded; cannot compute latency metrics."
    );
  }

  const p50 = percentile(latencies, 50);
  const p90 = percentile(latencies, 90);
  const p95 = percentile(latencies, 95);
  const errorRate = errorCount / attemptedRequests;

  console.log(
    `[Search Performance] samples=${latencies.length}, attempts=${attemptedRequests}, ` +
      `P50=${p50}ms, P90=${p90}ms, P95=${p95}ms, errorRate=${(
        errorRate * 100
      ).toFixed(2)}%`
  );

  return { p50, p90, p95, errorRate };
}

// ---------- The actual test ----------

test.describe("NFR #4 - Search Performance (P95 ≤ 800 ms)", () => {
  test("P95 search latency ≤ 800 ms and error rate < 0.5%", async ({ page }) => {
    // --- Setup per your rules: no initial users/jobs ---
    // 1) Register + login as a new EMPLOYER.
    await registerAndLoginEmployer(page);

    // 2) Create job posts via Employer Jobs page so search has data.
    await createEmployerJobs(page);

    // --- Procedure (conceptual mapping of Acceptance Plan #4) ---
    // Run 10 representative queries multiple times via the actual search UI
    // and measure latency + error rate.
    const { p50, p90, p95, errorRate } = await measureSearchPerformance(page);

    console.log(
      `[Search Performance] Final metrics: P50=${p50}ms, P90=${p90}ms, P95=${p95}ms, ` +
        `errorRate=${(errorRate * 100).toFixed(2)}%`
    );

    // --- Pass/Fail (from Acceptance Plan #4) ---
    // Pass if:
    //   - P95 ≤ 800 ms
    //   - error rate < 0.5%
    expect(
      p95,
      `Search P95 latency must be ≤ ${P95_THRESHOLD_MS} ms, got ${p95} ms`
    ).toBeLessThanOrEqual(P95_THRESHOLD_MS);

    expect(
      errorRate,
      `Search error rate must be < ${(ERROR_RATE_THRESHOLD * 100).toFixed(
        2
      )}%, got ${(errorRate * 100).toFixed(2)}%`
    ).toBeLessThan(ERROR_RATE_THRESHOLD);
  });
});
