<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import Icon from '../Icon.svelte';
	import { glyph } from '../icons.ts';
	import { actions } from './actions.ts';
	import Banners from './Banners.svelte';
	import './editor.css';
	import { exportDraft, save } from './files.ts';
	import { glyphs } from './glyphs.ts';
	import Inspector from './Inspector.svelte';
	import { keydown } from './keys.ts';
	import LayersPanel from './LayersPanel.svelte';
	import { cancelDrag, finishPen } from './pointer.svelte.ts';
	import Previews from './Previews.svelte';
	import Stage from './Stage.svelte';
	import { EditorState, TOOLS } from './state.svelte.ts';
	import Topbar from './Topbar.svelte';

	let {
		id,
		initial,
		onclose,
		onsave,
	}: { id: string; initial: string; onclose: () => void; onsave: (svg: string) => void } = $props();
	const s = new EditorState(
		untrack(() => id),
		untrack(() => initial),
	);
	const a = actions(s);
	const persistSave = () => save(s, onsave);

	onMount(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		s.loadRecovery();
		s.updateGeometry();
		return () => {
			document.body.style.overflow = previous;
			clearTimeout(s.codeTimer);
		};
	});
	beforeNavigate(({ cancel }) => {
		if (s.dirty && !confirm('エディタを離れますか？下書きは手元に残ります。')) cancel();
	});
	function close() {
		s.flushCode();
		finishPen(s);
		s.persist();
		if (!s.dirty || confirm('エディタを閉じますか？下書きは手元に残ります。')) onclose();
	}
	function fit() {
		s.zoom = 1;
		s.pan = { x: 0, y: 0 };
		s.updateGeometry();
	}
</script>

<svelte:window
	onkeydown={(e) => keydown(s, a, persistSave, e)}
	onkeyup={(e) => {
		if (e.code === 'Space') s.space = false;
	}}
	onblur={() => {
		s.space = false;
		cancelDrag(s);
	}}
	onbeforeunload={(e) => {
		s.persist();
		if (s.dirty) e.preventDefault();
	}}
/>
<div class="workbench">
	<Topbar {s} onclose={close} onsave={persistSave} onexport={() => exportDraft(s)} />
	<Banners {s} />
	<div class="workspace" inert={!!s.recovery}>
		<nav class="tools" aria-label="描画ツール">
			{#each TOOLS as t, i (t.id)}{#if i === 3 || i === 6}<span class="divider"></span>{/if}<button
					class="round"
					class:inked={s.tool === t.id}
					aria-label={`${t.label} (${t.key})`}
					aria-pressed={s.tool === t.id}
					title={`${t.label} · ${t.key}`}
					onclick={() => s.choose(t.id)}><Icon markup={glyphs[t.id]} size={22} /></button
				>{/each}
			<button class="round" onclick={fit} aria-label="全体表示" title="全体表示"
				><Icon markup={glyph('fit')} size={22} glyph /></button
			>
		</nav>
		<LayersPanel
			root={s.root}
			layers={s.layers}
			selected={s.selected}
			hidden={s.hidden}
			locked={s.locked}
			active={s.active}
			blocked={s.blocked}
			select={s.select}
			toggle={a.toggle}
			reorder={a.reorder}
			duplicate={a.duplicate}
			remove={a.remove}
			group={a.group}
			ungroup={a.ungroup}
		/>
		<div class="center">
			<Stage {s} />
			<Previews markup={s.preview} />
		</div>
		<Inspector
			root={s.root}
			title={s.title}
			selected={s.selected}
			selectionBox={s.selectionBox}
			active={s.active}
			tool={s.tool}
			pathCommands={s.pathCommands}
			bind:nodeIndex={s.nodeIndex}
			bind:smooth={s.smooth}
			bind:proportional={s.proportional}
			transform={a.transform}
			align={a.align}
			attr={a.attr}
			inherited={a.inherited}
			change={s.change}
			choose={s.choose}
			editPath={a.editPath}
			remove={a.remove}
			metadata={a.metadata}
		/>
	</div>
</div>

<style>
	.workbench {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px 20px 20px;
		background: var(--paper);
		color: var(--ink);
		font-size: 14px;
		isolation: isolate;
	}
	.workspace {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: auto 260px minmax(320px, 1fr) 300px;
		gap: 16px;
	}
	.tools {
		align-self: start;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 6px;
		border-radius: 999px;
		background: var(--surface);
		border: 1px solid var(--sunken);
		box-shadow: var(--shadow);
	}
	.divider {
		width: 20px;
		height: 1px;
		margin: 4px 0;
		background: var(--line);
	}
	.center {
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	@media (max-width: 1240px) {
		.workspace {
			grid-template-columns: auto 220px minmax(280px, 1fr) 270px;
		}
	}
	@media (max-width: 980px) {
		.workspace {
			grid-template-columns: auto minmax(260px, 1fr) 260px;
		}
	}
	@media (max-width: 640px) {
		.workbench {
			padding: 10px;
			gap: 10px;
		}
		.workspace {
			grid-template-columns: auto minmax(0, 1fr);
			gap: 10px;
		}
	}
</style>
