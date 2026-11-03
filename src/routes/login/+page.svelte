<script lang="ts">
	import Flash from '$lib/components/Flash.svelte';

	let { form } = $props();
</script>

<svelte:head><title>Sign in · ClinicQ</title></svelte:head>

<div class="login card">
	<h1>Clinic<span>Q</span></h1>
	<p class="subtitle">Front desk sign in</p>
	{#if form?.error}<Flash kind="error">{form.error}</Flash>{/if}
	<form method="POST">
		<label for="username">Username</label>
		<input id="username" name="username" autocomplete="username" value={form?.username ?? ''} required />
		<label for="password">Password</label>
		<input id="password" name="password" type="password" autocomplete="current-password" required />
		<p><button class="btn" type="submit">Sign in</button></p>
	</form>
</div>

<style>
	.login {
		max-width: 380px;
		margin: 4rem auto;
	}
	h1 span {
		color: var(--teal);
	}
</style>
