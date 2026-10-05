<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Icon from '#lib/Icon.svelte';
	import { glyph } from '#lib/icons.ts';
	import { prefs, setTheme } from '#lib/prefs.svelte.ts';

	let { children } = $props();

	onMount(() => {
		if (document.documentElement.dataset.theme === 'dark') prefs.theme = 'dark';
	});

	const dark = $derived(prefs.theme === 'dark');
</script>

<header class="wrap header">
	<a class="brand" href="/">
		<img src="/brand/nyatabi.webp" alt="" width="40" height="40" />
		<span>Nyatabi Icons</span>
	</a>
	<nav aria-label="站点">
		<a href="/#icons">图标</a>
		<a href="https://github.com/musubicho/icon-workshop">GitHub</a>
		<button
			type="button"
			class="theme"
			aria-pressed={dark}
			aria-label={dark ? '切换到浅色' : '切换到深色'}
			onclick={() => setTheme(dark ? 'light' : 'dark')}
		>
			<Icon markup={glyph('appearance')} size={24} glyph />
		</button>
	</nav>
</header>

{@render children()}

<footer class="wrap footer">
	<span>为 Nyatabi 的 Web 与 iOS 画同一套形状。</span>
	<a href="https://nyatabi.app">nyatabi.app</a>
</footer>

<style>
	.header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-block: 20px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--ink);
		text-decoration: none;
		font-weight: 900;
		font-size: 19px;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 4px;
		font-weight: 700;
	}

	nav a {
		padding: 10px 14px;
		color: var(--body);
		text-decoration: none;
		border-radius: 999px;
	}

	nav a:hover {
		background: var(--sunken);
	}

	.theme {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		margin-left: 6px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		cursor: pointer;
	}

	.footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 12px;
		padding-block: 28px;
		font-size: 14px;
		color: var(--muted);
	}
</style>
