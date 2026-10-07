<script lang="ts">
	import Icon from '../Icon.svelte';
	import { glyph } from '../icons.ts';
	import { PALETTE, themable } from '../svg.ts';
	import { ancestors, serialize, type Node } from './document.ts';
	import { glyphs } from './glyphs.ts';

	let {
		root,
		layers,
		selected,
		hidden,
		locked,
		active,
		blocked,
		select,
		toggle,
		reorder,
		duplicate,
		remove,
		group,
		ungroup,
	}: {
		root: Node;
		layers: Node[];
		selected: string[];
		hidden: string[];
		locked: string[];
		active: Node | undefined;
		blocked: (key: string) => boolean;
		select: (key: string, additive: boolean) => void;
		toggle: (key: string, which: 'hidden' | 'locked') => void;
		reorder: (direction: number) => void;
		duplicate: () => void;
		remove: () => void;
		group: () => void;
		ungroup: () => void;
	} = $props();

	const ROLES: Record<string, string> = { ink: '墨', accent: '朱', gold: '金', green: '抹茶' };
	const thumbs = $derived(new Map(layers.map((n) => [n.key, thumb(n)])));

	function thumb(node: Node) {
		const chain = new Set(ancestors(root, node.key).map((a) => a.key));
		const prune = (n: Node): Node =>
			n.key === node.key
				? n
				: { ...n, children: n.children.filter((c) => c.key === node.key || chain.has(c.key)).map(prune) };
		return themable(serialize(prune($state.snapshot(root))));
	}
	function role(node: Node) {
		const color = (
			[node, ...ancestors(root, node.key)].find((n) => n.attrs.stroke != null)?.attrs.stroke ?? ''
		).toLowerCase();
		const key = Object.entries(PALETTE).find(([, pair]) => pair.some((hex) => hex.toLowerCase() === color))?.[0];
		return key ? ROLES[key] : color === 'none' ? '線なし' : color;
	}
</script>

<aside class="layers card">
	<div class="heading">
		<h2>レイヤー</h2>
		<span>{layers.length}</span>
	</div>
	<div class="layer-list">
		{#each layers.toReversed() as n (n.key)}<div
				class="layer"
				class:selected={selected.includes(n.key)}
				style:padding-left={`${Math.max(0, ancestors(root, n.key).length - 1) * 14}px`}
			>
				<button class="layer-name" disabled={blocked(n.key)} onclick={(e) => select(n.key, e.shiftKey)}
					><span class="thumb"><Icon markup={thumbs.get(n.key) ?? ''} size={28} /></span><span class="label"
						><strong>{n.attrs.id || n.tag}</strong><small>{n.tag} · {role(n)}</small></span
					></button
				><button
					class="round tiny"
					class:on={hidden.includes(n.key)}
					aria-label={`${n.attrs.id || n.tag} を${hidden.includes(n.key) ? '表示' : '隠す'}`}
					title="エディタ上だけ隠す（書き出しには残る）"
					onclick={() => toggle(n.key, 'hidden')}
					><Icon markup={hidden.includes(n.key) ? glyph('hide') : glyphs.eye} size={18} glyph /></button
				><button
					class="round tiny"
					class:on={locked.includes(n.key)}
					aria-label={`${n.attrs.id || n.tag} を${locked.includes(n.key) ? 'ロック解除' : 'ロック'}`}
					onclick={() => toggle(n.key, 'locked')}
					><Icon markup={locked.includes(n.key) ? glyphs.lock : glyphs.unlock} size={18} /></button
				>
			</div>{/each}
	</div>
	<p class="hint">⌘ クリックでグループの中を選べます</p>
	<div class="actions">
		<button class="round" disabled={!selected.length} onclick={() => reorder(1)} aria-label="前面へ" title="前面へ"
			><Icon markup={glyphs.forward} size={18} /></button
		><button class="round" disabled={!selected.length} onclick={() => reorder(-1)} aria-label="背面へ" title="背面へ"
			><Icon markup={glyphs.backward} size={18} /></button
		><button class="round" disabled={!selected.length} onclick={duplicate} aria-label="複製" title="複製 · ⌘D"
			><Icon markup={glyph('copy')} size={18} glyph /></button
		><button class="round" disabled={!selected.length} onclick={remove} aria-label="削除" title="削除"
			><Icon markup={glyph('trash')} size={18} glyph /></button
		><span class="grow"></span><button class="outlined small" disabled={selected.length < 2} onclick={group}
			>グループ</button
		><button class="outlined small" disabled={active?.tag !== 'g'} onclick={ungroup}>グループ解除</button>
	</div>
	<a class="collection" href="/MusubiIcons-duo.zip" download
		><Icon markup={glyph('download')} size={18} glyph />保存済みの iOS アセット</a
	>
</aside>

<style>
	.layers {
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 18px 12px 12px;
		overflow: auto;
	}
	.heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 0 8px;
	}
	.heading > span {
		font: 12px var(--mono);
		color: var(--muted);
	}
	.layer-list {
		flex: 1;
		min-height: 80px;
		overflow: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.layer {
		display: flex;
		align-items: center;
		border-radius: 16px;
	}
	.layer.selected {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		color: var(--accent-ink);
	}
	.layer-name {
		flex: 1;
		min-width: 0;
		min-height: 52px;
		justify-content: flex-start;
		gap: 12px;
		padding: 0 8px;
		border-radius: 16px;
		font-weight: 400;
		text-align: left;
	}
	.layer-name:hover:not(:disabled) {
		background: transparent;
	}
	.thumb {
		flex: none;
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 12px;
		background: var(--paper);
	}
	.label {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.label strong,
	.label small {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.label small {
		font: 11px var(--mono);
		color: var(--muted);
	}
	.tiny {
		width: 36px;
		min-height: 36px;
		opacity: 0.4;
	}
	.tiny.on,
	.layer:hover .tiny {
		opacity: 1;
	}
	.hint {
		margin: 0;
		padding: 0 8px;
		font-size: 12px;
		color: var(--muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		padding-top: 10px;
		border-top: 1px dashed var(--line);
	}
	.grow {
		flex: 1;
	}
	.collection {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px;
		font-size: 13px;
		font-weight: 700;
		color: var(--accent-ink);
		text-decoration: none;
	}
	@media (max-width: 980px) {
		.layers {
			display: none;
		}
	}
</style>
