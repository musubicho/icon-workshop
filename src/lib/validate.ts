import { DOMParser } from '@xmldom/xmldom';

const NS = 'http://www.w3.org/2000/svg';
const ALLOWED = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'title', 'desc']);

export function validate(source: unknown): string {
	if (typeof source !== 'string' || !source || new TextEncoder().encode(source).length > 256_000) {
		throw new Error('SVG は空にできず、256 KB を超えられません。');
	}
	if (/<!\s*(DOCTYPE|ENTITY)/i.test(source)) throw new Error('DTD や実体宣言を外し、純粋なベクター SVG を使ってください。');
	let root: Element;
	try {
		root = new DOMParser({
			onError: (level, message) => {
				if (level !== 'warning') throw new Error(message);
			}
		}).parseFromString(source, 'text/xml').documentElement as unknown as Element;
	} catch (error) {
		throw new Error(`SVG の形式が正しくありません：${(error as Error).message}`);
	}
	if (!root || root.namespaceURI !== NS || root.localName !== 'svg') throw new Error('xmlns 付きの SVG ルート要素が必要です。');
	const box = (root.getAttribute('viewBox') ?? '').replace(/,/g, ' ').trim().split(/\s+/).map(Number);
	if (box.length !== 4 || !box.every(Number.isFinite) || Math.min(box[2], box[3]) <= 0) {
		throw new Error('有効な viewBox が必要です。例：0 0 48 48。');
	}
	for (const node of [root, ...Array.from(root.getElementsByTagName('*'))]) {
		if (node.namespaceURI !== NS || !ALLOWED.has(node.localName)) {
			throw new Error('第一版はパスと基本図形だけです。文字、効果、埋め込み画像はベクターパスにしてください。');
		}
		for (const { name, value } of Array.from(node.attributes)) {
			const key = name.toLowerCase();
			if (key.startsWith('on') || key.includes('href') || key === 'style' || value.toLowerCase().includes('url(')) {
				throw new Error('fill / stroke は属性で直接指定し、スクリプト、外部参照、CSS は使わないでください。');
			}
		}
	}
	return source;
}
