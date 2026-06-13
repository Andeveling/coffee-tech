import { expect, test } from "@playwright/test";

const newEmail = (): string =>
	`user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

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
		// Self-contained: register a fresh user, then sign in with the same
		// credentials. Avoids depending on a pre-seeded user.
		const email = newEmail();
		const password = "hunter22";

		await page.goto("/register");
		await page.getByLabel("Nombre").fill("Login Test");
		await page.getByLabel("Email").fill(email);
		await page.getByLabel("Contraseña", { exact: true }).fill(password);
		await page.getByLabel("Confirmar contraseña").fill(password);
		await page.getByRole("button", { name: "Crear cuenta" }).click();
		await expect(page).toHaveURL(/\/dashboard/);

		await page.context().clearCookies();

		await page.goto("/login");
		await page.getByLabel("Email").fill(email);
		await page.getByLabel("Contraseña").fill(password);
		await page.getByRole("button", { name: "Iniciar sesión" }).click();
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test("invalid credentials show a form-level error", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel("Email").fill(newEmail());
		await page.getByLabel("Contraseña").fill("wrong-password");
		await page.getByRole("button", { name: "Iniciar sesión" }).click();
		// Scope to the form-level alert (the paragraph inside the form),
		// not the global Next route announcer which is also role="alert".
		await expect(
			page.getByText("Email o contraseña incorrectos"),
		).toBeVisible();
	});

	test("post-login honors the next search param when it is a safe internal path", async ({
		page,
	}) => {
		const email = newEmail();
		const password = "hunter22";

		await page.goto("/register");
		await page.getByLabel("Nombre").fill("Next Test");
		await page.getByLabel("Email").fill(email);
		await page.getByLabel("Contraseña", { exact: true }).fill(password);
		await page.getByLabel("Confirmar contraseña").fill(password);
		await page.getByRole("button", { name: "Crear cuenta" }).click();
		await expect(page).toHaveURL(/\/dashboard/);
		await page.context().clearCookies();

		// Direct visit to a private path with next= → login → land on next target.
		await page.goto("/dashboard?tab=profile");
		await page.getByLabel("Email").fill(email);
		await page.getByLabel("Contraseña").fill(password);
		await page.getByRole("button", { name: "Iniciar sesión" }).click();
		// next= is preserved through the form; the page lands on /dashboard?tab=profile.
		await expect(page).toHaveURL(/\/dashboard/);
	});
});
