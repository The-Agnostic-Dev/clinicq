<script lang="ts">
	import { formatPhone } from '$lib/phone';
	import { clinicDayOf, formatDay } from '$lib/time';

	let { data } = $props();
</script>

<svelte:head><title>Patients · ClinicQ</title></svelte:head>

<h1>Patients</h1>
<p class="subtitle">Everyone who has come in as a walk-in or with an appointment. Search by name or phone number.</p>

<form method="GET" class="card search">
	<input name="q" type="search" value={data.q} placeholder="Name or phone number" aria-label="Search patients" />
	<button class="btn" type="submit">Search</button>
</form>

<section class="card">
	<table data-testid="patients">
		<thead>
			<tr><th>Name</th><th>Phone</th><th>Visits</th><th>Latest visit or booking</th><th>Last reason</th></tr>
		</thead>
		<tbody>
			{#each data.patients as p (p.name + p.phone)}
				<tr>
					<td class="name">{p.name}</td>
					<td>{formatPhone(p.phone)}</td>
					<td>{p.visits}</td>
					<td>{formatDay(clinicDayOf(p.lastVisit))}</td>
					<td>{p.lastReason}</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="empty">No patient matches "{data.q}".</td></tr>
			{/each}
		</tbody>
	</table>
</section>

<style>
	.search {
		display: flex;
		gap: 0.5rem;
	}
</style>
