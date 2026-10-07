import { ancestors, commands, drawable, encode, find, movePoint, selectedRoots, shape, type Point } from './document.ts';
import { applyMatrix, frames, project, worldMatrix } from './geometry.ts';
import type { EditorState } from './state.svelte.ts';
import { penCommands, shapeAttrs } from './tree.ts';

const SHAPES = ['rect', 'ellipse', 'line'];

function position(s: EditorState, e: PointerEvent, snapping = false): Point {
	const p = project({ x: e.clientX, y: e.clientY }, s.svg.getScreenCTM()!.inverse());
	return snapping && s.snap && !e.altKey ? { x: Math.round(p.x), y: Math.round(p.y) } : p;
}

function pick(s: EditorState, e: PointerEvent, target: Element) {
	let key = target.closest('[data-editor-key]')?.getAttribute('data-editor-key');
	if (key === s.root.key || (key && s.blocked(key))) key = null;
	if (key && !e.metaKey && s.tool === 'select') {
		const group = ancestors(s.root, key)
			.filter((n) => n.tag === 'g')
			.at(-1);
		if (group) key = group.key;
	}
	return key;
}

export function down(s: EditorState, e: PointerEvent) {
	if (e.button !== 0 && e.button !== 1) return;
	e.preventDefault();
	s.svg.setPointerCapture(e.pointerId);
	s.flushCode();
	const p = position(s, e),
		target = e.target as Element,
		part = target.getAttribute('data-part') as 'anchor' | 'in' | 'out' | null,
		handle = target.getAttribute('data-handle');
	let kind = s.space || e.button === 1 || s.tool === 'hand' ? 'pan' : s.tool;
	if (kind !== 'pan' && s.error) return;
	if (kind === 'select' || kind === 'node') {
		const key = !handle && !(part && s.active) && pick(s, e, target);
		if (handle) kind = handle;
		else if (part && s.active) {
			kind = 'point';
			s.nodeIndex = Number(target.getAttribute('data-index'));
		} else if (key) {
			if (!s.selected.includes(key) || e.shiftKey) s.select(key, e.shiftKey);
			kind = s.tool === 'node' ? 'idle' : 'move';
		} else {
			if (!e.shiftKey) s.selected = [];
			kind = 'marquee';
			s.updateGeometry();
		}
	}
	const ids = selectedRoots(s.root, s.selected)
		.filter((n) => !s.blocked(n.key))
		.map((n) => n.key);
	const before = s.snapshot();
	if (kind === 'pen') {
		const q = position(s, e, true);
		if (s.pen.length > 2 && Math.hypot(q.x - s.pen[0].p.x, q.y - s.pen[0].p.y) < 1 / s.zoom) {
			finishPen(s, true);
			return;
		}
		if (!s.pen.length) {
			s.penBefore = before;
			const n = shape('path', { d: `M${q.x} ${q.y}` });
			s.penKey = n.key;
			s.root.children.push(n);
			s.selected = [n.key];
		}
		s.pen = [...s.pen, { p: q, h: q }];
		writePen(s);
	}
	if (SHAPES.includes(kind)) {
		const n = shape(kind, {});
		s.root.children.push(n);
		s.selected = [n.key];
	}
	const activeEl = s.active && s.element(s.active.key);
	s.drag = {
		kind,
		start: p,
		client: { x: e.clientX, y: e.clientY },
		tree: structuredClone($state.snapshot(s.root)),
		snapshot: before,
		ids,
		transforms: frames(s.svg, ids),
		box: s.selectionBox ? { ...s.selectionBox } : { x: 0, y: 0, width: 0, height: 0 },
		part: part ?? undefined,
		index: s.nodeIndex,
		matrix: activeEl ? worldMatrix(s.svg, activeEl) : undefined,
		cmds: s.active?.tag === 'path' ? commands(s.active.attrs.d || '') : undefined,
		originPan: { ...s.pan },
	};
}

function dragMatrix(s: EditorState, kind: string, e: PointerEvent, p: Point, dx: number, dy: number) {
	const d = s.drag!,
		b = d.box;
	if (kind === 'move') return new DOMMatrix().translate(dx, dy);
	if (kind === 'scale') {
		let sx = b.width ? Math.max(0.01, (b.width + dx) / b.width) : 1,
			sy = b.height ? Math.max(0.01, (b.height + dy) / b.height) : 1;
		if (s.proportional || e.shiftKey) sx = sy = !b.height ? sx : !b.width ? sy : Math.abs(dx) > Math.abs(dy) ? sx : sy;
		return new DOMMatrix().translate(b.x, b.y).scale(sx, sy).translate(-b.x, -b.y);
	}
	if (kind === 'rotate') {
		const cx = b.x + b.width / 2,
			cy = b.y + b.height / 2;
		let angle = ((Math.atan2(p.y - cy, p.x - cx) - Math.atan2(d.start.y - cy, d.start.x - cx)) * 180) / Math.PI;
		if (e.shiftKey) angle = Math.round(angle / 15) * 15;
		return new DOMMatrix().translate(cx, cy).rotate(angle).translate(-cx, -cy);
	}
	return null;
}

