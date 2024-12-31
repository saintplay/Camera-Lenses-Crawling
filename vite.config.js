const { resolve } = require('path')
const { defineConfig } = require('vite')

export default defineConfig({
	build: {
		minify: false,
		lib: {
			entry: [
				resolve(__dirname, 'src/main.ts'),
				resolve(__dirname, 'src/popup.ts')
			],
			formats: ['cjs']
		}
	},
  })