import { strToU8, zipSync, type Zippable } from 'fflate';
import { exportSvg, glyph, resize, type Mode } from './svg.ts';

const INFO = { info: { author: 'xcode', version: 1 } };
const json = (value: unknown) => strToU8(JSON.stringify(value, null, 2));

export function exportIos(icons: { id: string; svg: string }[], mode: Mode): Uint8Array {
	const files: Zippable = { 'MusubiIcons.xcassets/Contents.json': json(INFO) };
	for (const { id, svg } of icons) {
		const prefix = `MusubiIcons.xcassets/musubi-${id}.imageset/`;
		const source = resize(svg, 24);
		const images: Record<string, unknown>[] = [{ filename: 'light.svg', idiom: 'universal' }];
		files[prefix + 'light.svg'] = strToU8(exportSvg(source, mode));
		if (mode === 'duo') {
			images.push({ filename: 'dark.svg', idiom: 'universal', appearances: [{ appearance: 'luminosity', value: 'dark' }] });
			files[prefix + 'dark.svg'] = strToU8(exportSvg(source, mode, 'dark'));
		}
		files[prefix + 'Contents.json'] = json({
			...INFO,
			images,
			properties: {
				'preserves-vector-representation': true,
				'template-rendering-intent': mode === 'mono' ? 'template' : 'original'
			}
		});
		const glyphPrefix = `MusubiIcons.xcassets/musubi-${id}-glyph.imageset/`;
		files[glyphPrefix + 'glyph.svg'] = strToU8(glyph(source));
		files[glyphPrefix + 'Contents.json'] = json({
			...INFO,
			images: [{ filename: 'glyph.svg', idiom: 'universal' }],
			properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'template' }
		});
	}
	return zipSync(files);
}