export function move(s: EditorState, e: PointerEvent) {
	const d = s.drag;
	if (!d) return;
	const p = position(s, e);
	if (d.kind === 'pan') {
		const m = s.svg.getScreenCTM()!;
		s.pan = { x: d.originPan.x - (e.clientX - d.client.x) / m.a, y: d.originPan.y - (e.clientY - d.client.y) / m.d };
		return;
	}
	let dx = p.x - d.start.x,
		dy = p.y - d.start.y;
	if (s.snap && !e.altKey) {
		dx = Math.round(dx);
		dy = Math.round(dy);
	}
	if (e.shiftKey && d.kind === 'move') {
		if (Math.abs(dx) > Math.abs(dy)) dy = 0;
		else dx = 0;
	}
	if (d.kind === 'marquee') {
		s.marquee = {
			x: Math.min(p.x, d.start.x),
			y: Math.min(p.y, d.start.y),
			width: Math.abs(p.x - d.start.x),
			height: Math.abs(p.y - d.start.y),
		};
		return;
	}
	if (d.kind === 'idle') return;
	s.root = structuredClone(d.tree);
	const matrix = dragMatrix(s, d.kind, e, p, dx, dy);
	if (matrix) applyMatrix(s.root, d.ids, d.transforms, matrix);
	if (d.kind === 'point' && d.cmds && d.matrix && s.selected[0]) {
		const cs = structuredClone(d.cmds);
		movePoint(cs, d.index!, d.part!, project(position(s, e, true), d.matrix.inverse()), s.smooth && !e.altKey);
		find(s.root, s.selected[0])!.attrs.d = encode(cs);
	}
	if (SHAPES.includes(d.kind)) {
		const start = s.snap && !e.altKey ? { x: Math.round(d.start.x), y: Math.round(d.start.y) } : d.start;
		Object.assign(find(s.root, s.selected[0])!.attrs, shapeAttrs(d.kind, start, position(s, e, true), e.shiftKey));
	}
	if (d.kind === 'pen') {
		s.pen[s.pen.length - 1].h = position(s, e, true);
		writePen(s);
	} else s.publish();
}

export function up(s: EditorState) {
	const d = s.drag;
	if (!d) return;
	s.drag = null;
	if (d.kind === 'marquee' && s.marquee) {
		const b = s.marquee;
		const inside = s.root.children
			.filter((n) => drawable(n) && !s.blocked(n.key))
			.filter((n) => {
				const q = s.bounds(n.key);
				return q && q.x >= b.x && q.y >= b.y && q.x + q.width <= b.x + b.width && q.y + q.height <= b.y + b.height;
			})
			.map((n) => n.key);
		s.selected = [...new Set([...s.selected, ...inside])];
		s.marquee = null;
	} else if (!['pan', 'idle', 'pen'].includes(d.kind)) {
		const box = s.selectionBox;
		const empty =
			SHAPES.includes(d.kind) &&
			(!Object.keys(find(s.root, s.selected[0])?.attrs ?? {}).length || (box && box.width === 0 && box.height === 0));
		if (empty) s.restore(d.snapshot);
		else s.remember(d.snapshot);
	}
	s.updateGeometry();
}

export function cancelDrag(s: EditorState) {
	if (!s.drag) return;
	const before = s.drag.snapshot;
	if (s.drag.kind === 'pen') {
		s.pen = s.pen.slice(0, -1);
		if (!s.pen.length) s.penKey = '';
	}
	s.drag = null;
	s.marquee = null;
	s.restore(before);
}

export function wheel(s: EditorState, e: WheelEvent) {
	e.preventDefault();
	s.setZoom(s.zoom * Math.exp(-e.deltaY * 0.001));
}

function writePen(s: EditorState, closed = false) {
	const node = find(s.root, s.penKey);
	if (node) node.attrs.d = encode(penCommands(s.pen, closed));
	s.publish();
}

export function finishPen(s: EditorState, closed = false) {
	if (!s.pen.length) return;
	if (s.pen.length > 1) {
		writePen(s, closed);
		s.pen = [];
		s.remember(s.penBefore);
	} else {
		s.pen = [];
		s.restore(s.penBefore);
	}
	s.penKey = '';
}
