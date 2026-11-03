<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="card">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Something went wrong.'}</p>
	<p><a href="/">Back to the front desk</a></p>
</div>
