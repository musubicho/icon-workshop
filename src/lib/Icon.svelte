<script lang="ts">
	let { markup, size = 48, glyph = false, class: className = '' }: { markup: string; size?: number; glyph?: boolean; class?: string } = $props();
</script>

<span class={['icon', glyph && 'glyph', className]} style:width="{size}px" style:height="{size}px">{@html markup}</span>

<style>
	.icon {
		display: inline-block;
		flex: none;
	}

	.icon :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
