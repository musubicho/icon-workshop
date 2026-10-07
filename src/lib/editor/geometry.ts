import { find, number as num, type Node, type Point } from './document.ts';

export type Box = { x: number; y: number; width: number; height: number };
export type Frames = Map<string, { frame: DOMMatrix; local: DOMMatrix }>;

export function project(p: Point, m: DOMMatrix): Point {
	const q = new DOMPoint(p.x, p.y).matrixTransform(m);
	return { x: q.x, y: q.y };
}

const screen = (node: SVGGraphicsElement) => {
	const m = node.getScreenCTM()!;
	return new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]);
};

export function worldMatrix(svg: SVGSVGElement, el: SVGGraphicsElement): DOMMatrix {
	return screen(svg).inverse().multiply(screen(el));
}

export function bounds(svg: SVGSVGElement, el: SVGGraphicsElement): Box {
	const b = el.getBBox(),
		m = worldMatrix(svg, el);
	const pts = [
		{ x: b.x, y: b.y },
		{ x: b.x + b.width, y: b.y },
		{ x: b.x, y: b.y + b.height },
		{ x: b.x + b.width, y: b.y + b.height },
	].map((p) => project(p, m));
	const x = Math.min(...pts.map((p) => p.x)),
		y = Math.min(...pts.map((p) => p.y));
	return { x, y, width: Math.max(...pts.map((p) => p.x)) - x, height: Math.max(...pts.map((p) => p.y)) - y };
}

export function frames(svg: SVGSVGElement, ids: string[]): Frames {
	return new Map(
		ids.map((key) => {
			const el = svg.querySelector<SVGGraphicsElement>(`[data-editor-key="${key}"]`)!;
			const frame = worldMatrix(svg, el.parentNode as SVGGraphicsElement);
			return [key, { frame, local: frame.inverse().multiply(worldMatrix(svg, el)) }];
		}),
	);
}

export function applyMatrix(root: Node, ids: string[], transforms: Frames, operation: DOMMatrix) {
	for (const key of ids) {
		const n = find(root, key),
			m = transforms.get(key);
		if (!n || !m) continue;
		const r = m.frame.inverse().multiply(operation).multiply(m.frame).multiply(m.local);
		n.attrs.transform = `matrix(${[r.a, r.b, r.c, r.d, r.e, r.f].map(num).join(' ')})`;
	}
}

export function transformMatrix(kind: string, value: number, b: Box, proportional: boolean): DOMMatrix | null {
	const m = new DOMMatrix();
	if (kind === 'x' || kind === 'y') return m.translate(kind === 'x' ? value - b.x : 0, kind === 'y' ? value - b.y : 0);
	const cx = b.x + b.width / 2,
		cy = b.y + b.height / 2;
	if (kind === 'rotate') return m.translate(cx, cy).rotate(value).translate(-cx, -cy);
	const factor = value / (kind === 'width' ? b.width : b.height);
	if (!Number.isFinite(factor) || factor <= 0) return null;
	const sx = proportional || kind === 'width' ? factor : 1,
		sy = proportional || kind === 'height' ? factor : 1;
	return m.translate(b.x, b.y).scale(sx, sy).translate(-b.x, -b.y);
}

export function alignOffsets(boxes: Box[], axis: 'x' | 'y', mode: string, viewBox: number[]): number[] {
	const size = axis === 'x' ? 'width' : 'height';
	const min = boxes.length === 1 ? viewBox[axis === 'x' ? 0 : 1] : Math.min(...boxes.map((b) => b[axis])),
		max = boxes.length === 1 ? min + viewBox[axis === 'x' ? 2 : 3] : Math.max(...boxes.map((b) => b[axis] + b[size]));
	const order = boxes.map((b, i) => i).sort((a, b) => boxes[a][axis] - boxes[b][axis]);
	const gap = (max - min - boxes.reduce((s, b) => s + b[size], 0)) / (boxes.length - 1);
	const offsets: number[] = [];
	let cursor = min;
	for (const i of order) {
		const b = boxes[i];
		const target =
			mode === 'start' ? min : mode === 'end' ? max - b[size] : mode === 'center' ? (min + max - b[size]) / 2 : cursor;
		offsets[i] = target - b[axis];
		cursor += b[size] + gap;
	}
	return offsets;
}
