import { icons } from '#lib/icons.ts';
import { pageUrl } from '#lib/site.ts';

export const prerender = true;

const paths = ['/', ...icons.map((icon) => `/icon/${icon.id}`)];

export const GET = () =>
	new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
			.map((path) => `  <url><loc>${pageUrl(path)}</loc></url>`)
			.join('\n')}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
