import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { validate } from '../validate.ts';

export class ConflictError extends Error {}

export function saveIcon(dir: string, slug: string, source: unknown, base: unknown) {
	if (!/^[a-z][a-z0-9-]{0,63}$/.test(slug)) {
		throw new Error('名前は小文字の英字で始め、小文字、数字、ハイフンのみ、最大 64 文字です。');
	}
	const svg = validate(source);
	const file = path.join(dir, `${slug}.svg`);
	const exists = existsSync(file);
	if (exists && readFileSync(file, 'utf8') !== base) {
		throw new ConflictError('元ファイルが別の場所で変更されたか、同じ名前が既にあります。今のコードは残し、更新してからマージしてください。');
	}
	if (!exists && base != null) throw new ConflictError('元ファイルが別の場所へ移されました。今のコードは残し、更新して確認してください。');
	const temp = `${file}.${process.pid}.tmp`;
	try {
		writeFileSync(temp, svg);
		renameSync(temp, file);
	} finally {
		rmSync(temp, { force: true });
	}
	return { id: slug, svg };
}

function isLocal(req: IncomingMessage) {
	const host = req.headers.host ?? '';
	const hostname = host.replace(/:\d+$/, '');
	const origin = req.headers.origin ?? `http://${host}`;
	return ['localhost', '127.0.0.1'].includes(hostname) && origin === `http://${host}`;
}

async function readJson(req: IncomingMessage) {
	const length = Number(req.headers['content-length'] ?? 0);
	if (!(length > 0 && length <= 300_000) || req.headers['content-type'] !== 'application/json') {
		throw new Error('300 KB 以下の JSON リクエストが必要です。');
	}
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(chunk as Buffer);
	const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
	if (typeof body !== 'object' || body === null) throw new Error('svg と base を含む JSON オブジェクトが必要です。');
	return body as { svg?: unknown; base?: unknown };
}

function reply(res: ServerResponse, status: number, body: unknown) {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.setHeader('Cache-Control', 'no-store');
	res.end(JSON.stringify(body));
}

export function atelier(iconDir: string): Plugin {
	return {
		name: 'icon-atelier',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/__atelier/icons', async (req, res) => {
				if (!isLocal(req)) return reply(res, 403, { error: 'ローカルの同一オリジンのリクエストだけを受け付けます。' });
				if (req.method === 'GET') {
					const slug = (req.url ?? '').replace(/^\//, '').split('?')[0];
					if (!/^[a-z][a-z0-9-]{0,63}$/.test(slug)) return reply(res, 400, { error: 'Invalid icon ID.' });
					try { return reply(res, 200, { svg: readFileSync(path.join(iconDir, `${slug}.svg`), 'utf8') }); }
					catch { return reply(res, 404, { error: 'Icon not found.' }); }
				}
				if (req.method !== 'POST') return reply(res, 405, { error: 'GET / POST only.' });
				try {
					const body = await readJson(req);
					const slug = decodeURIComponent((req.url ?? '').replace(/^\//, '').split('?')[0]);
					reply(res, 200, saveIcon(iconDir, slug, body.svg, body.base));
				} catch (error) {
					reply(res, error instanceof ConflictError ? 409 : 400, { error: (error as Error).message });
				}
			});
		}
	};
}
