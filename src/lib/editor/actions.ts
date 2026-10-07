import { ancestors, commands, deletePoint, encode, selectedRoots, type Command } from './document.ts';
import { alignOffsets, applyMatrix, frames, transformMatrix } from './geometry.ts';
import type { EditorState } from './state.svelte.ts';
import { duplicateNodes, groupNodes, removeNodes, reorderNodes, setMetadata, ungroupNode } from './tree.ts';

const UNIT = ['opacity', 'fill-opacity'];
const SIZE = ['width', 'height', 'rx', 'ry', 'r', 'stroke-width'];

export function actions(s: EditorState) {
	const roots = () => selectedRoots(s.root, s.selected).map((n) => n.key);
	const editPath = (fn: (cs: Command[]) => void) =>
		s.change(() => {
			const node = s.active;
			if (node?.tag !== 'path') return;
			const cs = commands(node.attrs.d || '');
			fn(cs);
			node.attrs.d = encode(cs);
		});
	const moveBy = (matrix: DOMMatrix | null, ids = roots()) => {
		const transforms = frames(s.svg, ids);
		if (matrix) s.change(() => applyMatrix(s.root, ids, transforms, matrix));
	};

	return {
		editPath,
		moveBy,
		attr(name: string, value: string) {
			const n = Number(value);
			if (UNIT.includes(name) && (n < 0 || n > 1 || !Number.isFinite(n))) {
				s.status = '不透明度は 0 から 1 の間で入力してください。';
				return;
			}
			if (SIZE.includes(name) && (n < 0 || !Number.isFinite(n))) {
				s.status = 'サイズには 0 以上の数を入力してください。';
				return;
			}
			s.change(() => {
				for (const node of selectedRoots(s.root, s.selected)) {
					if (value === '') delete node.attrs[name];
					else node.attrs[name] = value;
				}
			});
		},
		inherited(name: string, fallback: string) {
			const a = s.active;
			return a ? ([a, ...ancestors(s.root, a.key)].find((n) => n.attrs[name] != null)?.attrs[name] ?? fallback) : fallback;
		},
		remove() {
			if (s.tool === 'node' && s.nodeIndex >= 0) {
				const i = s.nodeIndex;
				editPath((cs) => deletePoint(cs, i));
				s.nodeIndex = -1;
				return;
			}
			s.change(() => {
				removeNodes(s.root, s.selected);
				s.selected = [];
			});
		},
		duplicate() {
			s.change(() => (s.selected = duplicateNodes(s.root, s.selected)));
		},
		group() {
			s.change(() => {
				const key = groupNodes(s.root, s.selected);
				if (key) s.selected = [key];
				else s.status = '同じ親を持つ要素を 2 つ以上選んでください。';
			});
		},
		ungroup() {
			s.change(() => {
				if (s.active?.tag === 'g') s.selected = ungroupNode(s.root, s.active);
			});
		},
		reorder(direction: number) {
			s.change(() => reorderNodes(s.root, s.selected, direction));
		},
		toggle(key: string, which: 'hidden' | 'locked') {
			const before = s.snapshot();
			const list = s[which];
			s[which] = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
			s.selected = s.selected.filter((k) => !s.blocked(k));
			s.remember(before);
			s.updateGeometry();
		},
		transform(kind: string, value: number) {
			if (s.selectionBox && Number.isFinite(value))
				moveBy(transformMatrix(kind, value, { ...s.selectionBox }, s.proportional));
		},
		align(axis: 'x' | 'y', mode: string) {
			const items = roots()
				.map((id) => ({ id, b: s.bounds(id) }))
				.filter((i) => i.b !== null);
			if (!items.length) return;
			const ids = items.map((i) => i.id),
				transforms = frames(s.svg, ids),
				offsets = alignOffsets(
					items.map((i) => i.b!),
					axis,
					mode,
					s.viewBox,
				);
			s.change(() =>
				ids.forEach((id, i) =>
					applyMatrix(
						s.root,
						[id],
						transforms,
						new DOMMatrix().translate(axis === 'x' ? offsets[i] : 0, axis === 'y' ? offsets[i] : 0),
					),
				),
			);
		},
		metadata(tag: string, value: string) {
			s.change(() => setMetadata(s.root, tag, value));
		},
	};
}

export type Actions = ReturnType<typeof actions>;
