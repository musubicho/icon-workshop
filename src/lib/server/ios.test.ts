import { unzipSync, strFromU8 } from 'fflate';
import { expect, test } from 'vitest';
import { icons } from '../icons.ts';
import { validate } from '../validate.ts';
import { exportIos } from './ios.ts';

test('export contains loadable assets in both appearances', () => {
	for (const mode of ['duo', 'mono'] as const) {
		const files = unzipSync(exportIos(icons, mode));
		const sets = Object.keys(files).filter((name) => name.endsWith('.imageset/Contents.json'));
		expect(sets).toHaveLength(icons.length);
		for (const name of sets) {
			const folder = name.slice(0, name.lastIndexOf('/') + 1);
			const contents = JSON.parse(strFromU8(files[name]));
			const images = contents.images.map((image: { filename: string }) => strFromU8(files[folder + image.filename]));
			for (const svg of images) {
				validate(svg);
				expect(svg).toContain('width="24"');
			}
			expect(contents.properties['template-rendering-intent']).toBe(mode === 'mono' ? 'template' : 'original');
			if (mode === 'duo') expect(images[0]).not.toBe(images[1]);
		}
	}
});
