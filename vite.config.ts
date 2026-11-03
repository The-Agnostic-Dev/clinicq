import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: { port: 5114, strictPort: true },
	preview: { port: 5114, strictPort: true },
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		env: {
			CLINICQ_DB_PATH: ':memory:',
			TZ: 'UTC'
		}
	}
});
