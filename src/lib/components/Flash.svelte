<script lang="ts">
	import type { Snippet } from 'svelte';

	let { kind = 'ok', children }: { kind?: 'ok' | 'error' | 'info'; children: Snippet } = $props();
</script>

<p class="flash {kind}" role={kind === 'error' ? 'alert' : 'status'}>
	{@render children()}
</p>

<style>
	.flash {
		padding: 0.65rem 0.9rem;
		border-radius: 8px;
		margin: 0 0 1rem;
		font-weight: 500;
	}
	.ok {
		background: var(--ok-soft);
		color: var(--ok);
	}
	.error {
		background: var(--bad-soft);
		color: var(--bad);
	}
	.info {
		background: var(--teal-soft);
		color: var(--teal-dark);
	}
</style>
