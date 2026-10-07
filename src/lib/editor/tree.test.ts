import { describe, expect, it } from 'vitest';
import { encode, parse, serialize, walk } from './document.ts';
import {
	duplicateNodes,
	groupNodes,
	penCommands,
	removeNodes,
	reorderNodes,
	setMetadata,
	shapeAttrs,
	ungroupNode,
} from './tree.ts';

const svg =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><title>T</title><rect id="a" x="1" y="1" width="4" height="4"/><circle id="b" cx="20" cy="20" r="3"/><path id="c" d="M1 1L5 5"/></svg>';
const ids = (root: ReturnType<typeof parse>) => root.children.map((n) => n.attrs.id ?? n.tag);
const keyOf = (root: ReturnType<typeof parse>, id: string) => walk(root).find((n) => n.attrs.id === id)!.key;

describe('tree edits', () => {
	it('removes and duplicates selected roots', () => {
		const root = parse(svg);
		removeNodes(root, [keyOf(root, 'b')]);
		expect(ids(root)).toEqual(['title', 'a', 'c']);
		const [copy] = duplicateNodes(root, [keyOf(root, 'a')]);
		expect(root.children[2].key).toBe(copy);
		expect(root.children[2].attrs.transform).toBe('translate(2 2) ');
	});

	it('groups siblings in document order and ungroups with inherited attributes', () => {
		const root = parse(svg);
		const g = groupNodes(root, [keyOf(root, 'c'), keyOf(root, 'a')])!;
		expect(ids(root)).toEqual(['title', 'g', 'b']);
		const group = root.children[1];
		expect(group.key).toBe(g);
		expect(ids(group)).toEqual(['a', 'c']);
		group.attrs.stroke = '#C23B22';
		group.attrs.transform = 'translate(1 0)';
		ungroupNode(root, group);
		expect(ids(root)).toEqual(['title', 'a', 'c', 'b']);
		expect(root.children[1].attrs).toMatchObject({ stroke: '#C23B22', transform: 'translate(1 0)' });
		expect(groupNodes(root, [keyOf(root, 'a')])).toBeNull();
	});

	it('refuses to ungroup a translucent group', () => {
		const root = parse(svg);
		const g = groupNodes(root, [keyOf(root, 'a'), keyOf(root, 'b')]);
		const group = walk(root).find((n) => n.key === g)!;
		group.attrs.opacity = '.5';
		expect(() => ungroupNode(root, group)).toThrow();
	});

	it('reorders without passing title or desc', () => {
		const root = parse(svg);
		reorderNodes(root, [keyOf(root, 'a')], -1);
		expect(ids(root)).toEqual(['title', 'a', 'b', 'c']);
		reorderNodes(root, [keyOf(root, 'a')], 1);
		expect(ids(root)).toEqual(['title', 'b', 'a', 'c']);
	});

	it('writes metadata', () => {
		const root = parse(svg);
		setMetadata(root, 'desc', 'Note');
		setMetadata(root, 'category', '食事');
		expect(serialize(root)).toContain('<desc>Note</desc>');
		expect(root.attrs['data-category']).toBe('食事');
	});
});

describe('drawing geometry', () => {
	it('builds pen curves and closes them back to the first point', () => {
		const pen = [
			{ p: { x: 0, y: 0 }, h: { x: 0, y: 0 } },
			{ p: { x: 10, y: 0 }, h: { x: 12, y: 2 } },
			{ p: { x: 10, y: 10 }, h: { x: 10, y: 10 } },
		];
		expect(encode(penCommands(pen))).toBe('M0 0C0 0 8 -2 10 0C12 2 10 10 10 10');
		expect(encode(penCommands(pen, true))).toBe('M0 0C0 0 8 -2 10 0C12 2 10 10 10 10C10 10 0 0 0 0z');
	});

	it('normalizes dragged shapes and squares them on shift', () => {
		expect(shapeAttrs('rect', { x: 10, y: 10 }, { x: 4, y: 6 }, false)).toEqual({
			x: '4',
			y: '6',
			width: '6',
			height: '4',
			rx: '2',
		});
		expect(shapeAttrs('ellipse', { x: 0, y: 0 }, { x: 4, y: 10 }, true)).toEqual({ cx: '5', cy: '5', rx: '5', ry: '5' });
		expect(shapeAttrs('line', { x: 0, y: 0 }, { x: 4, y: 10 }, true)).toEqual({ x1: '0', y1: '0', x2: '4', y2: '10' });
	});
});
