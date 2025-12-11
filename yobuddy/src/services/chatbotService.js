import axios from 'axios'

const CHATBOT_API = "http://13.209.18.145:8000"

export function askChatbot(question) {
  return axios.post(`${CHATBOT_API}/api/faq/ask`, { question })
}