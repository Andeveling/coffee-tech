import { expect, test } from "@playwright/test";

const newEmail = (): string =>
	`user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

test.describe("register flow", () => {
	test("user can register a new account and is auto-signed in to /dashboard", async ({
		page,
	}) => {
		await page.goto("/register");
		await page.getByLabel("Nombre").fill("New User");
		await page.getByLabel("Email").fill(newEmail());
		await page.getByLabel("Contraseña", { exact: true }).fill("supersecret");
		await page.getByLabel("Confirmar contraseña").fill("supersecret");
		await page.getByRole("button", { name: "Crear cuenta" }).click();
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test("mismatched passwords surface a field error", async ({ page }) => {
		await page.goto("/register");
		await page.getByLabel("Nombre").fill("Mismatch");
		await page.getByLabel("Email").fill(newEmail());
		await page.getByLabel("Contraseña", { exact: true }).fill("supersecret");
		await page.getByLabel("Confirmar contraseña").fill("different");
		await page.getByRole("button", { name: "Crear cuenta" }).click();
		await expect(page.getByLabel("Confirmar contraseña")).toHaveAttribute(
			"aria-invalid",
			"true",
		);
	});
});
