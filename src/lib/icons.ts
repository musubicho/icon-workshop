import { iconInfo, themable } from './svg.ts';

const files = import.meta.glob<string>('../../icons/*.svg', { query: '?raw', import: 'default', eager: true });

export type Icon = ReturnType<typeof iconInfo> & { svg: string; markup: string };

export const icons: Icon[] = Object.entries(files)
	.map(([path, svg]) => ({ ...iconInfo(path.slice(path.lastIndexOf('/') + 1, -4), svg), svg, markup: themable(svg) }))
	.sort((a, b) => a.id.localeCompare(b.id));

export const iconById = new Map(icons.map((icon) => [icon.id, icon]));

export const categories = [...Map.groupBy(icons, (icon) => icon.category)]
	.map(([name, list]) => ({ name, count: list.length }))
	.sort((a, b) => b.count - a.count);

export const glyph = (id: string) => iconById.get(id)?.markup ?? '';
