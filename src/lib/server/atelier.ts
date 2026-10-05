import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { validate } from '../validate.ts';

export class ConflictError extends Error {}

export function saveIcon(dir: string, slug: string, source: unknown, base: unknown) {
	if (!/^[a-z][a-z0-9-]{0,63}$/.test(slug)) {
		throw new Error('名称需以小写字母开头，仅含小写字母、数字和短横线，最多 64 个字符。');
	}
	const svg = validate(source);
	const file = path.join(dir, `${slug}.svg`);
	const exists = existsSync(file);
	if (exists && readFileSync(file, 'utf8') !== base) {
		throw new ConflictError('源文件已在别处修改，或名称已存在。请保留当前代码，刷新后合并。');
	}
	if (!exists && base != null) throw new ConflictError('源文件已在别处移走。请保留当前代码，刷新后检查。');
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
		throw new Error('需要不超过 300 KB 的 JSON 请求。');
	}
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(chunk as Buffer);
	const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
	if (typeof body !== 'object' || body === null) throw new Error('需要包含 svg 和 base 的 JSON 对象。');
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
				if (!isLocal(req)) return reply(res, 403, { error: '只接受本地同源请求。' });
				if (req.method !== 'POST') return reply(res, 405, { error: '只接受 POST。' });
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
