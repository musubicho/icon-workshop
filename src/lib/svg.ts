export const PALETTE = {
	ink: ['#453D35', '#EFE4D7'],
	accent: ['#C23B22', '#FF7A5C'],
	gold: ['#8A6200', '#E0A526'],
	green: ['#53765A', '#9FBC91']
} as const;

export type Mode = 'duo' | 'mono';
export type Theme = 'light' | 'dark';
export type PaintKey = keyof typeof PALETTE | 'other';

const PAINT = /(\s)(fill|stroke)="([^"]*)"/g;
const ENTITIES: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&apos;': "'" };

const decode = (text: string) => text.replace(/&(lt|gt|amp|quot|apos);/g, (entity) => ENTITIES[entity]).trim();
const text = (source: string, tag: string) => {
	const match = source.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
	return match ? decode(match[1]) : '';
};

export function iconInfo(id: string, source: string) {
	return {
		id,
		name: text(source, 'title') || id,
		desc: text(source, 'desc'),
		category: source.match(/data-category="([^"]+)"/)?.[1] ?? '其他'
	};
}

function paintKey(value: string): PaintKey | null {
	const color = value.toLowerCase();
	if (color === 'none' || color === 'transparent') return null;
	const entry = Object.entries(PALETTE).find(([, pair]) => pair.some((hex) => hex.toLowerCase() === color));
	return (entry?.[0] as PaintKey) ?? 'other';
}

const stripData = (source: string) => source.replace(/\sdata-[a-z-]+="[^"]*"/g, '');

const rootTag = (source: string, edit: (tag: string) => string) => source.replace(/<svg\b[^>]*>/, edit);

export function themable(source: string): string {
	const marked = stripData(source)
		.replace(/\s*<(title|desc)>[^<]*<\/\1>/g, '')
		.replace(PAINT, (match, _space, attr, value) => {
			const key = paintKey(value);
			return key ? `${match} data-${attr[0]}="${key}"` : match;
		});
	return rootTag(marked, (tag) => tag.replace(/\s(width|height)="[^"]*"/g, '').replace('<svg', '<svg aria-hidden="true"'));
}

export function exportSvg(source: string, mode: Mode | 'current', theme: Theme = 'light'): string {
	const index = theme === 'dark' ? 1 : 0;
	return stripData(source).replace(PAINT, (match, space, attr, value) => {
		const key = paintKey(value);
		if (!key) return match;
		let color: string;
		if (mode === 'current') color = 'currentColor';
		else if (mode === 'mono') color = PALETTE.ink[index];
		else color = key === 'other' ? value : PALETTE[key][index];
		return `${space}${attr}="${color}"`;
	});
}

export function resize(source: string, size: number): string {
	return rootTag(source, (tag) => tag.replace(/\swidth="[^"]*"/, ` width="${size}"`).replace(/\sheight="[^"]*"/, ` height="${size}"`));
}
