// Browser regression check. Start pnpm dev first; requires agent-browser and Chrome.
// Uses its own browser session and mocks writes so repository icons stay untouched.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const session = `atelier-check-${process.pid}`;
const base = process.argv[2] || 'http://127.0.0.1:4173';
function browser(...args) {
	const result = spawnSync('agent-browser', ['--session', session, ...args, '--json'], { encoding: 'utf8' });
	if (result.status !== 0) throw new Error(result.stderr || result.stdout);
	const output = JSON.parse(result.stdout);
	if (!output.success) throw new Error(JSON.stringify(output.error));
	return output.data;
}
const evaluate = (code) => browser('eval', code).result;
const button = (name) => browser('find', 'role', 'button', 'click', '--name', name);
const wait = () => browser('wait', '380');
const source = () => evaluate('document.querySelector("textarea[aria-label=\\\"SVG ソース\\\"]").value');
function setSource(value) {
	evaluate(
		`(() => { const input = document.querySelector('textarea[aria-label="SVG ソース"]'); input.value = ${JSON.stringify(value)}; input.dispatchEvent(new Event('input', { bubbles: true })); })()`,
	);
	wait();
}
function drag(selector, dx, dy) {
	const p = evaluate(
		`(() => { const b = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x:b.x+b.width/2,y:b.y+b.height/2 }; })()`,
	);
	assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), JSON.stringify(p));
	browser('mouse', 'move', String(Math.round(p.x)), String(Math.round(p.y)));
	browser('mouse', 'down');
	browser('mouse', 'move', String(Math.round(p.x + dx)), String(Math.round(p.y + dy)));
	browser('mouse', 'up');
}
function canvasPoint(x, y) {
	return evaluate(
		`(() => { const p = new DOMPoint(${x},${y}).matrixTransform(document.querySelector('.canvas').getScreenCTM()); return {x:p.x,y:p.y}; })()`,
	);
}
function draw(x1, y1, x2, y2) {
	const a = canvasPoint(x1, y1),
		b = canvasPoint(x2, y2);
	browser('mouse', 'move', String(Math.round(a.x)), String(Math.round(a.y)));
	browser('mouse', 'down');
	browser('mouse', 'move', String(Math.round(b.x)), String(Math.round(b.y)));
	browser('mouse', 'up');
}
const fixture =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="#453D35" stroke-width="2.4"><title>Fixture</title><g transform="translate(4 5) rotate(15)"><rect id="card" x="3" y="4" width="8" height="10" rx="2"/><circle id="dot" cx="20" cy="8" r="3"/></g><path id="curve" d="M8 30C12 20 20 40 28 30"/></svg>';
try {
	const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
	browser(...(existsSync(chrome) ? ['--executable-path', chrome] : []), 'open', `${base}/icon/ramen?edit`);
	browser('set', 'viewport', '1440', '1000');
	browser('wait', '.canvas');
	button('ソース');
	const original = source();
	evaluate('document.querySelector(".layer-name").click()');
	button('ノード (A)');
	const before = evaluate('document.querySelector(".canvas [stroke=\\\"#53765A\\\"]").getAttribute("d")');
	drag('.nodes rect', 20, 20);
	const after = evaluate('document.querySelector(".canvas [stroke=\\\"#53765A\\\"]").getAttribute("d")');
	assert.notEqual(after, before);
	button('取り消す');
	assert.equal(source(), original);
	button('やり直す');
	assert.equal(evaluate('document.querySelector(".canvas [stroke=\\\"#53765A\\\"]").getAttribute("d")'), after);
	const valid = source();
	setSource('<svg');
	assert.equal(evaluate('document.querySelector(".save").disabled'), true);
	assert.ok(evaluate('document.querySelector(".canvas [stroke=\\\"#53765A\\\"]") !== null'));
	button('取り消す');
	assert.equal(source(), valid);

	setSource(fixture);
	button('選択 (V)');
	evaluate('[...document.querySelectorAll(".layer-name")].find(e=>e.textContent.includes("card")).click()');
	const x = evaluate('Number(document.querySelector("input[aria-label=\\\"選択範囲のX\\\"]").value)');
	evaluate(
		`(() => { const input = document.querySelector('input[aria-label="選択範囲のX"]'); input.value = ${x + 3}; input.dispatchEvent(new Event('change', {bubbles:true})); })()`,
	);
	assert.ok(
		Math.abs(evaluate('Number(document.querySelector("input[aria-label=\\\"選択範囲のX\\\"]").value)') - x - 3) < 0.001,
	);

	// Group and ungroup nested elements without changing their screen geometry.
	evaluate(
		'[...document.querySelectorAll(".layer-name")].find(e=>e.textContent.includes("dot")).dispatchEvent(new MouseEvent("click",{bubbles:true,shiftKey:true}))',
	);
	const boxBeforeGroup = evaluate(
		'(() => {const b=document.querySelector(".canvas #card").getBoundingClientRect();return [b.x,b.y,b.width,b.height]})()',
	);
	button('グループ');
	button('グループ解除');
	const boxAfterGroup = evaluate(
		'(() => {const b=document.querySelector(".canvas #card").getBoundingClientRect();return [b.x,b.y,b.width,b.height]})()',
	);
	boxAfterGroup.forEach((v, i) => assert.ok(Math.abs(v - boxBeforeGroup[i]) < 0.001));
	evaluate('[...document.querySelectorAll(".layer-name")].find(e=>e.textContent.includes("card")).click()');
	button('複製');
	assert.equal(evaluate('document.querySelectorAll(".canvas rect[data-editor-key]").length'), 2);
	button('取り消す');
	assert.equal(evaluate('document.querySelectorAll(".canvas rect[data-editor-key]").length'), 1);
	evaluate('[...document.querySelectorAll(".layer-name")].find(e=>e.textContent.includes("card")).click()');
	button('パスに変換');
	assert.ok(evaluate('document.querySelector(".canvas path#card") !== null'));
	button('取り消す');

	// Draw through real pointer input, then confirm one undo removes the entire gesture.
	button('四角形 (R)');
	draw(30, 5, 42, 17);
	assert.equal(evaluate('document.querySelectorAll(".canvas rect[data-editor-key]").length'), 2);
	button('取り消す');
	assert.equal(evaluate('document.querySelectorAll(".canvas rect[data-editor-key]").length'), 1);
	button('ペン (P)');
	draw(4, 35, 8, 35);
	draw(15, 40, 19, 40);
	browser('press', 'Enter');
	assert.equal(evaluate('document.querySelectorAll(".canvas path[data-editor-key]").length'), 2);
	button('取り消す');
	assert.equal(evaluate('document.querySelectorAll(".canvas path[data-editor-key]").length'), 1);

	// File conflict UI: verify reviewed disk content is used as the next save base.
	evaluate(
		`window.realFetch = window.fetch; window.disk = ${JSON.stringify(fixture)}; window.fetch = async (url, options) => { if (String(url).startsWith('/__atelier/icons/')) { if (!options) return new Response(JSON.stringify({svg:window.disk}), {status:200}); window.lastSave=JSON.parse(options.body); return new Response(JSON.stringify({error:'Conflict'}), {status:409}); } return window.realFetch(url, options); };`,
	);
	button('保存する ⌘S');
	browser('wait', '.conflict');
	assert.equal(evaluate('document.querySelector(".compare textarea").value'), fixture);
	const draft = source();
	button('下書きを残して手で統合');
	assert.equal(source(), draft);
	evaluate(
		`window.fetch = async (url, options) => { if (String(url).startsWith('/__atelier/icons/')) { window.lastSave=JSON.parse(options.body); return new Response(JSON.stringify({id:'ramen',svg:window.lastSave.svg}),{status:200}); } return window.realFetch(url, options); };`,
	);
	button('保存する ⌘S');
	wait();
	assert.equal(evaluate('window.lastSave.base'), fixture);
	assert.equal(evaluate('window.lastSave.svg'), draft);
	assert.equal(evaluate('document.querySelector(".save").disabled'), true);

	// New edit survives a real reload and the explicit recovery step.
	setSource(fixture.replace('Fixture', 'Recovered draft'));
	browser('reload');
	browser('wait', '.notice');
	button('下書きを復元');
	button('ソース');
	assert.ok(source().includes('Recovered draft'));
	assert.ok(evaluate('document.querySelector(".save").disabled') === false);
	assert.equal(browser('errors').errors?.length ?? 0, 0);
	console.log(
		'Editor browser checks passed: nodes, history, invalid source, nested transforms, shapes, pen, conflicts, save and draft recovery.',
	);
} catch (error) {
	console.error(evaluate('document.querySelector(".statusbar")?.textContent'));
	console.error(browser('errors'));
	browser('screenshot', '/tmp/editor-check-error.png');
	throw error;
} finally {
	browser('close');
}
