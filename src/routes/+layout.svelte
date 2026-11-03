<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';

	let { data, children } = $props();
</script>

{#if data.user}
	<Nav user={data.user} />
{/if}
<main>
	{@render children()}
</main>
