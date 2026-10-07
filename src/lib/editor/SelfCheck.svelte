<script lang="ts">
	const items = ['色の線は墨の線に触れない', '離れた線どうしは 3.6 あける', '交差するときは下の線を切る', '16px のモノクロでも読める'];
	let checks = $state(items.map(() => false));
</script>

<section class="self-check">
	<div class="heading">
		<h3>セルフチェック</h3>
		<span>{checks.filter(Boolean).length} / {items.length}</span>
	</div>
	{#each items as text, i (text)}<label><input type="checkbox" bind:checked={checks[i]} /><span>{text}</span></label
		>{/each}
	<small>線幅 2.4 · 丸い端と角。隠したレイヤーはエディタ上だけです。</small>
</section>

<style>
	.self-check {
		margin-top: auto;
		gap: 6px;
		padding: 16px;
		border-radius: 20px;
		background: var(--paper);
	}
	.heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
	.heading span {
		font: 12px var(--mono);
		color: var(--muted);
	}
	label {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 5px 0;
		font-size: 13px;
		line-height: 1.6;
		color: var(--body);
	}
	label input {
		margin-top: 2px;
		accent-color: #53765a;
	}
</style>
