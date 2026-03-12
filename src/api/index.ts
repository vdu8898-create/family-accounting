import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`
})

export const aiApi = {
    aiParse: (text: string, known_members: string[], known_categories: string[]) => api.post('/ai/parse', { text, known_members, known_categories })
}