<script lang="ts">
	import {
		breakPoint,
		movePoint,
		number as num,
		pointKind,
		splitSegment,
		toggleClosed,
		type Command,
		type Point,
	} from './document.ts';

	let {
		tool,
		pathCommands,
		nodeIndex = $bindable(),
		smooth = $bindable(),
		choose,
		editPath,
		remove,
	}: {
		tool: string;
		pathCommands: Command[];
		nodeIndex: number;
		smooth: boolean;
		choose: (tool: string) => void;
		editPath: (fn: (cs: Command[]) => void) => void;
		remove: () => void;
	} = $props();
</script>

<section>
	<h3>パスとノード</h3>
	<button class="outlined wide" class:inked={tool === 'node'} onclick={() => choose('node')}>ノードを編集</button
	><label class="node-picker"
		>選択中のアンカー<select aria-label="選択中のアンカー" bind:value={nodeIndex}
			><option value={-1}>ノードを選ぶ…</option>{#each pathCommands as c, i}{#if 'x' in c}<option value={i}
						>ノード {i + 1} · {num(c.x)}, {num(c.y)}</option
					>{/if}{/each}</select
		></label
	>
	{#if nodeIndex >= 0 && pathCommands[nodeIndex] && 'x' in pathCommands[nodeIndex]}{@const point =
			pathCommands[nodeIndex] as Point}
		<div class="fields">
			{#each ['x', 'y'] as axis (axis)}<label class="field"
					><span>{axis.toUpperCase()}</span><input
						type="number"
						step="0.1"
						aria-label={`ノードの ${axis.toUpperCase()}`}
						value={point[axis as keyof Point]}
						onchange={(e) => {
							const value = Number(e.currentTarget.value);
							if (Number.isFinite(value))
								editPath((cs) => {
									const c = cs[nodeIndex];
									if ('x' in c) movePoint(cs, nodeIndex, 'anchor', { x: c.x, y: c.y, [axis]: value });
								});
						}}
					/></label
				>{/each}
		</div>{/if}
	<label class="check"><input type="checkbox" bind:checked={smooth} /> 反対側のハンドルも動かす</label>
	<div class="actions">
		<button
			class="outlined"
			disabled={nodeIndex < 1 || pathCommands[nodeIndex]?.type === 2}
			onclick={() => editPath((cs) => splitSegment(cs, nodeIndex))}>区間を分ける</button
		><button class="outlined" disabled={nodeIndex < 0} onclick={() => editPath((cs) => pointKind(cs, nodeIndex, true))}
			>なめらか</button
		><button class="outlined" disabled={nodeIndex < 0} onclick={() => editPath((cs) => pointKind(cs, nodeIndex, false))}
			>かど</button
		><button class="outlined" disabled={nodeIndex < 0} onclick={() => editPath((cs) => breakPoint(cs, nodeIndex))}
			>ここで切る</button
		><button class="outlined" onclick={() => editPath((cs) => toggleClosed(cs, Math.max(0, nodeIndex)))}
			>開く / 閉じる</button
		><button class="outlined danger" disabled={nodeIndex < 0} onclick={remove}>ノードを削除</button>
	</div>
	<small>アンカーを選ぶと、「区間を分ける」はその手前の区間に中点を足します。</small>
</section>

<style>
	.actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}
	.actions button {
		padding: 0 10px;
		font-size: 13px;
	}
	.danger {
		color: var(--accent-ink);
	}
</style>
