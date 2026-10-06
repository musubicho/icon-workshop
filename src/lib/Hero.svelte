<script lang="ts">
	import Icon from './Icon.svelte';
	import { glyph, icons } from './icons.ts';
	import { prefs } from './prefs.svelte.ts';

	const stickers = [
		{ id: 'ramen', size: 52, style: 'left: 24px; top: 40px; --tilt: -8deg' },
		{ id: 'plane', size: 46, style: 'right: 8px; top: 8px; --tilt: 7deg' },
		{ id: 'receipt', size: 44, style: 'right: 0; top: 200px; --tilt: -5deg' },
		{ id: 'onigiri', size: 44, style: 'left: 0; top: 230px; --tilt: 6deg' }
	];
</script>

<section class="wrap hero">
	<div class="copy">
		<span class="pill mono-text">{icons.length} ICONS · SVG · iOS ASSET CATALOG</span>
		<h1>旅の小さなことを、<br /><em>アイコンにする。</em></h1>
		<p>Nyatabi の帳簿と旅程で使う、同じ丸みのある線のアイコン。ラーメン、電車、割り勘、レシート。SVG をコピーしてそのまま使うか、Xcode のアセットを一度に書き出します。</p>
		<div class="actions">
			<a class="button primary" href="#icons">すべてのアイコンを見る</a>
			<a class="button" href="/MusubiIcons-{prefs.mono ? 'mono' : 'duo'}.zip" download>
				<Icon markup={glyph('device')} size={22} glyph />
				iOS アセットを書き出す
			</a>
		</div>
	</div>
	<div class="art" aria-hidden="true">
		<div class="backdrop"></div>
		<img src="/brand/cat-suitcase.webp" alt="" width="300" height="322" />
		{#each stickers as sticker (sticker.id)}
			<span class="sticker" style={sticker.style}>
				<Icon markup={glyph(sticker.id)} size={sticker.size} />
			</span>
		{/each}
	</div>
</section>

<style>
	.hero {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 48px;
		padding-block: 40px 64px;
	}

	.copy {
		flex: 1 1 480px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 22px;
	}

	.pill {
		align-self: flex-start;
		font-size: 13px;
		letter-spacing: 0.08em;
		color: var(--gold-ink);
		background: var(--gold-wash);
		padding: 6px 12px;
		border-radius: 999px;
	}

	h1 {
		margin: 0;
		font-size: clamp(40px, 6vw, 60px);
		line-height: 1.12;
		font-weight: 900;
		text-wrap: balance;
	}

	em {
		font-style: normal;
		color: var(--accent);
	}

	p {
		margin: 0;
		max-width: 30em;
		font-size: 19px;
		line-height: 1.7;
		color: var(--body);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 6px;
	}

	.art {
		flex: 1 1 420px;
		min-width: 0;
		position: relative;
		height: 420px;
	}

	.backdrop {
		position: absolute;
		inset: 30px 20px 0 40px;
		border-radius: 40px;
		background: var(--sunken);
	}

	.art img {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: 300px;
		height: auto;
		transform: translateX(-50%);
	}

	.sticker {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 84px;
		height: 84px;
		border-radius: 24px;
		background: var(--surface);
		box-shadow: var(--shadow);
		transform: rotate(var(--tilt));
	}

	@media (max-width: 640px) {
		.art {
			height: 260px;
		}

		.art img {
			width: 180px;
		}

		.sticker {
			width: 64px;
			height: 64px;
			border-radius: 18px;
			scale: 0.8;
		}
	}
</style>
