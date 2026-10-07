import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { SVGPathData, SVGPathDataTransformer } from 'svg-pathdata';
import type { CommandC, CommandL, CommandM, CommandZ } from 'svg-pathdata';
import { validate } from '../validate.ts';

export type Node = { key: string; tag: string; attrs: Record<string, string>; children: Node[]; text: string };
export type Point = { x: number; y: number };
export type Command = CommandM | CommandL | CommandC | CommandZ;
export const key = () => `e${crypto.randomUUID()}`;
export const drawable = (node: Node) => !['title', 'desc'].includes(node.tag);
export function parse(source: string): Node {
	validate(source);
	const root = new DOMParser().parseFromString(source, 'text/xml').documentElement!;
	function read(el: typeof root): Node {
		const node: Node = {
			key: key(),
			tag: el.tagName,
			attrs: Object.fromEntries(Array.from(el.attributes).map((a) => [a.name, a.value])),
			children: [],
			text: '',
		};
		if (node.tag === 'path') commands(node.attrs.d || '');
		for (const child of Array.from(el.childNodes)) {
			if (child.nodeType === 1) node.children.push(read(child as typeof root));
			else if (child.nodeType === 3 && child.nodeValue?.trim()) node.text += child.nodeValue;
		}
		return node;
	}
	return read(root);
}
export function serialize(root: Node, canvas = false, hidden: string[] = [], locked: string[] = []): string {
	const document = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg"/>', 'text/xml');
	function write(node: Node, depth = 0): ReturnType<typeof document.createElementNS> {
		const el = document.createElementNS('http://www.w3.org/2000/svg', node.tag);
		for (const [name, value] of Object.entries(node.attrs)) el.setAttribute(name, value);
		if (canvas) {
			el.setAttribute('data-editor-key', node.key);
			if (hidden.includes(node.key)) el.setAttribute('display', 'none');
			if (locked.includes(node.key)) el.setAttribute('pointer-events', 'none');
		}
		if (node.text) el.appendChild(document.createTextNode(node.text));
		for (const child of node.children) {
			if (!canvas) el.appendChild(document.createTextNode('\n' + '  '.repeat(depth + 1)));
			el.appendChild(write(child, depth + 1));
		}
		if (!canvas && node.children.length) el.appendChild(document.createTextNode('\n' + '  '.repeat(depth)));
		return el;
	}
	return new XMLSerializer().serializeToString(write(root)) + (canvas ? '' : '\n');
}
export function walk(root: Node): Node[] {
	return [root, ...root.children.flatMap(walk)];
}
export function find(root: Node, id: string): Node | undefined {
	return walk(root).find((n) => n.key === id);
}
export function parent(root: Node, id: string): Node | undefined {
	return walk(root).find((n) => n.children.some((c) => c.key === id));
}
export function selectedRoots(root: Node, ids: string[]): Node[] {
	return walk(root).filter((n) => ids.includes(n.key) && !ancestors(root, n.key).some((p) => ids.includes(p.key)));
}
export function ancestors(root: Node, id: string): Node[] {
	const p = parent(root, id);
	return p ? [p, ...ancestors(root, p.key)] : [];
}
export function clone(node: Node): Node {
	const id = key();
	const attrs = { ...node.attrs };
	if (attrs.id) attrs.id += `-copy-${id.slice(-8)}`;
	return { ...node, key: id, attrs, children: node.children.map(clone) };
}
export function shape(tag: string, attrs: Record<string, string>): Node {
	return { key: key(), tag, attrs, children: [], text: '' };
}
export const number = (value: number) => String(Math.round(value * 10000) / 10000);
export const commands = (d: string): Command[] =>
	new SVGPathData(d)
		.toAbs()
		.transform(SVGPathDataTransformer.NORMALIZE_HVZ(false, true, true, false))
		.normalizeST()
		.qtToC()
		.aToC().commands as Command[];
