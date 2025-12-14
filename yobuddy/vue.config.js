module.exports = {
  devServer: {
    port: 8081,
    proxy: {
      '^/api/v1/notifications/stream': {
        target: 'http://localhost:8080',
        bypass(req) {
          return req.url
        }
      },

      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
}