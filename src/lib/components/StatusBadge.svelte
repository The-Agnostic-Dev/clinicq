<script lang="ts">
	const LABELS: Record<string, string> = {
		waiting: 'Waiting',
		serving: 'With doctor',
		done: 'Seen',
		no_show: 'Not here',
		booked: 'Booked',
		checked_in: 'Checked in',
		cancelled: 'Cancelled'
	};

	let { status }: { status: string } = $props();
	const tone = $derived(
		status === 'done' || status === 'checked_in'
			? 'ok'
			: status === 'no_show' || status === 'cancelled'
				? 'bad'
				: status === 'serving'
					? 'info'
					: 'plain'
	);
</script>

<span class="badge {tone}" data-status={status}>{LABELS[status] ?? status}</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		background: #eef2f6;
		color: var(--ink);
	}
	.ok {
		background: var(--ok-soft);
		color: var(--ok);
	}
	.bad {
		background: var(--bad-soft);
		color: var(--bad);
	}
	.info {
		background: var(--teal-soft);
		color: var(--teal-dark);
	}
</style>
