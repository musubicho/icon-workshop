import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import { iconById } from '../icons.ts';
import { ConflictError, saveIcon } from './atelier.ts';

test('an edit conflict preserves the file', () => {
	const dir = mkdtempSync(path.join(tmpdir(), 'atelier-'));
	const original = iconById.get('ramen')!.svg;
	const edited = original.replace('<title>拉面</title>', '<title>热拉面</title>');
	saveIcon(dir, 'ramen', original, null);
	saveIcon(dir, 'ramen', edited, original);
	expect(() => saveIcon(dir, 'ramen', original, original)).toThrow(ConflictError);
	expect(() => saveIcon(dir, 'onigiri', original, original)).toThrow(ConflictError);
	expect(readFileSync(path.join(dir, 'ramen.svg'), 'utf8')).toBe(edited);
	expect(() => saveIcon(dir, '../outside', original, null)).toThrow('名称');
	expect(() => saveIcon(dir, 'broken', '<svg/>', null)).toThrow();
});
