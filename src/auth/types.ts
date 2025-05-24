export interface User {
  id: string
  email: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  is_active?: boolean
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  email: string
  user_id: string
  is_superuser: boolean
}

export interface RefreshTokenResponse {
  access_token: string
  token_type: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
}