export const encode = (cmds: Command[]) => new SVGPathData(cmds).round(1e4).encode();
export function movePoint(cmds: Command[], i: number, part: 'anchor' | 'in' | 'out', p: Point, smooth = false) {
	const c = cmds[i];
	if (!c || c.type === SVGPathData.CLOSE_PATH) return;
	if (part === 'anchor') {
		const dx = p.x - c.x,
			dy = p.y - c.y;
		let start = i,
			end = i + 1;
		while (start > 0 && cmds[start].type !== 2) start--;
		while (end < cmds.length && cmds[end].type !== 2) end++;
		const first = cmds[start],
			last = cmds[end - 2];
		if (
			cmds[end - 1]?.type === 1 &&
			first &&
			last &&
			'x' in first &&
			'x' in last &&
			last !== first &&
			Math.hypot(first.x - last.x, first.y - last.y) < 1e-7
		) {
			const paired = i === start ? last : i === end - 2 ? first : null;
			if (paired) {
				paired.x += dx;
				paired.y += dy;
				if (paired.type === 32) {
					paired.x2 += dx;
					paired.y2 += dy;
				}
				if (paired === first) {
					const next = cmds[start + 1];
					if (next?.type === 32) {
						next.x1 += dx;
						next.y1 += dy;
					}
				}
			}
		}
		c.x = p.x;
		c.y = p.y;
		if (c.type === SVGPathData.CURVE_TO) {
			c.x2 += dx;
			c.y2 += dy;
		}
		const next = cmds[i + 1];
		if (next?.type === SVGPathData.CURVE_TO) {
			next.x1 += dx;
			next.y1 += dy;
		}
	} else if (c.type === SVGPathData.CURVE_TO) {
		if (part === 'in') {
			c.x2 = p.x;
			c.y2 = p.y;
		} else {
			c.x1 = p.x;
			c.y1 = p.y;
		}
		if (smooth) {
			const anchor = part === 'in' ? c : cmds[i - 1];
			const opposite = part === 'in' ? cmds[i + 1] : cmds[i - 1];
			if (anchor && 'x' in anchor && opposite?.type === SVGPathData.CURVE_TO) {
				if (part === 'in') {
					opposite.x1 = 2 * anchor.x - p.x;
					opposite.y1 = 2 * anchor.y - p.y;
				} else {
					opposite.x2 = 2 * anchor.x - p.x;
					opposite.y2 = 2 * anchor.y - p.y;
				}
			}
		}
	}
}
const mix = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export function splitSegment(cmds: Command[], i: number) {
	const c = cmds[i],
		previous = cmds[i - 1];
	if (!previous || !('x' in previous) || !c || c.type === 1 || c.type === 2) return;
	if (c.type === 16) {
		cmds.splice(i, 0, { type: 16, relative: false, ...mix(previous, c) });
	} else {
		const a = mix(previous, { x: c.x1, y: c.y1 }),
			b = mix({ x: c.x1, y: c.y1 }, { x: c.x2, y: c.y2 }),
			z = mix({ x: c.x2, y: c.y2 }, c);
		const d = mix(a, b),
			e = mix(b, z),
			m = mix(d, e);
		cmds.splice(
			i,
			1,
			{ type: 32, relative: false, x1: a.x, y1: a.y, x2: d.x, y2: d.y, ...m },
			{ ...c, x1: e.x, y1: e.y, x2: z.x, y2: z.y },
		);
	}
}
export function deletePoint(cmds: Command[], i: number) {
	const c = cmds[i];
	if (!c || c.type === 1) return;
	if (c.type === 2) {
		const next = cmds[i + 1];
		if (next && 'x' in next && next.type !== 2) cmds[i + 1] = { type: 2, relative: false, x: next.x, y: next.y };
		else if (next?.type === 1) cmds.splice(i + 1, 1);
	}
	cmds.splice(i, 1);
}
export function pointKind(cmds: Command[], i: number, smooth: boolean) {
	const c = cmds[i];
	if (!c || !('x' in c)) return;
	const prev = cmds[i - 1],
		next = cmds[i + 1];
	const incoming = prev && 'x' in prev && c.type !== 2;
	const outgoing = next && 'x' in next && next.type !== 2;
	const a = incoming ? prev : c,
		b = outgoing ? next : c;
	const angle = Math.atan2(b.y - a.y, b.x - a.x);
	if (incoming) {
		const len = smooth ? Math.hypot(c.x - prev.x, c.y - prev.y) / 3 : 0;
		cmds[i] = {
			type: 32,
			relative: false,
			x: c.x,
			y: c.y,
			x1: c.type === 32 ? c.x1 : prev.x,
			y1: c.type === 32 ? c.y1 : prev.y,
			x2: c.x - Math.cos(angle) * len,
			y2: c.y - Math.sin(angle) * len,
		};
	}
	if (outgoing) {
		const len = smooth ? Math.hypot(next.x - c.x, next.y - c.y) / 3 : 0;
		cmds[i + 1] = {
			type: 32,
			relative: false,
			x: next.x,
			y: next.y,
			x1: c.x + Math.cos(angle) * len,
			y1: c.y + Math.sin(angle) * len,
			x2: next.type === 32 ? next.x2 : next.x,
			y2: next.type === 32 ? next.y2 : next.y,
		};
	}
}
export function breakPoint(cmds: Command[], i: number) {
	const c = cmds[i];
	if (!c || !('x' in c) || c.type === 2) return;
	// Open the affected subpath; following segments start from a duplicate anchor.
	let end = i + 1;
	while (end < cmds.length && cmds[end].type !== 2) end++;
	if (cmds[end - 1]?.type === 1) {
		let start = i;
		while (start > 0 && cmds[start].type !== 2) start--;
		const first = cmds[start];
		if ('x' in first) cmds[end - 1] = { type: 16, relative: false, x: first.x, y: first.y };
	}
	cmds.splice(i + 1, 0, { type: 2, relative: false, x: c.x, y: c.y });
}
export function toggleClosed(cmds: Command[], i: number) {
	let start = Math.max(0, i);
	while (start > 0 && cmds[start].type !== 2) start--;
	let end = start + 1;
	while (end < cmds.length && cmds[end].type !== 2) end++;
	if (cmds[end - 1]?.type === 1) cmds.splice(end - 1, 1);
	else cmds.splice(end, 0, { type: 1 });
}
export function toPath(node: Node) {
	const a = node.attrs,
		n = (k: string, fallback = 0) => Number(a[k] ?? fallback);
	let d = '';
	if (node.tag === 'path') return;
	if (node.tag === 'line') d = `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
	if (node.tag === 'polyline' || node.tag === 'polygon') d = `M${a.points || ''}${node.tag === 'polygon' ? 'Z' : ''}`;
	if (node.tag === 'circle' || node.tag === 'ellipse') {
		const x = n('cx'),
			y = n('cy'),
			rx = n('rx', n('r')),
			ry = n('ry', n('r'));
		d = `M${x - rx} ${y}A${rx} ${ry} 0 1 0 ${x + rx} ${y}A${rx} ${ry} 0 1 0 ${x - rx} ${y}Z`;
	}
	if (node.tag === 'rect') {
		const x = n('x'),
			y = n('y'),
			w = n('width'),
			h = n('height'),
			rx = Math.min(w / 2, n('rx', n('ry'))),
			ry = Math.min(h / 2, n('ry', n('rx')));
		d =
			rx && ry
				? `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`
				: `M${x} ${y}h${w}v${h}h${-w}Z`;
	}
	if (!d) throw new Error('Select a basic shape to convert.');
	for (const k of ['x', 'y', 'width', 'height', 'rx', 'ry', 'r', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2', 'points'])
		delete a[k];
	node.tag = 'path';
	a.d = d;
}
