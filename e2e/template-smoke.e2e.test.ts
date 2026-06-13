import { expect, test } from "@playwright/test";

test.describe("template smoke", () => {
	test("home page redirects unauthenticated users to /login", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/login/);
	});

	test("register page renders the form", async ({ page }) => {
		await page.goto("/register");
		await expect(
			page.getByRole("button", { name: /crear cuenta|registr/i }),
		).toBeVisible();
	});
});
