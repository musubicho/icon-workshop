<script lang="ts">
	import Icon from '../Icon.svelte';
	import { PALETTE } from '../svg.ts';
	import DocumentSection from './DocumentSection.svelte';
	import PathSection from './PathSection.svelte';
	import SelfCheck from './SelfCheck.svelte';
	import { number as num, toPath, type Command, type Node } from './document.ts';
	import { glyphs } from './glyphs.ts';

	type Box = { x: number; y: number; width: number; height: number };
	let {
		root,
		title,
		selected,
		selectionBox,
		active,
		tool,
		pathCommands,
		nodeIndex = $bindable(),
		smooth = $bindable(),
		proportional = $bindable(),
		transform,
		align,
		attr,
		inherited,
		change,
		choose,
		editPath,
		remove,
		metadata,
	}: {
		root: Node;
		title: string;
		selected: string[];
		selectionBox: Box | null;
		active: Node | undefined;
		tool: string;
		pathCommands: Command[];
		nodeIndex: number;
		smooth: boolean;
		proportional: boolean;
		transform: (kind: string, value: number) => void;
		align: (axis: 'x' | 'y', mode: string) => void;
		attr: (name: string, value: string) => void;
		inherited: (name: string, fallback: string) => string;
		change: (fn: () => void) => void;
		choose: (tool: string) => void;
		editPath: (fn: (cs: Command[]) => void) => void;
		remove: () => void;
		metadata: (tag: string, value: string) => void;
	} = $props();

	const ROLES: Record<string, string> = { ink: '墨', accent: '朱', gold: '金', green: '抹茶' };
	const FIELDS = { x: 'X', y: 'Y', width: '幅', height: '高さ' } as const;
	const GEOMETRY = ['x', 'y', 'width', 'height', 'rx', 'ry', 'r', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2'];
	const MODES = ['start', 'center', 'end', 'distribute'] as const;
	const alignLabel = (axis: 'x' | 'y', mode: (typeof MODES)[number]) =>
		`${axis === 'x' ? '横' : '縦'} · ${{ start: axis === 'x' ? '左' : '上', center: '中央', end: axis === 'x' ? '右' : '下', distribute: '等間隔' }[mode]}`;
</script>

<aside class="properties card">
	{#if selected.length && selectionBox}
		<div class="title">
			<span class="chip accent">{active ? `${active.tag} を選択中` : `${selected.length} 個を選択中`}</span>
			<h2>{active ? active.attrs.id || active.tag : '複数の要素'}</h2>
		</div>
		<section>
			<h3>位置とサイズ</h3>
			<div class="fields">
				{#each Object.entries(FIELDS) as [field, label] (field)}<label class="field"
						><span>{label}</span><input
							type="number"
							step="0.1"
							aria-label={`選択範囲の${label}`}
							value={num(selectionBox[field as keyof Box])}
							onchange={(e) => transform(field, Number(e.currentTarget.value))}
						/></label
					>{/each}<label class="field"
					><span>回転</span><input
						type="number"
						value="0"
						step="15"
						aria-label="回転する角度"
						onchange={(e) => {
							transform('rotate', Number(e.currentTarget.value));
							e.currentTarget.value = '0';
						}}
					/></label
				><label class="check"><input type="checkbox" bind:checked={proportional} /> 縦横比を固定</label>
			</div>
			<div class="align">
				{#each ['x', 'y'] as const as axis (axis)}<div
						class="segmented"
						role="group"
						aria-label={axis === 'x' ? '横に整列' : '縦に整列'}
					>
						{#each MODES as mode (mode)}<button
								class="round"
								aria-label={alignLabel(axis, mode)}
								title={alignLabel(axis, mode)}
								disabled={mode === 'distribute' && selected.length < 3}
								onclick={() => align(axis, mode)}><Icon markup={glyphs[`${axis}-${mode}`]} size={18} /></button
							>{/each}
					</div>{/each}
			</div>
		</section>
		<section>
			{#each [{ paint: 'stroke', label: '線の色' }, { paint: 'fill', label: '塗り' }] as { paint, label } (paint)}{@const current =
					inherited(paint, paint === 'fill' ? 'none' : '#453D35').toLowerCase()}
				<h3>{label}</h3>
				<div class="swatches" role="group" aria-label={label}>
					{#each Object.entries(PALETTE) as [name, colors] (name)}<button
							class="outlined small"
							class:inked={current === colors[0].toLowerCase()}
							aria-pressed={current === colors[0].toLowerCase()}
							onclick={() => attr(paint, colors[0])}><span class="dot" style:background={colors[0]}></span>{ROLES[name]}</button
						>{/each}<button
						class="outlined small"
						class:inked={current === 'none'}
						aria-pressed={current === 'none'}
						onclick={() => attr(paint, 'none')}>なし</button
					><button class="outlined small" title="親から受け継ぐ" onclick={() => attr(paint, '')}>継承</button>
				</div>
				<label class="field value"
					><span>値</span><input
						aria-label={paint === 'stroke' ? '線の色の値' : '塗りの値'}
						value={inherited(paint, paint === 'fill' ? 'none' : '#453D35')}
						onchange={(e) => attr(paint, e.currentTarget.value)}
					/></label
				>{/each}
			<div class="fields">
				<label class="field"
					><span>線幅</span><input
						type="number"
						min="0"
						step="0.1"
						value={inherited('stroke-width', '2.4')}
						onchange={(e) => attr('stroke-width', e.currentTarget.value)}
					/></label
				><label class="field"
					><span>不透明度</span><input
						type="number"
						min="0"
						max="1"
						step="0.05"
						value={active?.attrs.opacity ?? '1'}
						onchange={(e) => attr('opacity', e.currentTarget.value)}
					/></label
				><label class="field"
					><span>塗りの濃さ</span><input
						type="number"
						min="0"
						max="1"
						step="0.01"
						value={inherited('fill-opacity', '1')}
						onchange={(e) => attr('fill-opacity', e.currentTarget.value)}
					/></label
				>
			</div>
		</section>
		{#if active && active.tag !== 'g' && active.tag !== 'path'}<section>
				<h3>形</h3>
				<div class="fields">
					{#each Object.entries(active.attrs).filter(([k]) => GEOMETRY.includes(k)) as [name, value] (name)}<label
							class="field"
							><span class="mono">{name}</span><input
								type="number"
								step="0.1"
								{value}
								onchange={(e) => attr(name, e.currentTarget.value)}
							/></label
						>{/each}
				</div>
				<button
					class="outlined wide"
					onclick={() => {
						change(() => toPath(active!));
						choose('node');
					}}>パスに変換</button
				>
			</section>{/if}
		{#if active?.tag === 'path'}<PathSection {tool} {pathCommands} bind:nodeIndex bind:smooth {choose} {editPath} {remove} />{/if}
	{:else}<DocumentSection {root} {title} {metadata} />{/if}
	<SelfCheck />
</aside>

<style>
	.properties {
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 20px 18px;
		overflow: auto;
	}
	.title {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
	}
	h2 {
		font-size: 20px;
		overflow-wrap: anywhere;
	}
	.mono {
		font: 12px var(--mono);
	}
	.value input {
		text-align: left;
	}
	.align {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.align .segmented {
		width: 100%;
	}
	.align .round {
		flex: 1;
		min-height: 36px;
		padding: 0;
	}
	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.swatches .small {
		padding: 0 12px 0 8px;
	}
	.swatches .small:not(:has(.dot)) {
		padding: 0 12px;
	}
	.dot {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		box-shadow: inset 0 0 0 2px rgb(255 253 249 / 0.5);
	}
	@media (max-width: 640px) {
		.properties {
			display: none;
		}
	}
</style>
