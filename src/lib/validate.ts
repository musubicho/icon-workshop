import { DOMParser } from '@xmldom/xmldom';

const NS = 'http://www.w3.org/2000/svg';
const ALLOWED = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'title', 'desc']);

export function validate(source: unknown): string {
	if (typeof source !== 'string' || !source || new TextEncoder().encode(source).length > 256_000) {
		throw new Error('SVG 不能为空，且不能超过 256 KB。');
	}
	if (/<!\s*(DOCTYPE|ENTITY)/i.test(source)) throw new Error('请移除 DTD 或实体声明，使用纯矢量 SVG。');
	let root: Element;
	try {
		root = new DOMParser({
			onError: (level, message) => {
				if (level !== 'warning') throw new Error(message);
			}
		}).parseFromString(source, 'text/xml').documentElement as unknown as Element;
	} catch (error) {
		throw new Error(`SVG 格式有误：${(error as Error).message}`);
	}
	if (!root || root.namespaceURI !== NS || root.localName !== 'svg') throw new Error('需要带 xmlns 的 SVG 根元素。');
	const box = (root.getAttribute('viewBox') ?? '').replace(/,/g, ' ').trim().split(/\s+/).map(Number);
	if (box.length !== 4 || !box.every(Number.isFinite) || Math.min(box[2], box[3]) <= 0) {
		throw new Error('需要有效的 viewBox，例如 0 0 48 48。');
	}
	for (const node of [root, ...Array.from(root.getElementsByTagName('*'))]) {
		if (node.namespaceURI !== NS || !ALLOWED.has(node.localName)) {
			throw new Error('第一版支持路径与基本形状；请将文字、效果或嵌入图片转换为矢量路径。');
		}
		for (const { name, value } of Array.from(node.attributes)) {
			const key = name.toLowerCase();
			if (key.startsWith('on') || key.includes('href') || key === 'style' || value.toLowerCase().includes('url(')) {
				throw new Error('请使用直接的 fill / stroke 属性，不使用脚本、外部引用或 CSS。');
			}
		}
	}
	return source;
}
