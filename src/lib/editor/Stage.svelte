<script lang="ts">
	import Icon from '../Icon.svelte';
	import { glyphs } from './glyphs.ts';
	import Overlays from './Overlays.svelte';
	import SourcePanel from './SourcePanel.svelte';
	import { cancelDrag, down, move, up, wheel } from './pointer.svelte.ts';
	import type { EditorState } from './state.svelte.ts';

	let { s }: { s: EditorState } = $props();

	const HINTS: Record<string, string> = {
		select: 'スペースで移動 · スクロールで拡大 · Shift で向きをそろえる · Alt でスナップを外す',
		node: 'アンカーとハンドルをドラッグ · Alt でハンドルを切り離す · 矢印キーで微調整',
		pen: 'クリックで点を足す · ドラッグで曲線 · Enter で確定 · 始点をクリックで閉じる',
		hand: 'ドラッグで移動 · スクロールで拡大',
	};
</script>

<div class="stage-row">
	<div class="stage">
		<div class="stage-bar">
			<span class="mode"
				>{s.tool === 'node' ? 'ノード編集' : s.tool === 'pen' ? 'ペン' : 'アートボード'}
				<small>{s.viewBox[2]} × {s.viewBox[3]}</small></span
			>
			<div class="segmented aids" role="group" aria-label="補助表示">
				<button aria-pressed={s.grid} onclick={() => (s.grid = !s.grid)}>グリッド</button><button
					aria-pressed={s.snap}
					onclick={() => (s.snap = !s.snap)}>スナップ</button
				><button aria-pressed={s.guides} onclick={() => (s.guides = !s.guides)}>キーライン</button>
			</div>
		</div>
		<div class="viewport" class:panning={s.space || s.tool === 'hand'}>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<svg
				class="canvas"
				bind:this={s.svg}
				viewBox={s.zoomView}
				aria-label="SVG 編集キャンバス"
				role="img"
				onpointerdown={(e) => down(s, e)}
				onpointermove={(e) => move(s, e)}
				onpointerup={() => up(s)}
				onpointercancel={() => cancelDrag(s)}
				onwheel={(e) => wheel(s, e)}
			>
				<defs
					><pattern id="atelier-grid" width="1" height="1" patternUnits="userSpaceOnUse"
						><path d="M1 0H0V1" fill="none" stroke="#e6dccf" stroke-width=".04" /></pattern
					><pattern id="atelier-grid-4" width="4" height="4" patternUnits="userSpaceOnUse"
						><path d="M4 0H0V4" fill="none" stroke="#d5c8b8" stroke-width=".07" /></pattern
					></defs
				>
				<rect
					x={s.viewBox[0] - 1}
					y={s.viewBox[1] - 1}
					width={s.viewBox[2] + 2}
					height={s.viewBox[3] + 2}
					rx="1.2"
					fill="#fffdf9"
					class="paper"
				/>
				{#if s.grid}<g pointer-events="none"
						><rect x={s.viewBox[0]} y={s.viewBox[1]} width={s.viewBox[2]} height={s.viewBox[3]} fill="url(#atelier-grid)" /><rect
							x={s.viewBox[0]}
							y={s.viewBox[1]}
							width={s.viewBox[2]}
							height={s.viewBox[3]}
							fill="url(#atelier-grid-4)"
						/></g
					>{/if}
				{@html s.art}
				{#if s.guides}<g
						pointer-events="none"
						fill="none"
						stroke="#8A6200"
						stroke-opacity=".35"
						stroke-width={0.08 / s.zoom}
						stroke-dasharray=".5 .5"
						><path
							d={`M${s.viewBox[0] + s.viewBox[2] / 2} ${s.viewBox[1]}v${s.viewBox[3]}M${s.viewBox[0]} ${s.viewBox[1] + s.viewBox[3] / 2}h${s.viewBox[2]}`}
						/></g
					>{/if}
				<Overlays {s} />
			</svg>
		</div>
		<div class="stage-foot">
			<div class="messages">
				<span class="statusbar" class:error={!!s.error} role="status">{s.error || s.status}</span>
				<span>{HINTS[s.tool] ?? 'ドラッグで描く · Shift で縦横比を保つ · Alt で中心から'}</span>
			</div>
			<div class="zoom" role="group" aria-label="拡大率">
				<button class="round" onclick={() => s.setZoom(s.zoom / 1.25)} aria-label="縮小"
					><Icon markup={glyphs.minus} size={16} /></button
				><span>{Math.round(s.zoom * 100)}%</span><button class="round" onclick={() => s.setZoom(s.zoom * 1.25)} aria-label="拡大"
					><Icon markup={glyphs.plus} size={16} /></button
				>
			</div>
		</div>
	</div>
	{#if s.showCode}<SourcePanel {s} />{/if}
</div>

<style>
	.stage {
		position: relative;
		min-height: 240px;
		border-radius: 32px;
		background: var(--sunken);
		overflow: hidden;
	}
	.stage-bar,
	.stage-foot {
		position: absolute;
		left: 14px;
		right: 14px;
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		pointer-events: none;
	}
	.stage-bar {
		top: 14px;
	}
	.stage-foot {
		bottom: 14px;
		align-items: flex-end;
	}
	.stage-bar > *,
	.zoom {
		pointer-events: auto;
	}
	.mode {
		padding: 6px 12px;
		border-radius: 999px;
		background: var(--surface);
		font-size: 13px;
		font-weight: 700;
		color: var(--body);
	}
	.mode small {
		font: 12px var(--mono);
		color: var(--muted);
	}
	.aids {
		background: color-mix(in srgb, var(--paper) 70%, transparent);
	}
	.viewport {
		position: absolute;
		inset: 0;
		touch-action: none;
	}
	.canvas {
		width: 100%;
		height: 100%;
		display: block;
		touch-action: none;
		user-select: none;
	}
	.canvas :global([data-editor-key]:not(svg)) {
		cursor: move;
	}
	.panning .canvas,
	.panning .canvas :global(*) {
		cursor: grab;
	}
	.paper {
		filter: drop-shadow(0 0.6px 1.2px #453d3524);
	}
	.messages {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 13px;
		color: var(--muted);
	}
	.statusbar {
		color: var(--body);
		font-weight: 700;
	}
	.statusbar.error {
		color: var(--accent-ink);
	}
	.zoom {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 3px;
		border-radius: 999px;
		background: var(--surface);
		box-shadow: var(--shadow);
	}
	.zoom .round {
		width: 38px;
		min-height: 38px;
	}
	.zoom span {
		min-width: 52px;
		text-align: center;
		font: 13px var(--mono);
	}
	.stage-row {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.stage-row > .stage {
		flex: 999 1 360px;
		min-width: 0;
	}
	@media (max-width: 640px) {
		.aids {
			display: none;
		}
	}
</style>
