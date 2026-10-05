import { error } from '@sveltejs/kit';
import { iconById, icons } from '#lib/icons.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => icons.map(({ id }) => ({ id }));

export const load: PageLoad = ({ params }) => {
	const icon = iconById.get(params.id);
	if (!icon) error(404, '没有这枚图标。');
	return { icon };
};
