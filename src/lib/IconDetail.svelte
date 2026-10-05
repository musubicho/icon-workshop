<script lang="ts">
	import { untrack } from 'svelte';
	import { dev } from '$app/env';
	import Icon from './Icon.svelte';
	import IconStage from './IconStage.svelte';
	import { glyph, icons, type Icon as IconData } from './icons.ts';
	import { exportSvg, themable } from './svg.ts';

	let { icon }: { icon: IconData } = $props();

	let source = $state(untrack(() => icon.svg));
	let current = $state(false);
	let status = $state('');

	const markup = $derived(themable(source));
	const output = $derived(exportSvg(source, current ? 'current' : 'duo'));
	const related = $derived(icons.filter((item) => item.category === icon.category && item.id !== icon.id).slice(0, 8));
	function announce(message: string) {
		status = message;
		setTimeout(() => (status = ''), 2000);
	}

	async function copy(text: string, message: string) {
		try {
			await navigator.clipboard.writeText(text);
			announce(message);
		} catch {
			announce('浏览器拒绝了剪贴板访问。');
		}
	}

	function download() {
		const url = URL.createObjectURL(new Blob([output], { type: 'image/svg+xml' }));
		const link = Object.assign(document.createElement('a'), { href: url, download: `${icon.id}${current ? '-mono' : ''}.svg` });
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
</script>

<nav class="wrap crumbs" aria-label="位置">
	<a href="/#icons">图标</a><span aria-hidden="true">/</span><span>{icon.category}</span><span aria-hidden="true">/</span><span aria-current="page">{icon.name}</span>
</nav>

<main class="wrap detail">
	<IconStage id={icon.id} name={icon.name} {markup} />

	<aside class="info">
		<div class="title">
			<span class="chip">{icon.category}</span>
			<h1>{icon.name}</h1>
			<span class="mono-text id">{icon.id} · musubi-{icon.id}</span>
			{#if icon.desc}<p>{icon.desc}</p>{/if}
		</div>
		<div class="segmented" role="group" aria-label="导出样式">
			<button type="button" aria-pressed={!current} onclick={() => (current = false)}>原色</button>
			<button type="button" aria-pressed={current} onclick={() => (current = true)}>单色 currentColor</button>
		</div>
		<div class="actions">
			<button type="button" class="button primary" onclick={() => copy(output, '已复制 SVG。')}>
				<Icon markup={glyph('copy')} size={22} glyph />复制 SVG
			</button>
			<div class="pair">
				<button type="button" class="button" onclick={download}><Icon markup={glyph('download')} size={20} glyph />下载 SVG</button>
				<button type="button" class="button" onclick={() => copy(location.href, '已复制链接。')}>
					<Icon markup={glyph('link')} size={20} glyph />复制链接
				</button>
			</div>
			<p class="status" role="status">{status}</p>
		</div>
		{#if dev}
			{#await import('./Editor.svelte') then { default: Editor }}
				<Editor id={icon.id} base={icon.svg} bind:source />
			{/await}
		{:else}
			<pre class="mono-text">{output}</pre>
		{/if}
		{#if related.length}
			<div class="related">
				<span class="label">同一册里</span>
				<div>
					{#each related as item (item.id)}
						<a href="/icon/{item.id}" aria-label={item.name}><Icon markup={item.markup} size={40} /></a>
					{/each}
				</div>
			</div>
		{/if}
	</aside>
</main>

<style>
	.crumbs {
		display: flex;
		gap: 8px;
		font-size: 14px;
		color: var(--muted);
	}

	.crumbs a {
		color: var(--muted);
	}

	.crumbs [aria-current] {
		color: var(--ink);
	}

	.detail {
		display: flex;
		flex-wrap: wrap;
		gap: 40px;
		padding-block: 16px 72px;
	}

	.label {
		font-size: 14px;
		font-weight: 700;
		color: var(--body);
	}

	.info {
		flex: 1 1 340px;
		min-width: 0;
		max-width: 420px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.title {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.chip {
		align-self: flex-start;
		font-size: 13px;
		font-weight: 700;
		color: var(--gold-ink);
		background: var(--gold-wash);
		padding: 4px 10px;
		border-radius: 999px;
	}

	h1 {
		margin: 0;
		font-size: 48px;
		font-weight: 900;
		line-height: 1.15;
	}

	.id {
		font-size: 15px;
		color: var(--muted);
	}

	.title p {
		margin: 8px 0 0;
		font-size: 16px;
		line-height: 1.7;
		color: var(--body);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.actions > .primary {
		min-height: 52px;
		font-size: 16px;
	}

	.pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.status {
		min-height: 20px;
		margin: 0;
		font-size: 14px;
		color: var(--muted);
	}

	pre {
		margin: 0;
		padding: 16px;
		max-height: 320px;
		overflow: auto;
		border-radius: 16px;
		background: var(--code-bg);
		color: var(--code-ink);
		font-size: 12px;
		line-height: 1.65;
	}

	.related div {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		margin-top: 12px;
	}

	.related a {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		border-radius: 16px;
		background: var(--surface);
		border: 1px solid var(--sunken);
	}
</style>
