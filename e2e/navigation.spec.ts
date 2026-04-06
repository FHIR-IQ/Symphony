import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads with correct title", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Impact Engine/);
  });

  test("game page shows loading state for invalid session", async ({ page }) => {
    await page.goto("/game/nonexistent-session");

    await expect(page.getByText("Loading game...")).toBeVisible();
  });

  test("full host flow: home -> host game -> shows create form", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("Enter your name...").fill("TestHost");
    await page.getByRole("button", { name: "Host Game" }).click();

    await expect(page.getByText("Host a New Session")).toBeVisible();
    const nameInput = page.getByPlaceholder("Your name");
    await expect(nameInput).toHaveValue("TestHost");
  });

  test("full join flow: home -> join game -> shows join form", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("Enter your name...").fill("TestPlayer");
    await page.getByRole("button", { name: "Join Game" }).click();

    await expect(page.getByText("Join a Session")).toBeVisible();
  });
});
