import { saveSource } from '../atelier.ts';
import { exportSvg } from '../svg.ts';
import { parse } from './document.ts';
import { finishPen, up } from './pointer.svelte.ts';
import type { EditorState } from './state.svelte.ts';

export function download(content: string | Blob, name: string) {
	const blob = typeof content === 'string' ? new Blob([content], { type: 'image/svg+xml' }) : content;
	const url = URL.createObjectURL(blob);
	Object.assign(document.createElement('a'), { href: url, download: name }).click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function settle(s: EditorState) {
	if (s.drag) up(s);
	s.flushCode();
	finishPen(s);
}

export async function save(s: EditorState, onsave: (svg: string) => void) {
	settle(s);
	if (s.saving) return;
	try {
		parse(s.code);
	} catch (e) {
		s.error = (e as Error).message;
		return;
	}
	s.saving = true;
	const submitted = s.code;
	try {
		await saveSource(s.id, submitted, s.base);
		s.base = submitted;
		if (s.code === submitted) s.source = submitted;
		onsave(submitted);
		s.status = `icons/${s.id}.svg に保存しました。`;
		s.remote = null;
		s.persist();
	} catch (e) {
		s.status = (e as Error).message;
		if ((e as Error).cause !== 409) return;
		try {
			const response = await fetch(`/__atelier/icons/${s.id}`);
			if (response.ok) s.remote = (await response.json()).svg;
		} catch {
			/* Keep the local draft available if the dev server is offline. */
		}
	} finally {
		s.saving = false;
	}
}

export async function exportDraft(s: EditorState) {
	settle(s);
	if (s.error) return;
	const format = s.exportFormat;
	if (format.startsWith('ios')) {
		const { exportIos } = await import('../ios.ts');
		const zip = exportIos([{ id: s.id, svg: s.source }], format === 'ios-mono' ? 'mono' : 'duo');
		download(new Blob([new Uint8Array(zip)], { type: 'application/zip' }), `${s.id}-ios.zip`);
	} else
		download(exportSvg(s.source, format === 'mono' ? 'current' : 'duo'), `${s.id}${format === 'mono' ? '-mono' : ''}.svg`);
}
