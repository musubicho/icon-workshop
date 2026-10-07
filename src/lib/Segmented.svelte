<script lang="ts">
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
	let group: HTMLDivElement;
	let position = $state<{ x: number; width: number }>();

	$effect(() => {
		value;
		options;
		const measure = () => {
			const active = group.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
			position = active ? { x: active.offsetLeft, width: active.offsetWidth } : undefined;
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(group);
		group.querySelectorAll('button').forEach((button) => observer.observe(button));
		return () => observer.disconnect();
	});
</script>

<div bind:this={group} class="segmented" role="group" aria-label={label}>
	{#if position}
		<span class="segment-indicator" aria-hidden="true" style:transform="translateX({position.x}px)" style:width="{position.width}px"></span>
	{/if}
	{#each options as option (option.id)}
		<button
			type="button"
			aria-pressed={value === option.id}
			onclick={() => {
				if (value === option.id) return;
				select(option.id);
			}}
		>
			{option.label}
		</button>
	{/each}
</div>
