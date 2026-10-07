<script lang="ts">
	import Icon from '../Icon.svelte';
	import { glyphs } from './glyphs.ts';
	import type { EditorState } from './state.svelte.ts';

	let { s }: { s: EditorState } = $props();
</script>

<section class="source-panel">
	<div class="source-heading">
		<strong>{s.id}.svg</strong>
		<span class:invalid={!!s.error}>{s.error ? '壊れています · 最後に読めた形を表示中' : 'キャンバスと同期中'}</span
		><button class="round" onclick={() => (s.showCode = false)} aria-label="ソースを閉じる"
			><Icon markup={glyphs.minus} size={16} /></button
		>
	</div>
	<textarea
		aria-label="SVG ソース"
		value={s.code}
		oninput={(e) => s.inputCode(e.currentTarget.value)}
		spellcheck="false"></textarea>
</section>

<style>
	.source-panel {
		flex: 1 1 320px;
		max-width: 420px;
		min-height: 240px;
		display: flex;
		flex-direction: column;
		border-radius: 24px;
		background: var(--code-bg);
		color: var(--code-ink);
		box-shadow: 0 24px 48px -24px rgb(0 0 0 / 0.5);
		overflow: hidden;
	}
	.source-heading {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 10px 6px 20px;
	}
	.source-heading span {
		flex: 1;
		font-size: 12px;
		font-weight: 700;
		color: #9fbc91;
	}
	.source-heading .invalid {
		color: #ff9b82;
	}
	.source-heading button:hover {
		background: rgb(255 255 255 / 0.08);
	}
	.source-panel textarea {
		flex: 1;
		resize: none;
		border: 0;
		padding: 4px 20px 20px;
		background: transparent;
		font: 12px/1.75 var(--mono);
		white-space: pre;
		tab-size: 2;
	}
	.source-panel textarea:focus-visible {
		outline: none;
	}
</style>
