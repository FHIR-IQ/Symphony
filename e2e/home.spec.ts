import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("renders the Impact Engine landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Impact Engine")).toBeVisible();
    await expect(page.getByText("The Billion Dollar Pivot")).toBeVisible();
    await expect(page.getByText("AI Office Hours Workshop")).toBeVisible();
  });

  test("shows name input and host/join buttons", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByPlaceholder("Enter your name...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Host Game" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Join Game" })).toBeVisible();
  });

  test("clicking Host Game shows create room form", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Host Game" }).click();

    await expect(page.getByText("Host a New Session")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Room" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
  });

  test("clicking Join Game shows join room form", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Join Game" }).click();

    await expect(page.getByText("Join a Session")).toBeVisible();
    await expect(page.getByPlaceholder(/Room code/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Join Room" })).toBeVisible();
  });

  test("Back button returns to initial view", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Host Game" }).click();
    await expect(page.getByText("Host a New Session")).toBeVisible();

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("button", { name: "Host Game" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Join Game" })).toBeVisible();
  });

  test("room code input converts to uppercase", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Join Game" }).click();
    const codeInput = page.getByPlaceholder(/Room code/);
    await codeInput.fill("abc123");

    await expect(codeInput).toHaveValue("ABC123");
  });

  test("name input has max length of 30", async ({ page }) => {
    await page.goto("/");

    const nameInput = page.getByPlaceholder("Enter your name...");
    await expect(nameInput).toHaveAttribute("maxlength", "30");
  });
});
