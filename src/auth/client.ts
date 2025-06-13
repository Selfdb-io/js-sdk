import { AxiosRequestConfig } from 'axios'
import { Config } from '../config'
import { HttpClient, getStorageItem, setStorageItem, removeStorageItem } from '../utils'
import { AuthError } from '../errors'
import type {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RefreshTokenResponse,
  AuthTokens,
  AuthState,
  PasswordChangeRequest
} from './types'

export class AuthClient {
  private httpClient: HttpClient
  private config: Config
  private authState: AuthState = {
    user: null,
    tokens: null,
    isAuthenticated: false
  }

  constructor() {
    this.config = Config.getInstance()
    this.httpClient = new HttpClient(this.config.baseUrl, this.config.timeout)
    this.loadAuthState()
  }

  private loadAuthState(): void {
    const accessToken = getStorageItem('access_token')
    const refreshToken = getStorageItem('refresh_token')
    const userString = getStorageItem('selfdb_user')

    if (accessToken && refreshToken && userString) {
      try {
        const user = JSON.parse(userString) as User
        this.authState = {
          user,
          tokens: { accessToken, refreshToken },
          isAuthenticated: true
        }
      } catch {
        this.clearAuthState()
      }
    }
  }

  private saveAuthState(): void {
    if (this.authState.tokens && this.authState.user) {
      setStorageItem('access_token', this.authState.tokens.accessToken)
      setStorageItem('refresh_token', this.authState.tokens.refreshToken)
      setStorageItem('selfdb_user', JSON.stringify(this.authState.user))
    }
  }

  private clearAuthState(): void {
    this.authState = {
      user: null,
      tokens: null,
      isAuthenticated: false
    }
    removeStorageItem('access_token')
    removeStorageItem('refresh_token')
    removeStorageItem('selfdb_user')
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    
    // Always include apikey if available (required for storage service)
    if (this.config.anonKey) {
      headers.apikey = this.config.anonKey
    }
    
    // Include Authorization header if authenticated
    if (this.authState.isAuthenticated && this.authState.tokens) {
      headers.Authorization = `Bearer ${this.authState.tokens.accessToken}`
    }

    return headers
  }

  async login(credentials: LoginRequest): Promise<LoginResponse & { user: User }> {
    const formData = new FormData()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)

    // Include API key in headers for login request
    const headers: Record<string, string> = {}
    
    // Always include apikey if available
    if (this.config.anonKey) {
      headers.apikey = this.config.anonKey
    }
    // Don't set Content-Type for FormData - let the browser set it with boundary

    const response = await this.httpClient.post<LoginResponse>(
      '/api/v1/auth/login',
      formData,
      { headers }
    )

    // Construct user object from login response
    const user: User = {
      id: response.user_id,
      email: response.email,
      is_active: true,
      is_superuser: response.is_superuser,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.authState = {
      user,
      tokens: {
        accessToken: response.access_token,
        refreshToken: response.refresh_token
      },
      isAuthenticated: true
    }

    this.saveAuthState()
    
    // Return response with user object added for compatibility
    return {
      ...response,
      user
    }
  }

  async register(userData: RegisterRequest): Promise<User> {
    // Include API key in headers for register request
    const headers: Record<string, string> = {}
    if (this.config.anonKey) {
      headers.apikey = this.config.anonKey
    }

    const user = await this.httpClient.post<User>('/api/v1/auth/register', userData, { headers })
    // Note: Registration doesn't automatically log in the user
    // The caller needs to call login() separately if they want to authenticate
    return user
  }

  async refresh(): Promise<RefreshTokenResponse> {
    if (!this.authState.tokens?.refreshToken) {
      throw new AuthError('No refresh token available')
    }

    // Include API key in headers for refresh request
    const headers: Record<string, string> = {}
    if (this.config.anonKey) {
      headers.apikey = this.config.anonKey
    }

    const response = await this.httpClient.post<RefreshTokenResponse>(
      '/api/v1/auth/refresh',
      { refresh_token: this.authState.tokens.refreshToken },
      { headers }
    )

    if (this.authState.tokens) {
      this.authState.tokens.accessToken = response.access_token
      this.saveAuthState()
    }

    return response
  }

  async logout(): Promise<void> {
    // Note: No logout endpoint exists in the backend
    // Just clear the local auth state
    this.clearAuthState()
  }

  async getUser(): Promise<User | null> {
    if (!this.authState.isAuthenticated) {
      return null
    }

    try {
      const user = await this.httpClient.get<User>('/api/v1/users/me', {
        headers: this.getAuthHeaders()
      })
      
      this.authState.user = user
      this.saveAuthState()
      return user
    } catch (error) {
      if (error instanceof AuthError) {
        this.clearAuthState()
      }
      throw error
    }
  }

  async changePassword(passwordData: PasswordChangeRequest): Promise<boolean> {
    if (!this.authState.isAuthenticated) {
      throw new AuthError('Must be authenticated to change password')
    }

    try {
      const result = await this.httpClient.put<boolean>(
        '/api/v1/users/me/password',
        passwordData,
        {
          headers: this.getAuthHeaders()
        }
      )
      
      return result
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const response = (error as any).response
        if (response?.status === 400) {
          throw new AuthError('Current password is incorrect')
        }
      }
      throw error
    }
  }

  getCurrentUser(): User | null {
    return this.authState.user
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  getTokens(): AuthTokens | null {
    return this.authState.tokens
  }

  setAnonKey(key: string): void {
    this.config.updateConfig({ anonKey: key })
  }

  async makeAuthenticatedRequest<T>(config: AxiosRequestConfig): Promise<T> {
    const headers = {
      ...config.headers,
      ...this.getAuthHeaders()
    }

    try {
      return await this.httpClient.request<T>({
        ...config,
        headers
      })
    } catch (error) {
      if (error instanceof AuthError && this.authState.tokens?.refreshToken) {
        try {
          await this.refresh()
          const newHeaders = {
            ...config.headers,
            ...this.getAuthHeaders()
          }
          return await this.httpClient.request<T>({
            ...config,
            headers: newHeaders
          })
        } catch {
          this.clearAuthState()
          throw error
        }
      }
      throw error
    }
  }
}