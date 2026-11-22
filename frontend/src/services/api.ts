import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  withCredentials:true,
  headers: {
    'Content-Type': 'application/json',
    'X-SkillBook-Session': 'cookie',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(response=>response,error=>{
  if(error.response?.status===401 && !String(error.config?.url).startsWith('/auth/')
      && localStorage.getItem('currentUser')){
    localStorage.removeItem('accessToken')
    localStorage.removeItem('currentUser')
    window.location.assign('/login')
  }
  return Promise.reject(error)
})

export default api
