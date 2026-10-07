// On an icon detail page: agent-browser --session <name> eval --stdin < scripts/check-segment.js
(async () => {
	const assert = (ok, message) => { if (!ok) throw new Error(message); };
	const settle = () => new Promise((resolve) => setTimeout(resolve, 350));
	const group = document.querySelector('.segmented');
	const buttons = [...group.querySelectorAll('button')];
	const original = buttons.find((button) => button.getAttribute('aria-pressed') === 'true');
	const aligned = () => {
		const active = group.querySelector('[aria-pressed="true"]').getBoundingClientRect();
		const indicator = group.querySelector('.segment-indicator').getBoundingClientRect();
		assert(Math.abs(active.x - indicator.x) < 1 && Math.abs(active.width - indicator.width) < 1, 'Indicator must match the selected button');
	};
	try {
		await document.fonts.ready;
		await settle();
		aligned();
		for (const button of buttons) {
			button.click();
			await settle();
			aligned();
		}
		buttons[0].click();
		await new Promise((resolve) => setTimeout(resolve, 40));
		buttons[1].click();
		await settle();
		aligned();
		const padding = buttons[0].style.paddingInline;
		try {
			buttons[0].style.paddingInline = '30px';
			await settle();
			aligned();
		} finally {
			buttons[0].style.paddingInline = padding;
		}
		for (const button of document.querySelectorAll('.actions .button')) {
			assert(getComputedStyle(button).whiteSpace === 'nowrap', 'Action text must stay on one line');
			assert(button.scrollWidth <= button.clientWidth, 'Action text must fit inside its button');
			assert(button.getBoundingClientRect().right <= innerWidth, 'Action button must fit the viewport');
		}
		return 'PASS: selection, rapid switching, resize alignment, single-line actions';
	} finally {
		original.click();
	}
})()
