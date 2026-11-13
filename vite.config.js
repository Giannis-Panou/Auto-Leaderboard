import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		// Keep flag SVGs as separate files (loaded only when shown) instead of
		// inlining ~270 of them into the JS bundle.
		assetsInlineLimit: (file) => (file.includes('flag-icons') ? false : undefined),
	},
});
