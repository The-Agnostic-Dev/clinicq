/**
 * Nigerian mobile numbers. Patients give them as 0803 123 4567, 08031234567,
 * +234 803 123 4567 or 2348031234567; we store the local 11-digit form.
 */
const LOCAL = /^0[789][01]\d{8}$/;

/** Same rule as an HTML pattern attribute, for phone inputs. */
export const LOCAL_PHONE_PATTERN = '0[789][01][0-9]{8}';

export function normalisePhone(raw: string): string {
	let digits = raw.replace(/[\s\-().]/g, '');
	if (digits.startsWith('+')) digits = digits.slice(1);
	if (digits.startsWith('234') && digits.length === 13) digits = '0' + digits.slice(3);
	return digits;
}

export function isValidPhone(raw: string): boolean {
	return LOCAL.test(normalisePhone(raw));
}

/** 0803 123 4567 */
export function formatPhone(phone: string): string {
	const p = normalisePhone(phone);
	if (!LOCAL.test(p)) return phone;
	return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`;
}
