<script lang="ts">
	import { morph } from './morph.ts';

	let {
		value,
		label,
		options,
		select
	}: {
		value: string;
		label: string;
		options: { id: string; label: string }[];
		select: (id: string) => void;
	} = $props();
</script>

<div class="segmented" role="group" aria-label={label}>
	{#each options as option (option.id)}
		<button
			type="button"
			aria-pressed={value === option.id}
			onclick={() => {
				if (value === option.id) return;
				morph(() => select(option.id));
			}}
		>
			{#if value === option.id}<span class="segment-indicator" aria-hidden="true"></span>{/if}
			{option.label}
		</button>
	{/each}
</div>
