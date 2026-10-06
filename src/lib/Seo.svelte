<script lang="ts">
	import { pageUrl, site } from './site.ts';

	let {
		title,
		description,
		path,
		jsonLd
	}: {
		title: string;
		description: string;
		path: string;
		jsonLd?: Record<string, unknown>;
	} = $props();

	const url = $derived(pageUrl(path));
	const image = $derived(pageUrl(site.image));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:locale" content={site.locale} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:secure_url" content={image} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(site.imageWidth)} />
	<meta property="og:image:height" content={String(site.imageHeight)} />
	<meta property="og:image:alt" content={site.imageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={site.imageAlt} />
	{#if jsonLd}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>`}
	{/if}
</svelte:head>
