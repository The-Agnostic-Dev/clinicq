<script lang="ts">
	import { formatDay, formatTime } from '$lib/time';

	let { data } = $props();
	const onDuty = $derived(data.roster.filter((d) => d.onDuty));
	const away = $derived(data.roster.filter((d) => !d.onDuty));
</script>

<svelte:head><title>Front desk · ClinicQ</title></svelte:head>

<h1>Good day, {data.user?.name.split(' ')[0]}</h1>
<p class="subtitle">{formatDay(data.today)}</p>

<div class="stats">
	<div class="stat"><div class="value">{data.counts.waiting}</div><div class="label">Walk-ins waiting</div></div>
	<div class="stat"><div class="value">{data.counts.serving}</div><div class="label">With a doctor now</div></div>
	<div class="stat"><div class="value">{data.counts.seen}</div><div class="label">Walk-ins seen today</div></div>
</div>

<div class="grid">
	<section class="card" data-testid="on-duty">
		<h2>On duty today</h2>
		{#each onDuty as doctor (doctor.id)}
			<div class="doctor" data-doctor-id={doctor.id}>
				<strong>{doctor.name}</strong>
				<span class="muted">{doctor.specialty}, {doctor.room}. Break {doctor.breakStart} to {doctor.breakEnd}</span>
			</div>
		{:else}
			<p class="empty">No doctor is on duty today.</p>
		{/each}
		{#if away.length}
			<p class="muted away">Not in today: {away.map((d) => d.name).join(', ')}</p>
		{/if}
	</section>

	<section class="card">
		<h2>Next appointments</h2>
		{#each data.upcoming as appt (appt.id)}
			<div class="doctor">
				<strong>{formatTime(appt.startsAt)} {appt.patientName}</strong>
				<span class="muted">{appt.doctorName}: {appt.reason || 'No reason given'}</span>
			</div>
		{:else}
			<p class="empty">No more appointments today.</p>
		{/each}
		<p><a class="btn small" href="/appointments/new">Book an appointment</a></p>
	</section>
</div>

<style>
	.doctor {
		display: flex;
		flex-direction: column;
		padding: 0.45rem 0;
		border-bottom: 1px solid var(--line);
	}
	.away {
		margin-top: 0.75rem;
	}
</style>
