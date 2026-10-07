<script lang="ts">
	import Icon from '../Icon.svelte';
	import { glyph } from '../icons.ts';
	import { glyphs } from './glyphs.ts';
	import type { EditorState } from './state.svelte.ts';

	let { s, onclose, onsave, onexport }: { s: EditorState; onclose: () => void; onsave: () => void; onexport: () => void } =
		$props();
</script>

<header class="topbar">
	<button class="round outlined" onclick={onclose} aria-label="エディタを閉じる"><Icon markup={glyphs.back} size={22} /></button>
	<div class="badge"><Icon markup={s.preview} size={38} /></div>
	<div class="identity">
		<span class="chips"
			>{#if s.root.attrs['data-category']}<span class="chip">{s.root.attrs['data-category']}</span>{/if}<span
				class="eyebrow">工房モード</span
			></span
		>
		<span class="name"
			><h1>{s.title}</h1>
			<span class:unsaved={s.dirty}>{s.id} · {s.dirty ? '未保存の変更あり' : '保存済み'}</span></span
		>
	</div>
	<div class="history" inert={!!s.recovery}>
		<button class="round" disabled={!s.undo.length} onclick={() => s.history()} aria-label="取り消す" title="取り消す · ⌘Z"
			><Icon markup={glyph('undo')} size={20} glyph /></button
		><button
			class="round"
			disabled={!s.redo.length}
			onclick={() => s.history(false)}
			aria-label="やり直す"
			title="やり直す · ⇧⌘Z"><Icon markup={glyph('undo')} size={20} glyph class="mirror" /></button
		>
	</div>
	<div class="actions" inert={!!s.recovery}>
		<button class="outlined" class:inked={s.showCode} aria-pressed={s.showCode} onclick={() => (s.showCode = !s.showCode)}
			><Icon markup={glyphs.code} size={20} />ソース</button
		>
		<div class="export">
			<select aria-label="書き出し形式" bind:value={s.exportFormat}
				><option value="svg">SVG · カラー</option><option value="mono">SVG · currentColor</option><option value="ios"
					>iOS · カラー</option
				><option value="ios-mono">iOS · モノクロ</option></select
			><button disabled={!!s.error} onclick={onexport}><Icon markup={glyph('download')} size={20} glyph />書き出す</button>
		</div>
		<button class="save" disabled={s.saving || !s.dirty || !!s.error} onclick={onsave}
			>{s.saving ? '保存中…' : '保存する'} <kbd>⌘S</kbd></button
		>
	</div>
</header>

<style>
	.topbar {
		flex-shrink: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 14px;
	}
	.topbar > .round {
		width: 48px;
		min-height: 48px;
	}
	.badge {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border-radius: 18px;
		background: var(--surface);
		border: 1px solid var(--sunken);
		box-shadow: var(--shadow);
		rotate: -6deg;
	}
	.identity {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.chips,
	.name {
		display: flex;
		align-items: baseline;
		gap: 10px;
		min-width: 0;
	}
	.chips {
		align-items: center;
		gap: 8px;
	}
	.eyebrow {
		font: 11px var(--mono);
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	h1 {
		margin: 0;
		font-size: 26px;
		font-weight: 900;
		line-height: 1.1;
		white-space: nowrap;
	}
	.name > span {
		font: 13px var(--mono);
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.name > .unsaved {
		color: var(--accent-ink);
	}
	.history {
		display: flex;
		gap: 2px;
		padding: 2px;
		border-radius: 999px;
		background: var(--surface);
		border: 1px solid var(--line);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
	.actions > button {
		min-height: 48px;
	}
	.export {
		display: flex;
		align-items: center;
		min-height: 48px;
		padding-left: 16px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
	}
	.export select {
		border: 0;
		background: transparent;
		color: var(--body);
		font-weight: 700;
	}
	.export button {
		min-height: 46px;
		margin-left: 6px;
		border-left-color: var(--line);
		border-radius: 0 999px 999px 0;
	}
	.save {
		padding: 0 22px;
		font-size: 15px;
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	.save:hover:not(:disabled) {
		background: var(--accent-ink);
	}
	kbd {
		font: 11px var(--mono);
		border: 1px solid currentColor;
		border-radius: 6px;
		padding: 1px 5px;
		opacity: 0.7;
	}
	@media (max-width: 980px) {
		.badge,
		.history,
		kbd {
			display: none;
		}
	}
	@media (max-width: 640px) {
		h1 {
			font-size: 20px;
		}
		.export select {
			display: none;
		}
	}
</style>
