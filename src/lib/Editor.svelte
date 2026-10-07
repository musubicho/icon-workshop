<script lang="ts">
	import { onMount, untrack } from 'svelte';
	let { id, base: initial, source = $bindable() }: { id: string; base: string; source: string } = $props();
	let base = $state(untrack(() => initial));
	let open = $state(false);
	let dialog: HTMLDialogElement;
	onMount(() => {
		if (new URLSearchParams(location.search).has('edit')) launch();
	});
	function launch() {
		open = true;
		dialog.showModal();
	}
	function close() {
		open = false;
		dialog.close();
	}
</script>

<div class="editor-entry">
	<span>LOCAL ATELIER</span>
	<h2>Refine every little detail.</h2>
	<p>Shapes, paths, and Bézier nodes. Edit the original SVG on the canvas.</p>
	<button class="button primary" onclick={launch}>Open editor <span aria-hidden="true">↗</span></button>
</div>
<dialog bind:this={dialog} oncancel={(e) => e.preventDefault()} aria-label="SVG icon editor">
	{#if open}
		{#await import('./editor/Workbench.svelte') then { default: Workbench }}
			<Workbench
				{id}
				initial={base}
				onclose={close}
				onsave={(svg) => {
					base = svg;
					source = svg;
				}}
			/>
		{:catch error}
			<p>Editor could not load: {error.message}</p>
			<button onclick={close}>Close</button>
		{/await}
	{/if}
</dialog>

<style>
	.editor-entry {
		padding: 22px;
		border: 1px solid var(--line);
		border-radius: 16px;
		background: var(--surface);
	}
	.editor-entry > span {
		font: 10px var(--mono);
		letter-spacing: 1.5px;
		color: var(--accent-ink);
	}
	h2 {
		font-size: 21px;
		margin: 12px 0 8px;
	}
	p {
		color: var(--muted);
		font-size: 13px;
		line-height: 1.7;
		margin: 0 0 20px;
	}
	.button {
		width: 100%;
		justify-content: space-between;
	}
	dialog {
		padding: 0;
		border: 0;
		max-width: none;
		max-height: none;
	}
	dialog::backdrop {
		background: var(--paper);
	}
</style>
