import { expect, test } from "@playwright/test";

const email = (local: string): string => `${local}@example.test`;

test.describe("login flow", () => {
	test("unauthenticated user is redirected to /login with next= when hitting a private path", async ({
		page,
	}) => {
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
	});

	test("user can sign in with valid credentials and land on /dashboard", async ({
		page,
	}) => {
		// Seeded user from `bun run db:seed`. Tests rely on a clean DB.
		await page.goto("/login");
		await page.getByLabel("Email").fill(email("ada"));
		await page.getByLabel("Contraseña").fill("hunter22");
		await page.getByRole("button", { name: "Iniciar sesión" }).click();
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test("invalid credentials show a form-level error", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel("Email").fill(email("ada"));
		await page.getByLabel("Contraseña").fill("wrong-password");
		await page.getByRole("button", { name: "Iniciar sesión" }).click();
		await expect(page.getByRole("alert")).toContainText(
			"Email o contraseña incorrectos",
		);
	});
});
