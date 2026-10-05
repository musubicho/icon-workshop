import type { Theme } from './svg.ts';

export const prefs = $state({ mono: false, theme: 'light' as Theme });

export function setTheme(theme: Theme) {
	prefs.theme = theme;
	document.documentElement.dataset.theme = theme;
	try {
		localStorage.setItem('theme', theme);
	} catch {}
}
