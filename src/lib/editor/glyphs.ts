const svg = (body: string) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const glyphs = {
	back: svg('<path d="M29 10 15 24l14 14"/>'),
	select: svg('<path d="M14 8.5 37 21.5l-10.6 3.4L22 36.5Z"/><path d="M28 29 34 38"/>'),
	node: svg('<path d="M24 15 33 24 24 33 15 24Z"/><path d="M5 24h6.2M36.8 24H43"/>'),
	pen: svg('<path d="M24 6 35 21l-5 15H18l-5-15Z"/><path d="M24 6v10M17 42h14"/><circle cx="24" cy="22" r="2.2" fill="currentColor" stroke="none"/>'),
	rect: svg('<rect x="8" y="12" width="32" height="24" rx="6"/>'),
	ellipse: svg('<ellipse cx="24" cy="24" rx="17" ry="12"/>'),
	line: svg('<path d="M11 37 37 11"/>'),
	hand: svg(
		'<path d="M17 25V12.5a2.75 2.75 0 0 1 5.5 0V22M22.5 21V9.5a2.75 2.75 0 0 1 5.5 0V22M28 22v-8.5a2.75 2.75 0 0 1 5.5 0V29q0 12-11 12q-6.5 0-10-5.5l-5-8a2.75 2.75 0 0 1 4.5-3L17 29"/>',
	),
	code: svg('<path d="M16 14 6 24l10 10M32 14l10 10-10 10M27 9.5 21 38.5"/>'),
	eye: svg('<path d="M5 24q8-12 19-12t19 12q-8 12-19 12T5 24Z"/><circle cx="24" cy="24" r="5.5"/>'),
	lock: svg('<rect x="11" y="21" width="26" height="20" rx="5"/><path d="M16.5 21v-5a7.5 7.5 0 0 1 15 0v5"/>'),
	unlock: svg('<rect x="11" y="21" width="26" height="20" rx="5"/><path d="M16.5 21v-5a7.5 7.5 0 0 1 14.6-2.4"/>'),
	forward: svg('<path d="M24 37V11M14 21l10-10 10 10"/>'),
	backward: svg('<path d="M24 11v26M14 27l10 10 10-10"/>'),
	'x-start': svg('<path d="M8 6v36M15 16h20M15 32h12"/>'),
	'x-center': svg('<path d="M24 6v4.4M24 20.6v6.8M24 37.6V42M12 16h24M16 32h16"/>'),
	'x-end': svg('<path d="M40 6v36M13 16h20M21 32h12"/>'),
	'x-distribute': svg('<path d="M8 8v32M40 8v32M24 14v20"/>'),
	'y-start': svg('<path d="M6 8h36M16 15v20M32 15v12"/>'),
	'y-center': svg('<path d="M6 24h4.4M20.6 24h6.8M37.6 24H42M16 12v24M32 16v16"/>'),
	'y-end': svg('<path d="M6 40h36M16 13v20M32 21v12"/>'),
	'y-distribute': svg('<path d="M8 8h32M8 40h32M14 24h20"/>'),
	plus: svg('<path d="M24 12v24M12 24h24"/>'),
	minus: svg('<path d="M12 24h24"/>'),
} as const;
