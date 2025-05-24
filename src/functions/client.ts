import { AuthClient } from '../auth/client'
import type {
  CloudFunction,
  CreateFunctionRequest,
  UpdateFunctionRequest,
  InvokeFunctionOptions,
  FunctionInvocationResult
} from './types'

export class FunctionsClient {
  private authClient: AuthClient

  constructor(authClient: AuthClient) {
    this.authClient = authClient
  }

  async listFunctions(): Promise<CloudFunction[]> {
    return this.authClient.makeAuthenticatedRequest<CloudFunction[]>({
      method: 'GET',
      url: '/api/v1/functions'
    })
  }

  async getFunction(functionId: number): Promise<CloudFunction> {
    return this.authClient.makeAuthenticatedRequest<CloudFunction>({
      method: 'GET',
      url: `/api/v1/functions/${functionId}`
    })
  }

  async createFunction(functionData: CreateFunctionRequest): Promise<CloudFunction> {
    return this.authClient.makeAuthenticatedRequest<CloudFunction>({
      method: 'POST',
      url: '/api/v1/functions',
      data: functionData
    })
  }

  async updateFunction(functionId: number, updates: UpdateFunctionRequest): Promise<CloudFunction> {
    return this.authClient.makeAuthenticatedRequest<CloudFunction>({
      method: 'PUT',
      url: `/api/v1/functions/${functionId}`,
      data: updates
    })
  }

  async deleteFunction(functionId: number): Promise<void> {
    await this.authClient.makeAuthenticatedRequest<void>({
      method: 'DELETE',
      url: `/api/v1/functions/${functionId}`
    })
  }

  async invoke(
    functionName: string, 
    payload?: unknown, 
    options: InvokeFunctionOptions = {}
  ): Promise<FunctionInvocationResult> {
    const method = options.method || 'POST'
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    return this.authClient.makeAuthenticatedRequest<FunctionInvocationResult>({
      method,
      url: `/api/v1/functions/invoke/${functionName}`,
      data: payload,
      headers,
      timeout: options.timeout
    })
  }

  async deployFunction(functionId: number): Promise<void> {
    await this.authClient.makeAuthenticatedRequest<void>({
      method: 'POST',
      url: `/api/v1/functions/${functionId}/deploy`
    })
  }

  async getFunctionLogs(functionId: number, limit = 100): Promise<string[]> {
    return this.authClient.makeAuthenticatedRequest<string[]>({
      method: 'GET',
      url: `/api/v1/functions/${functionId}/logs?limit=${limit}`
    })
  }
}