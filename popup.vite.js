const { resolve } = require('path')
const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')

export default defineConfig({
	plugins: [vue()],
	build: {
		rollupOptions: {
			input: {
				app: resolve(__dirname, 'popup.html')
			}
		},
		emptyOutDir: false
	},
	base: './'
  })