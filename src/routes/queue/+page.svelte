<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Flash from '$lib/components/Flash.svelte';
	import { formatWait } from '$lib/format';
	import { formatPhone } from '$lib/phone';
	import { waitingSince, waitingTickets } from '$lib/tickets';
	import { formatDay } from '$lib/time';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data, form } = $props();

	const waiting = $derived(waitingTickets(data.todayTickets));
	const waitingCount = $derived(waiting.length);
	const seenCount = $derived(data.todayTickets.filter((t) => t.status === 'done').length);
	const noShowCount = $derived(data.todayTickets.filter((t) => t.status === 'no_show').length);
	const servingBy = $derived(
		new Map(
			data.todayTickets
				.filter((t) => t.status === 'serving' && t.doctorId !== null)
				.map((t) => [t.doctorId, t])
		)
	);

	let now = $state(Date.now());

	$effect(() => {
		const timer = setInterval(() => {
			now = Date.now();
			invalidateAll();
		}, 30_000);
		return () => clearInterval(timer);
	});
</script>

<svelte:head><title>Walk-in queue · ClinicQ</title></svelte:head>

<h1>Walk-in queue</h1>
<p class="subtitle">{formatDay(data.today)}. Ticket numbers continue from the last ticket issued, including yesterday's.</p>

{#if form?.issued}
	<Flash kind="ok">
		Ticket <strong>{form.issued.code}</strong> for {form.issued.patientName}. Estimated wait: {formatWait(form.issued.estWaitMinutes)}.
	</Flash>
{:else if form?.called}
	<Flash kind="info">{form.called.code} {form.called.patientName}, please go to {form.called.doctorName}.</Flash>
{:else if form?.error}
	<Flash kind="error">{form.error}</Flash>
{/if}

<div class="stats">
	<div class="stat"><div class="value" data-testid="waiting-count">{waitingCount}</div><div class="label">Waiting</div></div>
	<div class="stat"><div class="value">{seenCount}</div><div class="label">Seen today</div></div>
	<div class="stat"><div class="value">{noShowCount}</div><div class="label">Not here when called</div></div>
</div>

<div class="layout">
	<section class="card">
		<h2>New walk-in</h2>
		<form method="POST" action="?/issue" use:enhance>
			<label for="patientName">Patient name</label>
			<input id="patientName" name="patientName" required />
			<label for="phone">Phone number</label>
			<input id="phone" name="phone" type="tel" placeholder="0803 123 4567" required />
			<label for="reason">Reason for visit</label>
			<input id="reason" name="reason" placeholder="e.g. fever, BP check" />
			<p><button class="btn" type="submit">Issue ticket</button></p>
		</form>
	</section>

	<div>
		<section class="card">
			<h2>Doctors</h2>
			<table>
				<tbody>
					{#each data.doctors as doctor (doctor.id)}
						{@const current = servingBy.get(doctor.id)}
						<tr data-doctor-id={doctor.id}>
							<td><strong>{doctor.name}</strong><br /><span class="muted">{doctor.room}</span></td>
							<td>
								{#if current}
									<span class="ticket-code">{current.code}</span> {current.patientName}
								{:else}
									<span class="muted">Free</span>
								{/if}
							</td>
							<td class="actions">
								{#if current}
									<form method="POST" action="?/finish" use:enhance>
										<input type="hidden" name="id" value={current.id} />
										<button class="btn small" type="submit">Done</button>
									</form>
									<form method="POST" action="?/noShow" use:enhance>
										<input type="hidden" name="id" value={current.id} />
										<button class="btn small danger" type="submit">Not here</button>
									</form>
								{:else}
									<form method="POST" action="?/call" use:enhance>
										<input type="hidden" name="doctorId" value={doctor.id} />
										<button class="btn small" type="submit">Call next</button>
									</form>
								{/if}
							</td>
						</tr>
					{:else}
						<tr><td class="empty">No doctor is on duty today.</td></tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="card">
			<h2>Waiting</h2>
			<table data-testid="waiting-list">
				<thead>
					<tr><th>Ticket</th><th>Patient</th><th>Reason</th><th>Waiting</th><th>Estimated wait</th><th></th></tr>
				</thead>
				<tbody>
					{#each waiting as ticket (ticket.id)}
						<tr data-ticket-id={ticket.id}>
							<td class="ticket-code">{ticket.code}</td>
							<td>{ticket.patientName}<br /><span class="muted">{formatPhone(ticket.phone)}</span></td>
							<td>{ticket.reason}</td>
							<td>{waitingSince(ticket, now)} min</td>
							<td class="estimate">{formatWait(ticket.estWaitMinutes)}</td>
							<td>
								<form method="POST" action="?/noShow" use:enhance>
									<input type="hidden" name="id" value={ticket.id} />
									<button class="btn small danger" type="submit">Not here</button>
								</form>
							</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="empty">Nobody is waiting.</td></tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="card">
			<h2>Yesterday</h2>
			<table data-testid="yesterday-list">
				<thead>
					<tr><th>Ticket</th><th>Patient</th><th>Reason</th><th>Status</th></tr>
				</thead>
				<tbody>
					{#each data.yesterdayTickets as ticket (ticket.id)}
						<tr data-ticket-id={ticket.id}>
							<td class="ticket-code">{ticket.code}</td>
							<td>{ticket.patientName}<br /><span class="muted">{formatPhone(ticket.phone)}</span></td>
							<td>{ticket.reason}</td>
							<td><StatusBadge status={ticket.status} /></td>
						</tr>
					{:else}
						<tr><td colspan="4" class="empty">No tickets were issued yesterday.</td></tr>
					{/each}
				</tbody>
			</table>
		</section>
	</div>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(260px, 1fr) 2.4fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
