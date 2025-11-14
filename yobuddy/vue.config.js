// Development proxy to forward /api requests to backend and avoid CORS in dev
const target = process.env.VUE_APP_API_BASE || 'http://localhost:8080'

const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '^/api': {
        target,
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      }
    }
  }
})
