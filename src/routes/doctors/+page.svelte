<script lang="ts">
	import { enhance } from '$app/forms';
	import Flash from '$lib/components/Flash.svelte';
	import { formatNaira } from '$lib/format';

	let { data, form } = $props();
</script>

<svelte:head><title>Doctors · ClinicQ</title></svelte:head>

<h1>Doctors</h1>
<p class="subtitle">
	Consultation times set the length of appointment slots and the walk-in wait estimates.
	"Not in today" only lasts for today; everyone is back on duty the next morning.
</p>

{#if form?.error}
	<Flash kind="error">{form.error}</Flash>
{:else if form?.message}
	<Flash kind="ok">{form.message}</Flash>
{/if}

{#each data.doctors as doctor (doctor.id)}
	<section class="card" data-doctor-id={doctor.id}>
		<div class="head">
			<div>
				<h2>{doctor.name}</h2>
				<p class="muted">{doctor.specialty}, {doctor.room}. Fee {formatNaira(doctor.feeKobo)}</p>
			</div>
			<div class="duty">
				<strong class:off={!doctor.onDuty}>{doctor.onDuty ? 'On duty today' : 'Not in today'}</strong>
				{#if data.canEdit}
					<form method="POST" action="?/toggleDuty" use:enhance>
						<input type="hidden" name="id" value={doctor.id} />
						<input type="hidden" name="off" value={doctor.onDuty ? '1' : '0'} />
						<button class="btn small secondary" type="submit">
							{doctor.onDuty ? 'Mark not in today' : 'Mark back on duty'}
						</button>
					</form>
				{/if}
			</div>
		</div>

		{#if data.canEdit}
			<form method="POST" action="?/saveSchedule" use:enhance={() => async ({ update }) => update({ reset: false })}>
				<input type="hidden" name="id" value={doctor.id} />
				<div class="row">
					<div>
						<label for="minutes-{doctor.id}">Consultation (minutes)</label>
						<input id="minutes-{doctor.id}" name="consultMinutes" type="number" min="5" max="60" value={doctor.consultMinutes} />
					</div>
					<div>
						<label for="break-start-{doctor.id}">Break from</label>
						<input id="break-start-{doctor.id}" name="breakStart" type="time" value={doctor.breakStart} />
					</div>
					<div>
						<label for="break-end-{doctor.id}">Break until</label>
						<input id="break-end-{doctor.id}" name="breakEnd" type="time" value={doctor.breakEnd} />
					</div>
					<div>
						<label for="fee-{doctor.id}">Fee (₦)</label>
						<input id="fee-{doctor.id}" name="fee" inputmode="decimal" value={(doctor.feeKobo / 100).toFixed(2)} />
					</div>
					<div class="save"><button class="btn" type="submit">Save</button></div>
				</div>
			</form>
		{:else}
			<p>
				{doctor.consultMinutes} minutes per patient. Break {doctor.breakStart} to {doctor.breakEnd}.
				<span class="muted">Only the clinic manager can change this.</span>
			</p>
		{/if}
	</section>
{/each}

<style>
	.head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: start;
	}
	.duty {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.duty strong {
		color: var(--ok);
	}
	.duty strong.off {
		color: var(--bad);
	}
	.save {
		flex: 0;
	}
</style>
