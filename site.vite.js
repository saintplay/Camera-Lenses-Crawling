const { resolve } = require('path')
const { defineConfig } = require('vite')

export default defineConfig({
	build: {
		minify: false,
		lib: {
			entry: resolve(__dirname, 'src/site.ts'),
			name: 'Site Script',
			fileName: 'site',
			formats: ['umd'],
		},
		emptyOutDir: false
	},
  })