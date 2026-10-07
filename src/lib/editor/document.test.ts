import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import {
	commands,
	encode,
	parse,
	serialize,
	walk,
	movePoint,
	splitSegment,
	deletePoint,
	breakPoint,
	toggleClosed,
	toPath,
	shape,
	selectedRoots,
} from './document.ts';
import { SVGPathData } from 'svg-pathdata';

describe('SVG document editing', () => {
	it('preserves the geometry and metadata of every repository icon through editing round trips', () => {
		for (const file of readdirSync('icons').filter((f) => f.endsWith('.svg'))) {
			const source = readFileSync(`icons/${file}`, 'utf8'),
				root = parse(source),
				next = parse(serialize(root));
			expect(
				walk(next).map(({ tag, attrs, text }) => ({ tag, attrs, text })),
				file,
			).toEqual(walk(root).map(({ tag, attrs, text }) => ({ tag, attrs, text })));
			for (const path of walk(root).filter((n) => n.tag === 'path')) {
				const before = new SVGPathData(path.attrs.d).getBounds(),
					after = new SVGPathData(encode(commands(path.attrs.d))).getBounds();
				for (const k of ['minX', 'minY', 'maxX', 'maxY'] as const)
					expect(after[k], `${file} ${k}`).toBeCloseTo(before[k], 2);
			}
		}
	});
	it('moves an anchor and attached handles without moving a following subpath', () => {
		const cs = commands('M0 0C1 0 3 4 4 4C5 4 7 6 8 6M10 10L12 12');
		movePoint(cs, 1, 'anchor', { x: 6, y: 7 });
		expect(encode(cs)).toBe('M0 0C1 0 5 7 6 7C7 7 7 6 8 6M10 10L12 12');
	});
	it('keeps a closed curve joined when moving its seam anchor', () => {
		const cs = commands('M2 0A2 2 0 1 0 -2 0A2 2 0 1 0 2 0Z');
		movePoint(cs, 0, 'anchor', { x: 3, y: 1 });
		const last = cs.at(-2)!;
		expect('x' in last && last.x).toBeCloseTo(3);
		expect('y' in last && last.y).toBeCloseTo(1);
		expect(cs.at(-1)?.type).toBe(1);
	});
	it('breaks a closed path without losing its closing edge', () => {
		const cs = commands('M0 0L10 0L10 10Z');
		breakPoint(cs, 1);
		expect(encode(cs)).toBe('M0 0L10 0M10 0L10 10L0 0');
	});
	it('splits a Bézier without altering its bounds or endpoint', () => {
		const cs = commands('M0 0C0 12 12 12 12 0');
		splitSegment(cs, 1);
		expect(encode(cs)).toBe('M0 0C0 6 3 9 6 9C9 9 12 6 12 0');
		const bounds = new SVGPathData(encode(cs)).getBounds();
		expect(bounds.maxY).toBe(9);
	});
	it('deletes a subpath start without joining unrelated subpaths', () => {
		const cs = commands('M0 0L1 1M4 4L5 5L6 6Z');
		deletePoint(cs, 2);
		expect(encode(cs)).toBe('M0 0L1 1M5 5L6 6z');
		toggleClosed(cs, 2);
		expect(encode(cs)).toBe('M0 0L1 1M5 5L6 6');
	});
	it('converts rounded rectangles without dropping paint or transforms', () => {
		const node = shape('rect', {
			x: '2',
			y: '3',
			width: '20',
			height: '12',
			rx: '3',
			stroke: '#C23B22',
			transform: 'rotate(20)',
		});
		toPath(node);
		const b = new SVGPathData(node.attrs.d).getBounds();
		expect([b.minX, b.minY, b.maxX, b.maxY]).toEqual([2, 3, 22, 15]);
		expect(node.attrs.stroke).toBe('#C23B22');
		expect(node.attrs.transform).toBe('rotate(20)');
	});
	it('does not apply transforms twice when parent and child are selected', () => {
		const root = parse('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g><path d="M1 1L2 2"/></g></svg>');
		const g = root.children[0];
		expect(selectedRoots(root, [g.key, g.children[0].key])).toEqual([g]);
	});
	it('does not persist editor IDs, visibility or locks to originals', () => {
		const root = parse(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="5" cy="5" r="2"/></svg>',
		);
		expect(serialize(root, true, [root.children[0].key])).toContain('display="none"');
		expect(serialize(root)).not.toContain('display=');
		expect(serialize(root)).not.toContain('data-editor');
	});
	it('rejects malformed paths and active content before reaching the canvas', () => {
		expect(() =>
			parse('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M1 nope"/></svg>'),
		).toThrow();
		expect(() =>
			parse('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><script>alert(1)</script></svg>'),
		).toThrow();
	});
});
