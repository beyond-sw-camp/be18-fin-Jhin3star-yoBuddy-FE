import axios from 'axios'

const API_BASE = 'https://yobuddy.my'  

export function askChatbot(question) {
  return axios.post(`${API_BASE}/api/faq/ask`, { question })
}