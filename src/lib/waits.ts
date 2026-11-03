/**
 * Walk-in wait estimate: everyone ahead in the queue is shared between the doctors
 * on duty, each taking their usual consultation length.
 */
export function estimateWaitMinutes(ahead: number, onDuty: { consultMinutes: number }[]): number {
	if (ahead <= 0 || onDuty.length === 0) return 0;
	const average = onDuty.reduce((sum, d) => sum + d.consultMinutes, 0) / onDuty.length;
	return Math.round((ahead * average) / onDuty.length);
}
