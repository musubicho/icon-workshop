import { drawable, movePoint } from './document.ts';
import type { Actions } from './actions.ts';
import { cancelDrag, finishPen } from './pointer.svelte.ts';
import { TOOLS, type EditorState } from './state.svelte.ts';

export function keydown(s: EditorState, a: Actions, save: () => void, e: KeyboardEvent) {
	if (s.recovery) return;
	const mod = e.metaKey || e.ctrlKey,
		key = e.key.toLowerCase();
	if (mod && key === 's') {
		e.preventDefault();
		save();
		return;
	}
	if ((e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]')) return;
	if (e.code === 'Space') {
		e.preventDefault();
		s.space = true;
	}
	const command = mod && { z: () => s.history(!e.shiftKey), d: a.duplicate, g: e.shiftKey ? a.ungroup : a.group, a: selectAll }[key];
	if (command) {
		e.preventDefault();
		command();
	} else if (e.key === 'Delete' || e.key === 'Backspace') {
		e.preventDefault();
		a.remove();
	} else if (e.key === 'Escape') escape();
	else if (e.key === 'Enter') finishPen(s);
	else if (e.key.startsWith('Arrow') && s.selected.length) {
		e.preventDefault();
		nudge();
	} else if (!mod) {
		const tool = TOOLS.find((t) => t.key.toLowerCase() === key);
		if (tool) s.choose(tool.id);
	}

	function selectAll() {
		s.selected = s.root.children.filter((n) => drawable(n) && !s.blocked(n.key)).map((n) => n.key);
		s.updateGeometry();
	}
	function escape() {
		if (s.drag) cancelDrag(s);
		else if (s.pen.length) finishPen(s);
		else {
			s.selected = [];
			s.nodeIndex = -1;
			s.updateGeometry();
		}
	}
	function nudge() {
		const step = e.shiftKey ? 1 : 0.1,
			dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
			dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
		const i = s.nodeIndex;
		if (s.tool === 'node' && i >= 0)
			a.editPath((cs) => {
				const c = cs[i];
				if (c && 'x' in c) movePoint(cs, i, 'anchor', { x: c.x + dx, y: c.y + dy });
			});
		else a.moveBy(new DOMMatrix().translate(dx, dy));
	}
}
