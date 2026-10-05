import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { atelier } from './src/lib/server/atelier.ts';

export default defineConfig({
	plugins: [atelier(fileURLToPath(new URL('./icons', import.meta.url))), sveltekit({ adapter: adapter({ fallback: '404.html' }) })],
	server: { host: '127.0.0.1', port: 4173 }
});
