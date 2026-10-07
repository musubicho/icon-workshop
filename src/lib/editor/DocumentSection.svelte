<script lang="ts">
	import type { Node } from './document.ts';

	let { root, title, metadata }: { root: Node; title: string; metadata: (tag: string, value: string) => void } =
		$props();

	const shortcuts = [
		['V / A', '選択 / ノード'],
		['⌘D', '複製'],
		['⌘G', 'グループ'],
		['⇧⌘G', 'グループ解除'],
		['矢印', '0.1 ずつ動かす'],
		['⇧ 矢印', '1 ずつ動かす'],
	];
</script>

<div class="title">
	<span class="chip">ドキュメント</span>
	<h2>{title}</h2>
</div>
<section>
	<label class="node-picker"
		>名前<input
			value={root.children.find((n) => n.tag === 'title')?.text || ''}
			onchange={(e) => metadata('title', e.currentTarget.value)}
		/></label
	><label class="node-picker"
		>分類<input value={root.attrs['data-category'] || ''} onchange={(e) => metadata('category', e.currentTarget.value)} /></label
	><label class="node-picker"
		>説明<input
			value={root.children.find((n) => n.tag === 'desc')?.text || ''}
			onchange={(e) => metadata('desc', e.currentTarget.value)}
		/></label
	>
</section>
<section>
	<p>形を選んで整えるか、ツールを選んで描き足します。</p>
	<dl>
		{#each shortcuts as [key, action] (key)}<dt>{key}</dt>
			<dd>{action}</dd>{/each}
	</dl>
</section>

<style>
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
	p {
		margin: 0;
		font-size: 13px;
		line-height: 1.7;
		color: var(--muted);
	}
	dl {
		display: grid;
		grid-template-columns: 64px 1fr;
		gap: 8px;
		margin: 0;
		font-size: 13px;
	}
	dt {
		font-family: var(--mono);
		color: var(--muted);
	}
	dd {
		margin: 0;
	}
</style>
