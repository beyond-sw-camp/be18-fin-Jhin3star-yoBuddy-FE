// vue.config.js
module.exports = {
  devServer: {
    port: 8081, // 프론트 개발 서버 포트
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 백엔드 포트
        changeOrigin: true,
        secure: false,
        ws: true, // WebSocket / SSE 지원
      }
    }
  }
}