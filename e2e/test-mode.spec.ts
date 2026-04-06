import { test, expect } from "@playwright/test";

test.describe("Test Mode", () => {
  test("shows test mode button on home page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("test-mode-btn")).toBeVisible();
    await expect(page.getByTestId("test-mode-btn")).toHaveText("Enter Test Mode");
  });

  test("test mode button sets name and shows create form", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("test-mode-btn").click();

    await expect(page.getByText("Host a New Session")).toBeVisible();
    const nameInput = page.getByPlaceholder("Your name");
    await expect(nameInput).toHaveValue("Test Host");
  });
});

test.describe("Full Game Flow with Test Mode", () => {
  test.setTimeout(120000);

  test("complete game: lobby → teams → strategy → voting → verdict", async ({ page }) => {
    // Step 1: Home → Create room with test mode
    await page.goto("/?test=true");
    await page.getByPlaceholder("Enter your name...").fill("Test Host");
    await page.getByRole("button", { name: "Host Game" }).click();
    await page.getByRole("button", { name: "Create Room" }).click();

    // Step 2: Lobby — should see test mode panel and player
    await expect(page.getByText("Game Lobby")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("test-mode-panel")).toBeVisible();
    await expect(page.getByText("Test Host")).toBeVisible();

    // Add fake players
    await page.getByTestId("add-fake-players").click();
    await expect(page.getByText("Players (7)")).toBeVisible({ timeout: 10000 });

    // Start game — wait for navigation to game page
    await page.getByRole("button", { name: /Start Game/ }).click();
    await page.waitForURL(/\/game\//, { timeout: 10000 });

    // Step 3: Teams phase — wait for game page to load
    await expect(page.getByText("Impact Engine")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Form Your Squads")).toBeVisible({ timeout: 10000 });

    // Auto-create teams
    await page.getByTestId("auto-create-teams").click();
    await page.waitForTimeout(2000);

    // Begin strategy phase
    await page.getByTestId("begin-strategy").click({ timeout: 10000 });

    // Step 4: Strategy phase — fill strategies
    await expect(page.getByTestId("fill-strategies")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("fill-strategies").click();
    await page.waitForTimeout(2000);

    // Skip to voting (host control) — may show "Skip to Voting" or "Start Voting Phase"
    // The host may not be on a team, so they see "Join a team first" + skip button
    const skipBtn = page.getByTestId("skip-to-voting");
    const startVotingBtn = page.getByTestId("start-voting");
    if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipBtn.click();
    } else if (await startVotingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startVotingBtn.click();
    }

    // Wait for voting phase — reload if realtime doesn't fire
    try {
      await expect(page.getByText("The Impact-Off")).toBeVisible({ timeout: 10000 });
    } catch {
      // Realtime may not have fired — reload to pick up status
      await page.reload();
      await expect(page.getByText("The Impact-Off")).toBeVisible({ timeout: 10000 });
    }
    await page.getByTestId("simulate-votes").click();
    await page.waitForTimeout(1500);

    // Reveal vote results
    await page.getByTestId("reveal-votes").click();

    // Wait for countdown to finish (5 seconds) and bars to appear
    await expect(page.getByTestId("reveal-verdict")).toBeVisible({ timeout: 10000 });

    // Step 6: Go to CEO verdict
    await page.getByTestId("reveal-verdict").click();

    // Wait for finished phase — reload if realtime doesn't fire
    try {
      await expect(page.getByText(/The CEO is deliberating|The Verdict is Ready/)).toBeVisible({ timeout: 10000 });
    } catch {
      await page.reload();
      await expect(page.getByText(/The CEO is deliberating|The Verdict is Ready/)).toBeVisible({ timeout: 15000 });
    }

    // Wait for verdict to be ready (API call or fallback)
    await expect(page.getByText("The Verdict is Ready")).toBeVisible({ timeout: 30000 });

    // Reveal the winner
    await page.getByTestId("reveal-winner").click();

    // Step 7: Verify final verdict content
    await expect(page.getByText("Fully Funded")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("CEO, Outcomes.com")).toBeVisible();
    await expect(page.getByText("What did we learn?")).toBeVisible();
  });

  test("lobby test panel adds players incrementally", async ({ page }) => {
    await page.goto("/?test=true");
    await page.getByPlaceholder("Enter your name...").fill("Tester");
    await page.getByRole("button", { name: "Host Game" }).click();
    await page.getByRole("button", { name: "Create Room" }).click();

    await expect(page.getByText("Game Lobby")).toBeVisible({ timeout: 10000 });

    // Add 3 players first
    await page.getByTestId("add-3-fake-players").click();
    await expect(page.getByText("Players (4)")).toBeVisible({ timeout: 10000 });

    // Add 6 more
    await page.getByTestId("add-fake-players").click();
    await expect(page.getByText("Players (10)")).toBeVisible({ timeout: 10000 });
  });
});
