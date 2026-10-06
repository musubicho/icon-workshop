export const site = {
	name: 'Nyatabi Icons',
	origin: 'https://icons.nyatabi.app',
	title: 'Nyatabi Icons · 旅の小さなことを、アイコンにする',
	description: 'Nyatabi の帳簿と旅程で使う、丸みのある線のアイコン。SVG 原稿と iOS アセットの書き出し。',
	locale: 'ja_JP',
	image: '/og.png',
	imageWidth: 1200,
	imageHeight: 630,
	imageAlt: 'Nyatabi Icons。旅の小さなことを、アイコンにする。'
} as const;

export const pageUrl = (path: string) => new URL(path, site.origin).href;
