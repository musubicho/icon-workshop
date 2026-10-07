import { clone, drawable, number as num, parent, selectedRoots, shape, type Command, type Node, type Point } from './document.ts';

export type PenPoint = { p: Point; h: Point };

export function removeNodes(root: Node, keys: string[]) {
	for (const n of selectedRoots(root, keys)) {
		const p = parent(root, n.key)!;
		p.children = p.children.filter((c) => c.key !== n.key);
	}
}

export function duplicateNodes(root: Node, keys: string[]): string[] {
	return selectedRoots(root, keys).map((n) => {
		const p = parent(root, n.key)!,
			copy = clone(n);
		copy.attrs.transform = `translate(2 2) ${copy.attrs.transform || ''}`;
		p.children.splice(p.children.indexOf(n) + 1, 0, copy);
		return copy.key;
	});
}

export function groupNodes(root: Node, keys: string[]): string | null {
	const nodes = selectedRoots(root, keys),
		p = nodes[0] && parent(root, nodes[0].key);
	if (nodes.length < 2 || !p || nodes.some((n) => parent(root, n.key) !== p)) return null;
	const ordered = p.children.filter((n) => nodes.includes(n)),
		index = p.children.indexOf(ordered[0]),
		g = shape('g', {});
	g.children = ordered;
	p.children = p.children.filter((n) => !nodes.includes(n));
	p.children.splice(index, 0, g);
	return g.key;
}

export function ungroupNode(root: Node, group: Node): string[] {
	if (group.attrs.opacity && group.attrs.opacity !== '1')
		throw new Error('重なった塗りを保つため、グループの不透明度を外してから解除してください。');
	const p = parent(root, group.key)!;
	const inherited = Object.fromEntries(
		Object.entries(group.attrs).filter(([k]) => !['id', 'transform', 'opacity'].includes(k)),
	);
	for (const child of group.children) {
		child.attrs = { ...inherited, ...child.attrs };
		child.attrs.transform = `${group.attrs.transform || ''} ${child.attrs.transform || ''}`.trim();
	}
	p.children.splice(p.children.indexOf(group), 1, ...group.children);
	return group.children.filter(drawable).map((n) => n.key);
}

export function reorderNodes(root: Node, keys: string[], direction: number) {
	const nodes = selectedRoots(root, keys);
	if (direction > 0) nodes.reverse();
	for (const n of nodes) {
		const p = parent(root, n.key)!,
			i = p.children.indexOf(n),
			j = i + direction;
		if (j >= 0 && j < p.children.length && drawable(p.children[j]))
			[p.children[i], p.children[j]] = [p.children[j], p.children[i]];
	}
}

export function setMetadata(root: Node, tag: string, value: string) {
	if (tag === 'category') {
		root.attrs['data-category'] = value;
		return;
	}
	let node = root.children.find((n) => n.tag === tag);
	if (!node) {
		node = shape(tag, {});
		root.children.unshift(node);
	}
	node.text = value;
}

export function penCommands(pen: PenPoint[], closed = false): Command[] {
	const curve = (from: PenPoint, to: PenPoint): Command => ({
		type: 32,
		relative: false,
		x1: from.h.x,
		y1: from.h.y,
		x2: 2 * to.p.x - to.h.x,
		y2: 2 * to.p.y - to.h.y,
		...to.p,
	});
	const cs: Command[] = pen.map((point, i) => (i ? curve(pen[i - 1], point) : { type: 2, relative: false, ...point.p }));
	if (closed && pen.length > 2) cs.push(curve(pen.at(-1)!, pen[0]), { type: 1 });
	return cs;
}

export function shapeAttrs(kind: string, start: Point, end: Point, square: boolean): Record<string, string> {
	let q = end;
	if (square && kind !== 'line') {
		const length = Math.max(Math.abs(q.x - start.x), Math.abs(q.y - start.y));
		q = { x: start.x + Math.sign(q.x - start.x || 1) * length, y: start.y + Math.sign(q.y - start.y || 1) * length };
	}
	const x = Math.min(start.x, q.x),
		y = Math.min(start.y, q.y),
		w = Math.abs(q.x - start.x),
		h = Math.abs(q.y - start.y);
	if (kind === 'rect') return { x: num(x), y: num(y), width: num(w), height: num(h), rx: '2' };
	if (kind === 'ellipse') return { cx: num(x + w / 2), cy: num(y + h / 2), rx: num(w / 2), ry: num(h / 2) };
	return { x1: num(start.x), y1: num(start.y), x2: num(q.x), y2: num(q.y) };
}
