import axios from 'axios'

export function askChatbot(question) {
  return axios.post(`${CHATBOT_API}/api/faq/ask`, { question })
}