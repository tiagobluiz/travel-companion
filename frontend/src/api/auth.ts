import { api } from './client'
import { useAuthStore } from '../stores/authStore'

export interface AuthResponse {
  token: string
  user: { id: string; email: string; displayName: string }
}

export interface UserResponse {
  id: string
  email: string
  displayName: string
}

export async function register(email: string, password: string, displayName: string) {
  const res = await api.post<AuthResponse>('/auth/register', {
    email,
    password,
    displayName,
  })
  useAuthStore.getState().setAuth(res.token, res.user)
  return res
}

export async function login(email: string, password: string) {
  const res = await api.post<AuthResponse>('/auth/login', { email, password })
  useAuthStore.getState().setAuth(res.token, res.user)
  return res
}

export async function fetchMe() {
  return api.get<UserResponse>('/auth/me')
}
