import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import { iconById } from '../icons.ts';
import { ConflictError, saveIcon } from './atelier.ts';

test('an edit conflict preserves the file', () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'atelier-'));
	const original = iconById.get('ramen')!.svg;
	const edited = original.replace('<title>ラーメン</title>', '<title>熱いラーメン</title>');
	saveIcon(dir, 'ramen', original, null);
	saveIcon(dir, 'ramen', edited, original);
	expect(() => saveIcon(dir, 'ramen', original, original)).toThrow(ConflictError);
	expect(() => saveIcon(dir, 'onigiri', original, original)).toThrow(ConflictError);
	expect(readFileSync(path.join(dir, 'ramen.svg'), 'utf8')).toBe(edited);
	expect(() => saveIcon(dir, '../outside', original, null)).toThrow('名前');
	expect(() => saveIcon(dir, 'broken', '<svg/>', null)).toThrow();
});

test('the local editor can read conflict content but rejects other origins and invalid IDs', async () => {
	const { createServer } = await import('vite');
	const { rmSync } = await import('node:fs');
	const { atelier } = await import('./atelier.ts');
	const dir = mkdtempSync(path.join(tmpdir(), 'atelier-http-'));
	const original = iconById.get('ramen')!.svg;
	saveIcon(dir, 'ramen', original, null);
	const server = await createServer({ configFile: false, root: dir, plugins: [atelier(dir)], server: { host: '127.0.0.1', port: 0 } });
	try {
		await server.listen();
		const address = server.httpServer!.address() as { port: number };
		const origin = `http://127.0.0.1:${address.port}`, url = `${origin}/__atelier/icons/ramen`;
		const response = await fetch(url);
		expect(response.status).toBe(200); expect((await response.json()).svg).toBe(original);
		expect((await fetch(url, { headers: { Origin: 'https://example.com' } })).status).toBe(403);
		expect((await fetch(`${origin}/__atelier/icons/%2e%2e%2foutside`)).status).toBe(400);
		const edited = original.replace('ラーメン', 'Edited');
		const post = (base: string) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ svg: edited, base }) });
		expect((await post(original)).status).toBe(200);
		expect((await post(original)).status).toBe(409);
		expect((await (await fetch(url)).json()).svg).toBe(edited);
	} finally { await server.close(); rmSync(dir, { recursive: true, force: true }); }
});
