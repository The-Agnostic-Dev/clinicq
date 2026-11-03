<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Flash from '$lib/components/Flash.svelte';
	import { LOCAL_PHONE_PATTERN } from '$lib/phone';
	import { formatDay } from '$lib/time';

	let { data, form } = $props();

	// Start from whatever was submitted last (after a failed booking) or the day picked on the list.
	const initial = untrack(() => ({
		doctorId: String(form?.values?.doctorId ?? data.doctorId ?? ''),
		patientName: form?.values?.patientName ?? '',
		date: form?.values?.date ?? data.day,
		time: form?.values?.time ?? ''
	}));

	let doctorId = $state(initial.doctorId);
	let patientName = $state(initial.patientName);
	let date = $state(initial.date);
	let time = $state(initial.time);
	let notice = $state('');
	let saving = $state(false);

	const doctor = $derived(data.doctors.find((d) => String(d.id) === doctorId));
</script>

<svelte:head><title>Book an appointment · ClinicQ</title></svelte:head>

<h1>Book an appointment</h1>
<p class="subtitle">
	Appointments run from {data.opening} to {data.closing}. Each one takes the doctor's usual consultation time.
</p>

{#if notice}
	<Flash kind="ok">{notice} <a href="/appointments?date={date}">See the day's list</a></Flash>
{:else if form?.error}
	<Flash kind="error">{form.error}</Flash>
{/if}

<form
	class="card"
	method="POST"
	use:enhance={() => {
		saving = true;
		notice = '';
		const summary = `Booked ${patientName} with ${doctor?.name ?? 'the doctor'} on ${formatDay(date)} at ${time}.`;
		return async ({ result, update }) => {
			saving = false;
			if (result.type !== 'error') notice = summary;
			await update({ reset: false });
		};
	}}
>
	<div class="row">
		<div>
			<label for="doctorId">Doctor</label>
			<select id="doctorId" name="doctorId" bind:value={doctorId} required>
				<option value="" disabled>Choose a doctor</option>
				{#each data.doctors as d (d.id)}
					<option value={String(d.id)}>{d.name} ({d.specialty})</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="date">Date</label>
			<input id="date" name="date" type="date" min={data.today} bind:value={date} required />
		</div>
		<div>
			<label for="time">Time</label>
			<input id="time" name="time" type="time" min={data.opening} max={data.closing} step="300" bind:value={time} required />
		</div>
	</div>
	{#if doctor}
		<p class="muted">
			{doctor.name} sees each patient for {doctor.consultMinutes} minutes and takes a break from {doctor.breakStart} to {doctor.breakEnd}.
		</p>
	{/if}

	<div class="row">
		<div>
			<label for="patientName">Patient name</label>
			<input id="patientName" name="patientName" bind:value={patientName} required />
		</div>
		<div>
			<label for="phone">Phone number</label>
			<input
				id="phone"
				name="phone"
				type="tel"
				placeholder="0803 123 4567"
				pattern={LOCAL_PHONE_PATTERN}
				title="Nigerian mobile number"
				value={form?.values?.phone ?? ''}
				required
			/>
		</div>
	</div>
	<label for="reason">Reason for visit</label>
	<input id="reason" name="reason" value={form?.values?.reason ?? ''} placeholder="e.g. BP review, child with fever" />

	<p><button class="btn" type="submit" disabled={saving}>{saving ? 'Booking...' : 'Book appointment'}</button></p>
</form>
