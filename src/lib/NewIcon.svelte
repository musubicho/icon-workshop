<script lang="ts">
	import { saveSource } from './atelier.ts';
	import { categories } from './icons.ts';

	let dialog: HTMLDialogElement;
	let error = $state('');

	const escape = (text: string) =>
		text.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);

	async function create(event: SubmitEvent) {
		event.preventDefault();
		const form = new FormData(event.currentTarget as HTMLFormElement);
		const id = String(form.get('id'));
		const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="#453D35" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" data-category="${escape(String(form.get('category')))}">\n  <title>${escape(String(form.get('name')))}</title>\n</svg>\n`;
		try {
			await saveSource(id, source, null);
			location.assign(`/icon/${id}?edit`);
		} catch (e) {
			error = (e as Error).message;
		}
	}
</script>

<button type="button" class="button" onclick={() => ((error = ''), dialog.showModal())}>アイコンを一枚足す</button>

<dialog bind:this={dialog}>
	<form onsubmit={create}>
		<h2>アイコンを一枚足す</h2>
		<label>名前<input name="name" placeholder="例：おにぎり" required maxlength="60" /></label>
		<label>
			ファイル名
			<input name="id" placeholder="例：onigiri" pattern="[a-z][a-z0-9\-]{'{0,63}'}" required maxlength="64" aria-describedby="id-help" />
		</label>
		<small id="id-help">小文字の英字、数字、ハイフン。書き出しのリソース名にも使います。</small>
		<label>
			どの冊に入れる
			<select name="category">
				{#each categories as item (item.name)}<option>{item.name}</option>{/each}
			</select>
		</label>
		{#if error}<p role="alert">{error}</p>{/if}
		<div class="actions">
			<button type="button" class="button" onclick={() => dialog.close()}>やっぱりやめる</button>
			<button type="submit" class="button primary">描きはじめる</button>
		</div>
	</form>
</dialog>

<style>
	dialog {
		width: min(420px, calc(100vw - 32px));
		padding: 28px;
		border: 1px solid var(--line);
		border-radius: 24px;
		background: var(--surface);
		color: var(--ink);
	}

	dialog::backdrop {
		background: rgb(28 23 20 / 0.4);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	h2 {
		margin: 0 0 4px;
		font-size: 24px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-weight: 700;
		font-size: 14px;
	}

	input,
	select {
		min-height: 44px;
		padding: 0 14px;
		border-radius: 12px;
		border: 1px solid var(--line);
		background: var(--paper);
		font-weight: 500;
	}

	small {
		color: var(--muted);
	}

	[role='alert'] {
		margin: 0;
		color: var(--accent-ink);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
</style>
