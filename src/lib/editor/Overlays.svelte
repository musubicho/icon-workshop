<svelte:options namespace="svg" />

<script lang="ts">
	import type { EditorState } from './state.svelte.ts';

	let { s }: { s: EditorState } = $props();
</script>

{#if s.selectionBox && s.tool !== 'node' && s.tool !== 'pen'}{@const b = s.selectionBox}<g class="selection"
		><rect
			x={b.x}
			y={b.y}
			width={b.width}
			height={b.height}
			rx={0.3 / s.zoom}
			stroke-width={0.12 / s.zoom}
			stroke-dasharray={`${0.6 / s.zoom} ${0.4 / s.zoom}`}
			pointer-events="none"
		/><path
			d={`M${b.x + b.width / 2} ${b.y}v${-3 / s.zoom}`}
			stroke-width={0.12 / s.zoom}
			pointer-events="none"
		/><circle
			data-handle="rotate"
			cx={b.x + b.width / 2}
			cy={b.y - 3 / s.zoom}
			r={0.6 / s.zoom}
			stroke-width={0.12 / s.zoom}
		/><rect
			data-handle="scale"
			x={b.x + b.width - 0.55 / s.zoom}
			y={b.y + b.height - 0.55 / s.zoom}
			width={1.1 / s.zoom}
			height={1.1 / s.zoom}
			rx={0.55 / s.zoom}
			stroke-width={0.12 / s.zoom}
		/></g
	>{/if}
{#if s.tool === 'node'}<g class="nodes"
		>{#each s.handles as h}{#if h.part !== 'anchor'}<line
					x1={h.anchor.x}
					y1={h.anchor.y}
					x2={h.p.x}
					y2={h.p.y}
					stroke-width={0.09 / s.zoom}
					pointer-events="none"
				/><circle
					data-part={h.part}
					data-index={h.i}
					cx={h.p.x}
					cy={h.p.y}
					r={0.42 / s.zoom}
					stroke-width={0.12 / s.zoom}
				/>{/if}{/each}{#each s.handles.filter((h) => h.part === 'anchor') as h}<rect
				class:active-node={h.i === s.nodeIndex}
				data-part="anchor"
				data-index={h.i}
				x={h.p.x - 0.5 / s.zoom}
				y={h.p.y - 0.5 / s.zoom}
				width={1 / s.zoom}
				height={1 / s.zoom}
				rx={0.25 / s.zoom}
				stroke-width={0.13 / s.zoom}
			/>{/each}</g
	>{/if}
{#if s.pen.length}<g class="nodes"
		>{#each s.pen as item}<line
				x1={item.p.x}
				y1={item.p.y}
				x2={item.h.x}
				y2={item.h.y}
				stroke-width={0.1 / s.zoom}
			/><circle cx={item.p.x} cy={item.p.y} r={0.4 / s.zoom} stroke-width={0.12 / s.zoom} />{/each}</g
	>{/if}
{#if s.marquee}<rect
		{...s.marquee}
		fill="#C23B2210"
		stroke="#C23B22"
		stroke-width={0.1 / s.zoom}
		pointer-events="none"
	/>{/if}

<style>
	.selection,
	.nodes {
		fill: none;
		stroke: #c23b22;
	}
	.selection circle,
	.selection rect[data-handle],
	.nodes circle,
	.nodes rect {
		fill: #fffdf9;
		cursor: crosshair;
	}
	.nodes .active-node {
		fill: #c23b22;
	}
	.selection rect[data-handle] {
		cursor: nwse-resize;
	}
</style>
