<script lang="ts">
	import IconDetail from '#lib/IconDetail.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.icon.name} · Nyatabi Icons</title>
	<meta name="description" content="{data.icon.name}（{data.icon.id}）{data.icon.desc}" />
</svelte:head>

{#key data.icon.id}
	<IconDetail icon={data.icon} />
{/key}
