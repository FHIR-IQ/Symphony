import { test, expect } from "@playwright/test";

test.describe("Lobby Page", () => {
  test("shows invalid session message without query params", async ({ page }) => {
    await page.goto("/lobby");

    await expect(page.getByText("Invalid session")).toBeVisible();
  });

  test("shows lobby UI with session params", async ({ page }) => {
    await page.goto("/lobby?session=test-session&code=ABC123");

    await expect(page.getByText("Game Lobby")).toBeVisible();
    await expect(page.getByText("ABC123")).toBeVisible();
    await expect(page.getByText("Waiting for players to join")).toBeVisible();
  });

  test("shows Leave Lobby button", async ({ page }) => {
    await page.goto("/lobby?session=test-session&code=XYZ789");

    await expect(page.getByText("Leave Lobby")).toBeVisible();
  });

  test("Leave Lobby navigates back to home", async ({ page }) => {
    await page.goto("/lobby?session=test-session&code=XYZ789");

    await page.getByText("Leave Lobby").click();

    await expect(page).toHaveURL("/");
  });
});
