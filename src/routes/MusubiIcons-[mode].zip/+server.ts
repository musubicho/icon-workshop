import { error } from '@sveltejs/kit';
import { icons } from '#lib/icons.ts';
import { exportIos } from '#lib/server/ios.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [{ mode: 'duo' }, { mode: 'mono' }];

export const GET: RequestHandler = ({ params }) => {
	if (params.mode !== 'duo' && params.mode !== 'mono') error(404, '書き出しは duo と mono だけです。');
	return new Response(exportIos(icons, params.mode) as BodyInit, {
		headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="MusubiIcons-${params.mode}.zip"` }
	});
};
