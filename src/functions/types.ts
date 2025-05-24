export interface CloudFunction {
  id: number
  name: string
  description?: string
  code: string
  trigger_type: 'http' | 'schedule' | 'event'
  trigger_config: Record<string, unknown>
  environment_variables?: Record<string, string>
  is_active: boolean
  created_at: string
  updated_at: string
  user_id: number
}

export interface CreateFunctionRequest {
  name: string
  description?: string
  code: string
  trigger_type: 'http' | 'schedule' | 'event'
  trigger_config: Record<string, unknown>
  environment_variables?: Record<string, string>
  is_active?: boolean
}

export interface UpdateFunctionRequest {
  name?: string
  description?: string
  code?: string
  trigger_type?: 'http' | 'schedule' | 'event'
  trigger_config?: Record<string, unknown>
  environment_variables?: Record<string, string>
  is_active?: boolean
}

export interface InvokeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  timeout?: number
}

export interface FunctionInvocationResult {
  success: boolean
  result?: unknown
  error?: string
  logs?: string[]
  duration: number
}