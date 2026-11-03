<script lang="ts">
	import DayPicker from '$lib/components/DayPicker.svelte';
	import { formatNaira } from '$lib/format';

	let { data } = $props();
	const s = $derived(data.summary);
</script>

<svelte:head><title>Daily summary · ClinicQ</title></svelte:head>

<h1>Daily summary</h1>
<p class="subtitle">
	"Fees expected" counts consultation fees for patients who were seen: walk-ins marked Done, and appointments
	checked in or seen. Patients not here, missed or cancelled are not counted.
</p>

<DayPicker day={s.day} today={data.today} />

<h2>Walk-ins</h2>
<div class="stats">
	<div class="stat"><div class="value">{s.walkIns.issued}</div><div class="label">Tickets issued</div></div>
	<div class="stat"><div class="value">{s.walkIns.seen}</div><div class="label">Seen</div></div>
	<div class="stat"><div class="value">{s.walkIns.noShow}</div><div class="label">Not here when called</div></div>
	<div class="stat"><div class="value">{s.walkIns.stillWaiting}</div><div class="label">Still in the queue</div></div>
	<div class="stat">
		<div class="value">{s.walkIns.averageWait === null ? 'n/a' : `${s.walkIns.averageWait} min`}</div>
		<div class="label">Average wait before being called</div>
	</div>
</div>

<h2>Appointments</h2>
<div class="stats">
	<div class="stat"><div class="value">{s.appointments.booked}</div><div class="label">Booked</div></div>
	<div class="stat"><div class="value">{s.appointments.attended}</div><div class="label">Attended</div></div>
	<div class="stat"><div class="value">{s.appointments.missed}</div><div class="label">Missed</div></div>
	<div class="stat"><div class="value">{s.appointments.cancelled}</div><div class="label">Cancelled</div></div>
</div>

<section class="card">
	<h2>By doctor</h2>
	<table data-testid="by-doctor">
		<thead><tr><th>Doctor</th><th>Walk-ins seen</th><th>Appointments attended</th><th>Fees expected</th></tr></thead>
		<tbody>
			{#each s.doctors as line (line.doctorId)}
				<tr><td>{line.name}</td><td>{line.walkIns}</td><td>{line.appointments}</td><td>{formatNaira(line.feesKobo)}</td></tr>
			{/each}
		</tbody>
		<tfoot>
			<tr><th>Total</th><th></th><th></th><th>{formatNaira(s.feesKobo)}</th></tr>
		</tfoot>
	</table>
</section>
