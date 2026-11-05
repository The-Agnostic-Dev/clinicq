<script lang="ts">
	import { enhance } from '$app/forms';
	import DayPicker from '$lib/components/DayPicker.svelte';
	import Flash from '$lib/components/Flash.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatPhone } from '$lib/phone';
	import { formatTime } from '$lib/time';

	let { data, form } = $props();

	const groups = $derived(
		data.doctors
			.filter((d) => !data.doctorId || d.id === data.doctorId)
			.map((doctor) => ({ doctor, appointments: data.appointments.filter((a) => a.doctorId === doctor.id) }))
	);

	let pending = $state<number | null>(null);
</script>

<svelte:head><title>Appointments · ClinicQ</title></svelte:head>

<div class="heading">
	<div>
		<h1>Appointments</h1>
		<p class="subtitle">Check patients in when they arrive. Cancelled bookings stay on the list, greyed out.</p>
	</div>
	<a class="btn" href="/appointments/new?date={data.day}">Book an appointment</a>
</div>

<DayPicker day={data.day} today={data.today} extra={data.doctorId ? { doctor: String(data.doctorId) } : {}} />

<form method="GET" class="filter">
	<input type="hidden" name="date" value={data.day} />
	<label for="doctor">Doctor</label>
	<select id="doctor" name="doctor" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
		<option value="">All doctors</option>
		{#each data.doctors as doctor (doctor.id)}
			<option value={doctor.id} selected={doctor.id === data.doctorId}>{doctor.name}</option>
		{/each}
	</select>
</form>

{#if form?.error}
	<Flash kind="error">{form.error}</Flash>
{:else if form?.message}
	<Flash kind="ok">{form.message}</Flash>
{/if}

{#each groups as group (group.doctor.id)}
	<section class="card" data-doctor-id={group.doctor.id}>
		<h2>{group.doctor.name} <span class="muted">{group.doctor.specialty}, {group.doctor.room}</span></h2>
		<table>
			<thead>
				<tr><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th></th></tr>
			</thead>
			<tbody>
				{#each group.appointments as appt (appt.id)}
					<tr data-appointment-id={appt.id} class:inactive={appt.status === 'cancelled'}>
						<td class="time">{formatTime(appt.startsAt)} to {formatTime(appt.endsAt)}</td>
						<td class="patient">{appt.patientName}<br /><span class="muted">{formatPhone(appt.phone)}</span></td>
						<td>{appt.reason}</td>
						<td class="status"><StatusBadge status={appt.status} /></td>
						<td class="actions">
							{#if appt.status === 'booked' || appt.status === 'no_show'}
								<form
									method="POST"
									action="?/checkIn"
									use:enhance={({ cancel }) => {
										if (pending !== null) {
											cancel();
											return;
										}
										pending = appt.id;
										return async ({ update }) => {
											pending = null;
											await update();
										};
									}}
								>
									<input type="hidden" name="id" value={appt.id} />
									<button class="btn small" type="submit" disabled={pending === appt.id}>Check in</button>
								</form>
							{/if}
							{#if appt.status === 'checked_in'}
								<form method="POST" action="?/seen" use:enhance>
									<input type="hidden" name="id" value={appt.id} />
									<button class="btn small" type="submit">Seen</button>
								</form>
								<form method="POST" action="?/undoCheckIn" use:enhance>
									<input type="hidden" name="id" value={appt.id} />
									<button class="btn small secondary" type="submit">Undo check-in</button>
								</form>
							{/if}
							{#if appt.status === 'booked'}
								<form method="POST" action="?/missed" use:enhance>
									<input type="hidden" name="id" value={appt.id} />
									<button class="btn small danger" type="submit">Missed</button>
								</form>
								<a class="btn small secondary" href="/appointments/{appt.id}">Change</a>
							{/if}
						</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="empty">No appointments.</td></tr>
				{/each}
			</tbody>
		</table>
	</section>
{/each}

<style>
	.heading {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 1rem;
	}
	.filter {
		max-width: 320px;
		margin-bottom: 1rem;
	}
	h2 .muted {
		font-weight: 400;
		font-size: 0.9rem;
	}
	.time {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
</style>
