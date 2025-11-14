const axios = require('axios')

const url = process.env.URL || 'http://localhost:8080/api/v1/test'

;(async () => {
  try {
    console.log(`Checking ${url} ...`)
    const resp = await axios.get(url, { timeout: 5000 })
    console.log('Status:', resp.status, resp.statusText)
    console.log('Headers:', resp.headers)
    console.log('Body:', typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2))
    process.exit(0)
  } catch (err) {
    if (err.response) {
      console.error('HTTP error:', err.response.status, err.response.statusText)
      console.error('Body:', err.response.data)
    } else {
      console.error('Network error:', err.message)
    }
    process.exit(1)
  }
})()
