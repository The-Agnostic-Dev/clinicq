<script lang="ts">
	import Flash from '$lib/components/Flash.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatPhone } from '$lib/phone';
	import { formatDay, formatTime } from '$lib/time';

	let { data, form } = $props();
	const appt = $derived(data.appointment);
</script>

<svelte:head><title>{appt.patientName} · ClinicQ</title></svelte:head>

<p><a href="/appointments?date={data.day}">&larr; Back to {formatDay(data.day)}</a></p>
<h1>{appt.patientName}</h1>
<p class="subtitle">
	{formatPhone(appt.phone)}. {appt.reason || 'No reason given'}.
	<StatusBadge status={appt.status} />
</p>

{#if form?.error}<Flash kind="error">{form.error}</Flash>{/if}

<div class="grid">
	<section class="card">
		<h2>Current booking</h2>
		<p>{appt.doctorName}<br />{formatDay(data.day)}, {formatTime(appt.startsAt)} to {formatTime(appt.endsAt)}</p>
		{#if appt.status === 'booked'}
			<form method="POST" action="?/cancel">
				<button class="btn danger" type="submit">Cancel appointment</button>
			</form>
		{/if}
	</section>

	{#if appt.status === 'booked'}
		<section class="card">
			<h2>Move to another time</h2>
			<form method="POST" action="?/reschedule">
				<label for="doctorId">Doctor</label>
				<select id="doctorId" name="doctorId">
					{#each data.doctors as d (d.id)}
						<option value={d.id} selected={d.id === appt.doctorId}>{d.name}</option>
					{/each}
				</select>
				<div class="row">
					<div>
						<label for="date">Date</label>
						<input id="date" name="date" type="date" min={data.today} value={data.day} required />
					</div>
					<div>
						<label for="time">Time</label>
						<input id="time" name="time" type="time" step="300" value={data.time} required />
					</div>
				</div>
				<p><button class="btn" type="submit">Save new time</button></p>
			</form>
		</section>
	{/if}
</div>
