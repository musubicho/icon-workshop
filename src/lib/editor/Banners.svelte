<script lang="ts">
	import { parse } from './document.ts';
	import { download } from './files.ts';
	import type { EditorState } from './state.svelte.ts';

	let { s }: { s: EditorState } = $props();

	function recover(recovery: NonNullable<EditorState['recovery']>) {
		const before = s.snapshot();
		try {
			s.restore(recovery.snapshot);
			s.base = recovery.base;
			s.recovery = null;
			s.remember(before);
		} catch {
			s.status = 'この下書きは読めません。今のファイルで続けてください。';
		}
	}
	function loadRemote(remote: string) {
		const before = s.snapshot();
		s.base = remote;
		s.root = parse(remote);
		s.source = s.code = remote;
		s.remote = null;
		s.selected = [];
		s.remember(before);
		s.updateGeometry();
	}
	function keepDraft(remote: string) {
		s.base = remote;
		s.remote = null;
		s.showCode = true;
		s.status = 'ソースで変更を統合してから、確認したディスクの版に対して保存してください。';
		s.persist();
	}
</script>

{#if s.recovery}{@const recovery = s.recovery}
	<div class="notice">
		<span>手元に下書きがあります{recovery.base !== s.initial ? '。ディスク上のファイルも変わっています' : ''}。</span><button
			onclick={() => recover(recovery)}>下書きを復元</button
		><button
			onclick={() => {
				s.recovery = null;
				s.persist();
			}}>今のファイルを使う</button
		>
	</div>
{/if}
{#if s.remote !== null}{@const remote = s.remote}
	<div class="conflict">
		<strong>ファイルがエディタの外で変わりました。下書きはそのまま残っています。</strong>
		<div class="compare">
			<label>ディスク上のファイル<textarea readonly value={remote}></textarea></label><label
				>あなたの下書き<textarea readonly value={s.code}></textarea></label
			>
		</div>
		<div class="choices">
			<button onclick={() => download(s.code, `${s.id}-draft.svg`)}>下書きをダウンロード</button><button
				onclick={() => loadRemote(remote)}>ディスクの版を読み込む（取り消しで下書きに戻せます）</button
			><button onclick={() => keepDraft(remote)}>下書きを残して手で統合</button>
		</div>
	</div>
{/if}

<style>
	.notice,
	.conflict {
		flex-shrink: 0;
		padding: 14px 18px;
		border-radius: 20px;
		background: var(--gold-wash);
		color: var(--gold-ink);
	}
	.notice {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
	.notice span {
		flex: 1;
		font-weight: 700;
	}
	button {
		min-height: 40px;
		border-color: currentColor;
	}
	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.compare {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		margin: 12px 0;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		font-weight: 700;
	}
	textarea {
		height: 120px;
		width: 100%;
		padding: 10px 12px;
		border: 0;
		border-radius: 14px;
		background: var(--code-bg);
		color: var(--code-ink);
		font: 12px var(--mono);
	}
</style>
