<script lang="ts">
	import { page } from '$app/state';
	import type { SessionUser } from '$lib/types';

	let { user }: { user: SessionUser } = $props();

	const links = [
		{ href: '/', label: 'Front desk' },
		{ href: '/queue', label: 'Walk-in queue' },
		{ href: '/appointments', label: 'Appointments' },
		{ href: '/patients', label: 'Patients' },
		{ href: '/doctors', label: 'Doctors' },
		{ href: '/summary', label: 'Daily summary' }
	];

	function active(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<header>
	<a class="brand" href="/">Clinic<span>Q</span></a>
	<nav>
		{#each links as link}
			<a href={link.href} class:active={active(link.href)}>{link.label}</a>
		{/each}
	</nav>
	<div class="who">
		<span>{user.name}</span>
		<form method="POST" action="/logout">
			<button class="btn secondary small" type="submit">Log out</button>
		</form>
	</div>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		background: #fff;
		border-bottom: 1px solid var(--line);
		padding: 0.6rem 1.25rem;
		flex-wrap: wrap;
	}
	.brand {
		font-weight: 800;
		font-size: 1.25rem;
		color: var(--ink);
		text-decoration: none;
	}
	.brand span {
		color: var(--teal);
	}
	nav {
		display: flex;
		gap: 0.25rem;
		flex: 1;
		flex-wrap: wrap;
	}
	nav a {
		padding: 0.4rem 0.7rem;
		border-radius: 6px;
		text-decoration: none;
		color: var(--muted);
		font-weight: 600;
	}
	nav a.active {
		background: var(--teal-soft);
		color: var(--teal-dark);
	}
	.who {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--muted);
	}
</style>
