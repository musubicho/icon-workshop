<script lang="ts">
	import { dev } from '$app/env';
	import Hero from '#lib/Hero.svelte';
	import Icon from '#lib/Icon.svelte';
	import NewIcon from '#lib/NewIcon.svelte';
	import Segmented from '#lib/Segmented.svelte';
	import { categories, glyph, icons } from '#lib/icons.ts';
	import { prefs } from '#lib/prefs.svelte.ts';

	let query = $state('');
	let category = $state('すべて');
	let search: HTMLInputElement;

	const visible = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return icons.filter(
			(icon) => (category === 'すべて' || icon.category === category) && `${icon.name} ${icon.id} ${icon.category}`.toLowerCase().includes(q)
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
	<title>Nyatabi Icons · 旅の小さなことを、アイコンにする</title>
	<meta name="description" content="Nyatabi の帳簿と旅程で使う、丸みのある線のアイコン。SVG 原稿と iOS アセットの書き出し。" />
</svelte:head>

<Hero />

<div class="toolbar" id="icons">
	<div class="wrap row">
		<label class="search">
			<Icon markup={glyph('search')} size={22} glyph />
			<input bind:this={search} bind:value={query} type="search" placeholder="アイコンを探す：ラーメン、ramen、電車…" aria-label="アイコンを検索" />
			<kbd class="mono-text">/</kbd>
		</label>
		<div class="chips" role="group" aria-label="分類">
			{#each [{ name: 'すべて', count: icons.length }, ...categories] as item (item.name)}
				<button type="button" aria-pressed={category === item.name} onclick={() => (category = item.name)}>
					{item.name} <span class="mono-text">{item.count}</span>
				</button>
			{/each}
		</div>
		<Segmented
			label="アイコンのスタイル"
			value={prefs.mono ? 'mono' : 'color'}
			options={[
				{ id: 'color', label: 'カラー' },
				{ id: 'mono', label: 'モノクロ' }
			]}
			select={(id) => (prefs.mono = id === 'mono')}
		/>
		{#if dev}<NewIcon />{/if}
	</div>
</div>

<main class="wrap shelf">
	<div class="shelf-head">
		<h2>{category === 'すべて' ? 'すべてのアイコン' : category}</h2>
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
		<p class="empty">見つかりません。別の言葉で試してください。</p>
	{/if}
</main>

<section class="usage">
	<div class="wrap usage-grid">
		<div><span class="mono-text">01 · WEB</span><strong>SVG をコピー</strong><p>48 × 48 のグリッド、線幅 2.4。そのままコンポーネントに貼れます。</p></div>
		<div><span class="mono-text">02 · iOS</span><strong>.xcassets を書き出す</strong><p>カラーはダーク表示付き。モノクロは template 描画で tint に従います。</p></div>
		<div><span class="mono-text">03 · SOURCE</span><strong>手元で磨く</strong><p><code class="mono-text">pnpm dev</code> で工房モードを開き、編集は icons/ に書き戻します。</p></div>
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
