import { expect, test } from '@playwright/test';

const baseURL = process.env.TAD_QA_BASE_URL ?? 'http://localhost:5114';

test.use({ baseURL });

test('receptionist can check in a booked appointment', async ({ page }) => {
	await page.goto('/login');
	await page.locator('input[name="username"]').fill('blessing');
	await page.locator('input[name="password"]').fill('clinicq2026');
	await Promise.all([
		page.waitForURL((url) => !url.pathname.startsWith('/login')),
		page.getByRole('button', { name: /sign in|log ?in/i }).click()
	]);

	await page.goto('/appointments');

	const checkedInBadges = page.getByText('Checked in');
	const badgesBefore = await checkedInBadges.count();

	const checkInResponse = page.waitForResponse(
		(response) => response.request().method() === 'POST' && response.url().includes('?/checkIn')
	);
	await page.getByRole('button', { name: 'Check in' }).first().click();

	const response = await checkInResponse;
	expect(response.ok()).toBe(true);

	await expect(checkedInBadges).toHaveCount(badgesBefore + 1);
});
