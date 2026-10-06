import { expect, test } from 'vitest';
import { icons } from './icons.ts';
import { exportSvg, themable } from './svg.ts';
import { validate } from './validate.ts';

const shell = (child: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${child}</svg>`;

test('every icon in the library is valid', () => {
	expect(icons.length).toBeGreaterThan(0);
	for (const icon of icons) expect(() => validate(icon.svg), icon.id).not.toThrow();
});

test('active content and invalid geometry are rejected', () => {
	for (const child of [
		'<script>alert(1)</script>',
		'<path onclick="alert(1)"/>',
		'<image href="https://example.com/a.png"/>',
		'<path fill="url(https://example.com/a)"/>',
		'<path style="fill:red"/>'
	]) {
		expect(() => validate(shell(child)), child).toThrow();
	}
	expect(() => validate(shell('<path/>').replace('48 48', '0 48'))).toThrow('viewBox');
	expect(() => validate('<svg viewBox="0 0 48 48"><path/></svg>')).toThrow();
	expect(() => validate('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path></svg>')).toThrow('形式');
	expect(() => validate('<!DOCTYPE svg><svg/>')).toThrow('DTD');
});

test('themable markup swaps palette paints for CSS hooks', () => {
	const ramen = icons.find((icon) => icon.id === 'ramen')!;
	const markup = themable(ramen.svg);
	expect(markup).toContain('data-s="ink"');
	expect(markup).toContain('data-s="accent"');
	expect(markup).not.toMatch(/<title>|data-category|width="48"/);
	expect(themable(shell('<path stroke="#123456"/>'))).toContain('data-s="other"');
});

test('exports recolor for theme, mono, and currentColor', () => {
	const source = shell('<path stroke="#C23B22" fill="none"/><path fill="#123456"/>');
	expect(exportSvg(source, 'duo', 'dark')).toContain('stroke="#FF7A5C"');
	expect(exportSvg(source, 'duo')).toContain('fill="#123456"');
	expect(exportSvg(source, 'mono')).toContain('fill="#453D35"');
	const current = exportSvg(source, 'current');
	expect(current).toContain('stroke="currentColor"');
	expect(current).toContain('fill="none"');
});
