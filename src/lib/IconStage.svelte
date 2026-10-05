<script lang="ts">
	import Icon from './Icon.svelte';

	let { id, name, markup }: { id: string; name: string; markup: string } = $props();

	const variants = [
		{ label: '原色 · 浅', tone: 'light', mono: false },
		{ label: '单色 · 浅', tone: 'light', mono: true },
		{ label: '原色 · 深', tone: 'dark', mono: false },
		{ label: '单色 · 深', tone: 'dark', mono: true }
	];
	const moments: Record<string, string> = {
		ramen: '一碗热乎的拉面',
		matcha: '街角的一杯抹茶',
		train: '坐电车去下一站',
		plane: '出发，去新的地方',
		lodging: '今晚住在这里',
		gift: '带一份小小的手信'
	};
</script>

<section class="stage">
	<div class="variants">
		{#each variants as variant (variant.label)}
			<figure class={[variant.tone, variant.mono && 'mono']}>
				<Icon {markup} size={132} />
				<figcaption class="mono-text">{variant.label}</figcaption>
			</figure>
		{/each}
	</div>
	<div class="panels">
		<div class="panel">
			<span class="label">实际尺寸</span>
			<div class="sizes">
				{#each [16, 20, 24, 32, 48] as size (size)}
					<span class="mono-text"><Icon {markup} {size} />{size}</span>
				{/each}
			</div>
		</div>
		<div class="panel">
			<span class="label">放回账本里</span>
			<div class="entry">
				<span class="entry-icon"><Icon {markup} size={32} /></span>
				<span class="entry-text"><strong>{moments[id] ?? `${name} · 一笔日常`}</strong><small>今天 12:30 · 2 人分摊</small></span>
				<strong class="mono-text">¥1,280</strong>
			</div>
		</div>
	</div>
</section>

<style>
	.stage {
		flex: 999 1 560px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.variants {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	figure {
		margin: 0;
		aspect-ratio: 1.25;
		border-radius: 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		background: #fffdf9;
		border: 1px solid #ede4d9;
	}

	figure.dark {
		background: #221c18;
		border-color: #3d342e;
	}

	figcaption {
		font-size: 12px;
		color: #6f6861;
	}

	figure.dark figcaption {
		color: #b8ac9e;
	}

	.panels {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.panel {
		flex: 1 1 300px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 20px;
		border-radius: 20px;
		background: var(--surface);
		border: 1px solid var(--sunken);
	}

	.label {
		font-size: 14px;
		font-weight: 700;
		color: var(--body);
	}

	.sizes {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
	}

	.sizes span {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		color: var(--muted);
	}

	.entry {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.entry-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 14px;
		background: var(--paper);
	}

	.entry-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.entry-text small {
		font-size: 13px;
		color: var(--muted);
	}

	@media (max-width: 640px) {
		.variants :global(.icon) {
			width: 88px !important;
			height: 88px !important;
		}
	}
</style>
