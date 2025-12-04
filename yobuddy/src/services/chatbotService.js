import axios from 'axios'

export function askChatbot(question) {
  return axios.post('/api/faq/ask', { question })
}