<script lang="ts">
	import { dev } from '$app/env';
	import Hero from '#lib/Hero.svelte';
	import Icon from '#lib/Icon.svelte';
	import NewIcon from '#lib/NewIcon.svelte';
	import { categories, glyph, icons } from '#lib/icons.ts';
	import { prefs } from '#lib/prefs.svelte.ts';

	let query = $state('');
	let category = $state('全部');
	let search: HTMLInputElement;

	const visible = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return icons.filter(
			(icon) => (category === '全部' || icon.category === category) && `${icon.name} ${icon.id} ${icon.category}`.toLowerCase().includes(q)
		);
	});

	function focusSearch(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (event.key !== '/' || target.closest('input, textarea, [contenteditable]')) return;
		event.preventDefault();
		search.focus();
	}
</script>

<svelte:window onkeydown={focusSearch} />
<svelte:head>
	<title>Nyatabi Icons · 把旅途里的小事，画成图标</title>
	<meta name="description" content="Nyatabi 账本和行程里用的圆润线条图标：SVG 源稿与 iOS 资源导出。" />
</svelte:head>

<Hero />

<div class="toolbar" id="icons">
	<div class="wrap row">
		<label class="search">
			<Icon markup={glyph('search')} size={22} glyph />
			<input bind:this={search} bind:value={query} type="search" placeholder="找一枚图标：拉面、ramen、电车…" aria-label="搜索图标" />
			<kbd class="mono-text">/</kbd>
		</label>
		<div class="chips" role="group" aria-label="分类">
			{#each [{ name: '全部', count: icons.length }, ...categories] as item (item.name)}
				<button type="button" aria-pressed={category === item.name} onclick={() => (category = item.name)}>
					{item.name} <span class="mono-text">{item.count}</span>
				</button>
			{/each}
		</div>
		<div class="segmented" role="group" aria-label="图标样式">
			<button type="button" aria-pressed={!prefs.mono} onclick={() => (prefs.mono = false)}>原色</button>
			<button type="button" aria-pressed={prefs.mono} onclick={() => (prefs.mono = true)}>单色</button>
		</div>
		{#if dev}<NewIcon />{/if}
	</div>
</div>

<main class="wrap shelf">
	<div class="shelf-head">
		<h2>{category === '全部' ? '全部图标' : category}</h2>
		<span class="mono-text">{visible.length} / {icons.length}</span>
	</div>
	{#if visible.length}
		<div class={['grid', prefs.mono && 'mono']}>
			{#each visible as icon (icon.id)}
				<a class="card" href="/icon/{icon.id}">
					<Icon markup={icon.markup} />
					<strong>{icon.name}</strong>
					<span class="mono-text">{icon.id}</span>
				</a>
			{/each}
		</div>
	{:else}
		<p class="empty">还没有这一枚。试试其他关键词。</p>
	{/if}
</main>

<section class="usage">
	<div class="wrap usage-grid">
		<div><span class="mono-text">01 · WEB</span><strong>复制 SVG</strong><p>48 × 48 网格，2.4 描边，直接贴进组件。</p></div>
		<div><span class="mono-text">02 · iOS</span><strong>导出 .xcassets</strong><p>原色带深色外观；单色走 template 渲染，跟随 tint。</p></div>
		<div><span class="mono-text">03 · SOURCE</span><strong>本地打磨</strong><p><code class="mono-text">pnpm dev</code> 打开工坊模式，编辑后写回 icons/。</p></div>
	</div>
</section>

<style>
	.toolbar {
		position: sticky;
		top: 0;
		z-index: 2;
		background: color-mix(in srgb, var(--paper) 92%, transparent);
		backdrop-filter: blur(12px);
		border-block: 1px solid var(--line);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		padding-block: 14px;
	}

	.search {
		flex: 1 1 280px;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		height: 48px;
		padding: 0 16px;
		border-radius: 999px;
		background: var(--surface);
		border: 1px solid var(--line);
		color: var(--muted);
	}

	.search input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: 0;
		background: transparent;
		font-size: 16px;
		color: var(--ink);
	}

	kbd {
		font-size: 12px;
		border: 1px solid var(--line);
		border-radius: 6px;
		padding: 2px 6px;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chips button {
		min-height: 44px;
		padding: 0 16px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: transparent;
		color: var(--body);
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
	}

	.chips button:hover {
		background: var(--sunken);
	}

	.chips button[aria-pressed='true'] {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}

	.chips span {
		font-size: 12px;
		opacity: 0.7;
	}

	.shelf {
		padding-block: 28px 72px;
	}

	.shelf-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 16px;
		color: var(--muted);
		font-size: 14px;
	}

	h2 {
		margin: 0;
		font-size: 17px;
		color: var(--ink);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
		gap: 12px;
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 22px 10px 16px;
		border-radius: 20px;
		background: var(--surface);
		border: 1px solid var(--sunken);
		color: var(--ink);
		text-decoration: none;
		transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow);
	}

	.card strong {
		font-size: 15px;
	}

	.card span {
		font-size: 12px;
		color: var(--muted);
	}

	.empty {
		padding: 48px 0;
		text-align: center;
		color: var(--muted);
	}

	.usage {
		background: #2b2420;
		color: #f7f1ea;
	}

	.usage-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 32px;
		padding-block: 56px;
	}

	.usage-grid div {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.usage-grid span {
		font-size: 13px;
		color: #e0a526;
	}

	.usage-grid strong {
		font-size: 20px;
	}

	.usage-grid p {
		margin: 0;
		font-size: 15px;
		line-height: 1.7;
		color: #d9cfc3;
	}

	.usage-grid code {
		color: #ff7a5c;
	}

	@media (max-width: 640px) {
		.chips {
			flex-wrap: nowrap;
			overflow-x: auto;
			width: 100%;
		}

		.chips button {
			flex: none;
		}

		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 10px;
		}
	}
</style>
