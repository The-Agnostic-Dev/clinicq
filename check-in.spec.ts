import { expect, test } from '@playwright/test';

test('receptionist can check in an appointment from the appointments page', async ({ page }) => {
	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') consoleErrors.push(msg.text());
	});
	page.on('pageerror', (err) => pageErrors.push(err.message));

	await page.goto('/login');
	await page.getByLabel('Username').fill('blessing');
	await page.getByLabel('Password').fill('clinicq2026');
	await page.getByRole('button', { name: /sign in|log in/i }).click();
	await page.waitForURL((url) => !url.pathname.startsWith('/login'));

	await page.goto('/appointments');

	const checkInButton = page.locator('button:has-text("Check in"):not([disabled])').first();
	await expect(checkInButton).toBeVisible();
	const row = checkInButton.locator('xpath=ancestor::tr[1]');

	const responsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('/appointments') &&
			response.url().includes('checkIn') &&
			response.ok()
	);

	await checkInButton.click();
	const response = await responsePromise;
	expect(response.ok()).toBe(true);

	await expect(row.getByText('Checked in')).toBeVisible();
	await expect(row.getByRole('button', { name: 'Seen' })).toBeVisible();
	await expect(row.getByRole('button', { name: 'Undo' })).toBeVisible();

	expect(consoleErrors).toEqual([]);
	expect(pageErrors).toEqual([]);
});
