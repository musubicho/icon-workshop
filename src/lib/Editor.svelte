<script lang="ts">
	import { untrack } from 'svelte';
	import { saveSource } from './atelier.ts';
	import { validate } from './validate.ts';

	let { id, base: initial, source = $bindable() }: { id: string; base: string; source: string } = $props();

	let base = $state(untrack(() => initial));
	let draft = $state(untrack(() => initial));
	let error = $state('');
	let saving = $state(false);
	let note = $state('');
	let timer: ReturnType<typeof setTimeout>;

	const dirty = $derived(draft !== base);

	function onInput() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			try {
				source = validate(draft);
				error = '';
			} catch (e) {
				error = `${(e as Error).message} 前回の有効なプレビューを残しています。`;
			}
		}, 180);
	}

	function indent(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;
		event.preventDefault();
		const input = event.currentTarget as HTMLTextAreaElement;
		input.setRangeText('  ', input.selectionStart, input.selectionEnd, 'end');
		draft = input.value;
		onInput();
	}

	async function save() {
		if (!dirty || error || saving) return;
		saving = true;
		const submitted = draft;
		try {
			await saveSource(id, submitted, base);
			base = submitted;
			note = '原稿を icons/ に保存しました。';
		} catch (e) {
			note = (e as Error).message;
		} finally {
			saving = false;
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
			event.preventDefault();
			save();
		}
	}

	function onBeforeUnload(event: BeforeUnloadEvent) {
		if (dirty) event.preventDefault();
	}
</script>

<svelte:window onkeydown={onKeydown} onbeforeunload={onBeforeUnload} />

<div class="editor">
	<div class="head">
		<label for="source">SVG 原稿</label>
		<span class={['state', dirty && 'dirty']}>{dirty ? '未保存' : '保存済み'}</span>
	</div>
	<textarea id="source" bind:value={draft} oninput={onInput} onkeydown={indent} spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
	<p class={['note', error && 'error']} role="status">{error || note || 'パス、線、色を変えると、プレビューも更新されます。'}</p>
	<button type="button" class="button primary" disabled={!dirty || !!error || saving} onclick={save}>
		変更を保存 <kbd class="mono-text">⌘S</kbd>
	</button>
</div>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.head {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		font-weight: 700;
	}

	.state {
		color: var(--muted);
	}

	.state.dirty {
		color: var(--accent-ink);
	}

	textarea {
		min-height: 320px;
		padding: 14px;
		border-radius: 16px;
		border: 1px solid var(--line);
		background: var(--code-bg);
		color: var(--code-ink);
		font-family: var(--mono);
		font-size: 12px;
		line-height: 1.65;
		resize: vertical;
		white-space: pre;
	}

	.note {
		margin: 0;
		font-size: 13px;
		color: var(--muted);
	}

	.note.error {
		color: var(--accent-ink);
	}

	kbd {
		font-size: 12px;
		opacity: 0.8;
	}
</style>
