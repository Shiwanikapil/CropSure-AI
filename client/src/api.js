import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
})

export const authHeaders = (token) => ({ Authorization: `Bearer ${token}` })

export default api
