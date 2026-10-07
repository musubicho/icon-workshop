import { tick } from 'svelte';
import { themable } from '../svg.ts';
import { ancestors, commands, drawable, find, parse, serialize, walk, type Command, type Node, type Point } from './document.ts';
import { bounds, project, worldMatrix, type Box, type Frames } from './geometry.ts';
import { cancelDrag, finishPen } from './pointer.svelte.ts';
import type { PenPoint } from './tree.ts';

export const TOOLS = [
	{ id: 'select', label: '選択', key: 'V' },
	{ id: 'node', label: 'ノード', key: 'A' },
	{ id: 'pen', label: 'ペン', key: 'P' },
	{ id: 'rect', label: '四角形', key: 'R' },
	{ id: 'ellipse', label: '楕円', key: 'E' },
	{ id: 'line', label: '線', key: 'L' },
	{ id: 'hand', label: '手のひら', key: 'H' },
] as const;

export type Drag = {
	kind: string;
	start: Point;
	client: Point;
	tree: Node;
	snapshot: string;
	ids: string[];
	transforms: Frames;
	box: Box;
	part?: 'anchor' | 'in' | 'out';
	index?: number;
	matrix?: DOMMatrix;
	cmds?: Command[];
	originPan: Point;
};

export class EditorState {
	readonly id: string;
	readonly initial: string;
	root = $state<Node>({ key: '', tag: 'svg', attrs: {}, children: [], text: '' });
	base = $state('');
	source = $state('');
	code = $state('');
	selected = $state<string[]>([]);
	hidden = $state<string[]>([]);
	locked = $state<string[]>([]);
	undo = $state<string[]>([]);
	redo = $state<string[]>([]);
	tool = $state('select');
	grid = $state(true);
	snap = $state(true);
	guides = $state(true);
	proportional = $state(true);
	zoom = $state(1);
	pan = $state<Point>({ x: 0, y: 0 });
	showCode = $state(false);
	error = $state('');
	status = $state('');
	saving = $state(false);
	recovery = $state<{ base: string; snapshot: string } | null>(null);
	remote = $state<string | null>(null);
	nodeIndex = $state(-1);
	smooth = $state(false);
	space = $state(false);
	revision = $state(0);
	selectionBox = $state<Box | null>(null);
	marquee = $state<Box | null>(null);
	exportFormat = $state('svg');
	pen = $state<PenPoint[]>([]);
	svg!: SVGSVGElement;
	drag: Drag | null = null;
	codeBefore: string | null = null;
	codeTimer: ReturnType<typeof setTimeout> | undefined;
	penBefore = '';
	penKey = '';

	dirty = $derived(this.code !== this.base);
	active = $derived(this.selected.length === 1 ? find(this.root, this.selected[0]) : undefined);
	layers = $derived(walk(this.root).filter((n) => n !== this.root && drawable(n)));
	viewBox = $derived((this.root.attrs.viewBox || '0 0 48 48').split(/[\s,]+/).map(Number));
	preview = $derived(themable(this.source));
	pathCommands = $derived(this.active?.tag === 'path' ? commands(this.active.attrs.d || '') : []);
	zoomView = $derived.by(() => {
		const [x, y, w, h] = this.viewBox;
		return `${x - 12 / this.zoom + this.pan.x} ${y - 12 / this.zoom + this.pan.y} ${(w + 24) / this.zoom} ${(h + 24) / this.zoom}`;
	});
	art = $derived.by(() => {
		const copy = structuredClone($state.snapshot(this.root));
		const [x, y, w, h] = this.viewBox;
		Object.assign(copy.attrs, { width: String(w), height: String(h), overflow: 'visible', x: String(x), y: String(y) });
		return serialize(copy, true, this.hidden, this.locked);
	});
	handles = $derived.by(() => {
		void this.revision;
		const el = this.active && this.element(this.active.key);
		const matrix = el && worldMatrix(this.svg, el);
		if (!matrix || this.tool !== 'node') return [];
		const cs = this.pathCommands;
		return cs.flatMap((c, i) => {
			if (!('x' in c)) return [];
			const anchor = project(c, matrix);
			const items = [{ i, part: 'anchor' as const, p: anchor, anchor }];
			if (c.type !== 32) return items;
			const prev = cs[i - 1];
			return [
				...items,
				{ i, part: 'in' as const, p: project({ x: c.x2, y: c.y2 }, matrix), anchor },
				...(prev && 'x' in prev
					? [{ i, part: 'out' as const, p: project({ x: c.x1, y: c.y1 }, matrix), anchor: project(prev, matrix) }]
					: []),
			];
		});
	});

	get title() {
		return this.root.children.find((n) => n.tag === 'title')?.text || this.id;
	}

	constructor(id: string, initial: string) {
		this.id = id;
		this.initial = initial;
		this.root = parse(initial);
		this.base = this.source = this.code = initial;
	}

