const { resolve } = require('path')
const { defineConfig } = require('vite')

export default defineConfig({
	build: {
		minify: false,
		lib: {
			entry: resolve(__dirname, 'src/popup/popup.ts'),
			name: 'Popup Script',
			fileName: 'popup',
			formats: ['umd'],
		},
		emptyOutDir: false
	},
  })