<script lang="ts">
	import Icon from '../Icon.svelte';

	let { markup }: { markup: string } = $props();

	const variants = [
		{ tone: 'light', mono: false, label: 'カラー · ライト' },
		{ tone: 'light', mono: true, label: 'モノクロ · ライト' },
		{ tone: 'dark', mono: false, label: 'カラー · ダーク' },
		{ tone: 'dark', mono: true, label: 'モノクロ · ダーク' },
	];
</script>

<section class="previews" aria-label="実寸プレビュー">
	{#each variants as item (item.label)}<figure class={['preview', item.tone, item.mono && 'mono']}>
			<div>
				{#each [16, 24, 48] as size (size)}<span><Icon {markup} {size} /><small>{size}</small></span>{/each}
			</div>
			<figcaption>{item.label}</figcaption>
		</figure>{/each}
</section>

<style>
	.previews {
		flex-shrink: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}
	.preview {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px 18px 12px;
		border-radius: 20px;
		background: #fffdf9;
		border: 1px solid #ede4d9;
		color: #6f6861;
	}
	.preview.dark {
		background: #221c18;
		border-color: #3d342e;
		color: #b8ac9e;
	}
	.preview > div {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 8px;
		min-height: 48px;
	}
	span {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}
	small {
		font: 10px var(--mono);
	}
	figcaption {
		font: 11px var(--mono);
	}
	@media (max-width: 1240px) {
		.previews {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 640px) {
		.previews {
			display: none;
		}
	}
</style>
