export async function saveSource(id: string, svg: string, base: string | null): Promise<{ id: string; svg: string }> {
	const response = await fetch(`/__atelier/icons/${id}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ svg, base })
	});
	const body = await response.json();
	if (!response.ok) throw new Error(body.error || 'リクエストに失敗しました。もう一度試してください。');
	return body;
}
