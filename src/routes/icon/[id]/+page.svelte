<script lang="ts">
	import IconDetail from '#lib/IconDetail.svelte';
	import Seo from '#lib/Seo.svelte';
	import { site } from '#lib/site.ts';

	let { data } = $props();

	const description = $derived(
		data.icon.desc
			? `${data.icon.name}。${data.icon.desc}${data.icon.category}のアイコン。`
			: `${data.icon.name}。Nyatabi Icons の${data.icon.category}アイコン。SVG と iOS アセットとして使えます。`
	);
</script>

<Seo
	title="{data.icon.name} · Nyatabi Icons"
	{description}
	path="/icon/{data.icon.id}"
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		name: data.icon.name,
		alternateName: data.icon.id,
		description,
		url: `${site.origin}/icon/${data.icon.id}`,
		inLanguage: 'ja',
		genre: data.icon.category,
		isPartOf: { '@type': 'WebSite', name: site.name, url: `${site.origin}/` }
	}}
/>

{#key data.icon.id}
	<IconDetail icon={data.icon} />
{/key}
