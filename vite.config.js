import { resolve } from 'path'
import { defineConfig } from 'vite'

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