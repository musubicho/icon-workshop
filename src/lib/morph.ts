import { tick } from 'svelte';

export function morph(update: () => void) {
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reduce || typeof document.startViewTransition !== 'function') {
		update();
		return;
	}
	document.documentElement.dataset.segment = '';
	const transition = document.startViewTransition(async () => {
		update();
		await tick();
	});
	transition.finished.finally(() => {
		delete document.documentElement.dataset.segment;
	});
}
