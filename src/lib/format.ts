const naira = new Intl.NumberFormat('en-NG', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

/** Amounts are kept in kobo. 1250000 -> "₦12,500.00" */
export function formatNaira(kobo: number): string {
	return `₦${naira.format(kobo / 100)}`;
}

/** "Next", "about 5 min", "about 1 h 10 min" */
export function formatWait(minutes: number): string {
	if (minutes <= 0) return 'Next';
	if (minutes < 60) return `about ${minutes} min`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m === 0 ? `about ${h} h` : `about ${h} h ${m} min`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
	return `${count} ${count === 1 ? one : many}`;
}