	snapshot() {
		return JSON.stringify({
			root: $state.snapshot(this.root),
			source: this.source,
			code: this.code,
			hidden: $state.snapshot(this.hidden),
			locked: $state.snapshot(this.locked),
		});
	}
	restore(value: string) {
		const s = JSON.parse(value);
		parse(s.source);
		parse(serialize(s.root));
		this.root = s.root;
		this.source = s.source;
		this.code = s.code;
		this.hidden = s.hidden;
		this.locked = s.locked;
		this.selected = [];
		this.nodeIndex = -1;
		this.error = '';
		try {
			const parsed = parse(this.code);
			if (this.source !== this.code) {
				this.root = parsed;
				this.source = this.code;
				this.hidden = [];
				this.locked = [];
			}
		} catch (e) {
			this.error = (e as Error).message;
		}
		this.updateGeometry();
	}
	remember(before: string) {
		if (before !== this.snapshot()) {
			this.undo = [...this.undo.slice(-99), before];
			this.redo = [];
		}
		this.persist();
	}
	persist() {
		if (this.recovery) return;
		try {
			if (this.dirty) localStorage.setItem(`atelier:${this.id}`, JSON.stringify({ base: this.base, snapshot: this.snapshot() }));
			else localStorage.removeItem(`atelier:${this.id}`);
		} catch {
			this.status = '下書きを保存できませんでした。閉じる前に保存するか書き出してください。';
		}
	}
	loadRecovery() {
		try {
			const raw = localStorage.getItem(`atelier:${this.id}`);
			if (raw) this.recovery = JSON.parse(raw);
		} catch {
			this.status = 'このブラウザでは下書きを復元できません。';
		}
	}
	publish() {
		this.source = serialize(this.root);
		this.code = this.source;
		this.error = '';
		this.updateGeometry();
	}
	change = (fn: () => void) => {
		this.flushCode();
		if (this.error) {
			this.status = 'キャンバスを編集する前に、壊れたソースを直すか取り消してください。';
			return;
		}
		finishPen(this);
		const before = this.snapshot();
		try {
			fn();
			parse(serialize(this.root));
			this.publish();
			this.remember(before);
		} catch (e) {
			this.restore(before);
			this.status = (e as Error).message;
		}
	};
	history(back = true) {
		if (this.drag) cancelDrag(this);
		this.flushCode();
		finishPen(this);
		const list = back ? this.undo : this.redo;
		if (!list.length) return;
		const now = this.snapshot(),
			value = list[list.length - 1];
		if (back) {
			this.undo = this.undo.slice(0, -1);
			this.redo = [...this.redo, now];
		} else {
			this.redo = this.redo.slice(0, -1);
			this.undo = [...this.undo, now];
		}
		this.restore(value);
		this.persist();
	}
	flushCode() {
		clearTimeout(this.codeTimer);
		if (this.codeBefore === null) return;
		const before = this.codeBefore;
		this.codeBefore = null;
		try {
			this.root = parse(this.code);
			this.source = this.code;
			this.error = '';
			this.selected = [];
			this.updateGeometry();
		} catch (e) {
			this.error = (e as Error).message;
		}
		this.remember(before);
	}
	inputCode(value: string) {
		finishPen(this);
		if (this.codeBefore === null) this.codeBefore = this.snapshot();
		clearTimeout(this.codeTimer);
		this.code = value;
		this.persist();
		this.codeTimer = setTimeout(() => this.flushCode(), 300);
	}
	element(key: string) {
		return this.svg?.querySelector<SVGGraphicsElement>(`[data-editor-key="${key}"]`) ?? null;
	}
	bounds(key: string) {
		const el = this.element(key);
		return el && bounds(this.svg, el);
	}
	async updateGeometry() {
		await tick();
		this.revision++;
		const boxes = this.selected.map((k) => this.bounds(k)).filter((b) => b !== null);
		if (!boxes.length) {
			this.selectionBox = null;
			return;
		}
		const x = Math.min(...boxes.map((b) => b.x)),
			y = Math.min(...boxes.map((b) => b.y));
		this.selectionBox = {
			x,
			y,
			width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
			height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
		};
	}
	blocked = (key: string) =>
		[key, ...ancestors(this.root, key).map((n) => n.key)].some((k) => this.hidden.includes(k) || this.locked.includes(k));
	select = (key: string, additive = false) => {
		if (this.blocked(key)) return;
		const s = this.selected;
		this.selected = additive ? (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]) : [key];
		this.nodeIndex = -1;
		this.updateGeometry();
	};
	choose = (value: string) => {
		finishPen(this);
		this.tool = value;
		this.nodeIndex = -1;
		this.updateGeometry();
	};
	setZoom(value: number) {
		const next = Math.max(0.35, Math.min(8, value));
		const [x, y, w, h] = this.viewBox;
		const cx = x + this.pan.x + w / (2 * this.zoom),
			cy = y + this.pan.y + h / (2 * this.zoom);
		this.pan = { x: cx - x - w / (2 * next), y: cy - y - h / (2 * next) };
		this.zoom = next;
		this.updateGeometry();
	}
}
