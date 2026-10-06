<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · Nyatabi Icons</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="wrap missing">
	<p class="mono-text">{page.status}</p>
	<h1>{page.error?.message ?? 'このページはありません。'}</h1>
	<a class="button primary" href="/">アイコンへ戻る</a>
</main>

<style>
	.missing {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		padding-block: 72px 120px;
	}

	p {
		margin: 0;
		color: var(--gold-ink);
		letter-spacing: 0.08em;
	}

	h1 {
		margin: 0;
		font-size: 36px;
		line-height: 1.3;
	}
</style>
