<script lang="ts">
	import { addDays, formatDay } from '$lib/time';

	let { day, today, extra = {} }: { day: string; today: string; extra?: Record<string, string> } = $props();

	function href(target: string): string {
		const params = new URLSearchParams({ ...extra, date: target });
		return `?${params}`;
	}
</script>

<form class="day-picker" method="GET">
	<a class="btn secondary small" href={href(addDays(day, -1))} aria-label="Previous day">&larr;</a>
	<input type="date" name="date" value={day} onchange={(e) => e.currentTarget.form?.requestSubmit()} />
	{#each Object.entries(extra) as [name, value]}
		<input type="hidden" {name} {value} />
	{/each}
	<a class="btn secondary small" href={href(addDays(day, 1))} aria-label="Next day">&rarr;</a>
	{#if day !== today}
		<a class="btn secondary small" href={href(today)}>Today</a>
	{/if}
	<span class="muted">{formatDay(day)}</span>
</form>

<style>
	.day-picker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}
	input[type='date'] {
		width: auto;
	}
</style>
