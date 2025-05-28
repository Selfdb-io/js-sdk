import { AuthClient } from '../auth/client'
import type {
  DatabaseTable,
  TableColumn,
  CreateTableRequest,
  QueryOptions,
  SqlQueryRequest,
  SqlQueryResponse,
  PaginatedResponse,
  TableDataResponse,
  TableDataOptions
} from './types'
import { SelfDBError } from '../errors'

export class QueryBuilder<T = Record<string, unknown>> {
  private authClient: AuthClient
  private tableName: string
  private selectColumns: string[] = ['*']
  private whereConditions: Record<string, unknown> = {}
  private orderByClause?: string
  private limitCount?: number
  private offsetCount?: number

  constructor(authClient: AuthClient, tableName: string) {
    this.authClient = authClient
    this.tableName = tableName
  }

  select(columns: string | string[]): this {
    this.selectColumns = Array.isArray(columns) ? columns : [columns]
    return this
  }

  where(column: string, operator: string | unknown, value?: unknown): this {
    if (value === undefined) {
      // Two-parameter version: where('column', value)
      this.whereConditions[column] = operator
    } else {
      // Three-parameter version: where('column', '=', value)
      if (operator === '=' || operator === 'eq') {
        this.whereConditions[column] = value
      } else {
        // For now, we'll store complex operators as direct SQL conditions
        // This could be enhanced to support more operators
        this.whereConditions[`${column}_${operator}`] = value
      }
    }
    return this
  }

  order(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByClause = `${column} ${direction.toUpperCase()}`
    return this
  }

  limit(count: number): this {
    this.limitCount = count
    return this
  }

  offset(count: number): this {
    this.offsetCount = count
    return this
  }

  async insert(data: Partial<T>): Promise<T> {
    try {
      const response = await this.authClient.makeAuthenticatedRequest<T>({
        method: 'POST',
        url: `/api/v1/tables/${this.tableName}/data`,
        data: data
      })
      
      return response
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Insert operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'INSERT_ERROR',
        suggestion: 'Check your data types and table constraints'
      })
    }
  }

  async update(data: Partial<T>): Promise<T> {
    try {
      if (Object.keys(this.whereConditions).length === 0) {
        throw new SelfDBError({
          message: 'Update requires where conditions for safety',
          code: 'UPDATE_NO_WHERE',
          suggestion: 'Add where conditions to prevent updating all rows'
        })
      }

      // For now, support simple id-based updates
      const idValue = this.whereConditions.id
      if (!idValue) {
        throw new SelfDBError({
          message: 'Update currently only supports id-based where conditions',
          code: 'UPDATE_UNSUPPORTED_WHERE',
          suggestion: 'Use .where("id", value) for updates'
        })
      }

      const params = new URLSearchParams()
      params.append('id_column', 'id')

      const response = await this.authClient.makeAuthenticatedRequest<T>({
        method: 'PUT',
        url: `/api/v1/tables/${this.tableName}/data/${idValue}?${params.toString()}`,
        data: data
      })
      
      return response
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Update operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'UPDATE_ERROR',
        suggestion: 'Check your data types and where conditions'
      })
    }
  }

  async delete(): Promise<boolean> {
    try {
      if (Object.keys(this.whereConditions).length === 0) {
        throw new SelfDBError({
          message: 'Delete requires where conditions for safety',
          code: 'DELETE_NO_WHERE',
          suggestion: 'Add where conditions to prevent deleting all rows'
        })
      }

      // For now, support simple id-based deletes
      const idValue = this.whereConditions.id
      if (!idValue) {
        throw new SelfDBError({
          message: 'Delete currently only supports id-based where conditions',
          code: 'DELETE_UNSUPPORTED_WHERE',
          suggestion: 'Use .where("id", value) for deletes'
        })
      }

      const params = new URLSearchParams()
      params.append('id_column', 'id')

      await this.authClient.makeAuthenticatedRequest({
        method: 'DELETE',
        url: `/api/v1/tables/${this.tableName}/data/${idValue}?${params.toString()}`
      })
      
      return true
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Delete operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'DELETE_ERROR',
        suggestion: 'Check your where conditions'
      })
    }
  }

  async execute(): Promise<T[]> {
    try {
      // Use the tables endpoint instead of SQL endpoint for better compatibility
      const params = new URLSearchParams()
      
      // Add pagination if specified
      if (this.limitCount) {
        params.append('page_size', this.limitCount.toString())
      }
      if (this.offsetCount) {
        const page = Math.floor(this.offsetCount / (this.limitCount || 50)) + 1
        params.append('page', page.toString())
      }
      
      // Add ordering if specified
      if (this.orderByClause) {
        params.append('order_by', this.orderByClause.replace(' ', ':').toLowerCase())
      }
      
      // Add filtering (limited support for simple where conditions)
      if (Object.keys(this.whereConditions).length > 0) {
        // For now, only support single column filter
        const firstCondition = Object.entries(this.whereConditions)[0]
        if (firstCondition) {
          params.append('filter_column', firstCondition[0])
          params.append('filter_value', String(firstCondition[1]))
        }
      }

      const url = `/api/v1/tables/${this.tableName}/data${params.toString() ? `?${params.toString()}` : ''}`
      
      const response = await this.authClient.makeAuthenticatedRequest<TableDataResponse<T>>({
        method: 'GET',
        url
      })
      
      return response.data
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'QUERY_ERROR',
        suggestion: 'Check your table name and column references'
      })
    }
  }

  // Single result convenience method
  async single(): Promise<T | null> {
    const results = await this.limit(1).execute()
    return results[0] || null
  }

  private buildWhereClause(where: Record<string, unknown>): string {
    const conditions = Object.entries(where).map(([key, value]) => {
      if (value === null) return `${key} IS NULL`
      if (Array.isArray(value)) return `${key} IN (${value.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ')})`
      if (typeof value === 'string') return `${key} = '${value.replace(/'/g, "''")}'`
      return `${key} = ${value}`
    })
    return conditions.join(' AND ')
  }

}

export class DatabaseClient {
  private authClient: AuthClient

  constructor(authClient: AuthClient) {
    this.authClient = authClient
  }

  from<T = Record<string, unknown>>(tableName: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this.authClient, tableName)
  }


  async getTables(): Promise<DatabaseTable[]> {
    return this.authClient.makeAuthenticatedRequest<DatabaseTable[]>({
      method: 'GET',
      url: '/api/v1/tables'
    })
  }

  async getTableStructure(tableName: string): Promise<TableColumn[]> {
    return this.authClient.makeAuthenticatedRequest<TableColumn[]>({
      method: 'GET',
      url: `/api/v1/tables/${tableName}/structure`
    })
  }

  async createTable(tableData: CreateTableRequest): Promise<void> {
    await this.authClient.makeAuthenticatedRequest<void>({
      method: 'POST',
      url: '/api/v1/tables',
      data: tableData
    })
  }

  async dropTable(tableName: string): Promise<void> {
    await this.authClient.makeAuthenticatedRequest<void>({
      method: 'DELETE',
      url: `/api/v1/tables/${tableName}`
    })
  }

  async create<T = Record<string, unknown>>(table: string, data: Record<string, unknown>): Promise<T> {
    return this.authClient.makeAuthenticatedRequest<T>({
      method: 'POST',
      url: `/api/v1/tables/${table}/data`,
      data
    })
  }

  async read<T = Record<string, unknown>>(table: string, options: QueryOptions = {}): Promise<T[]> {
    const params = new URLSearchParams()
    
    if (options.limit) {
      params.append('page_size', options.limit.toString())
    }
    
    if (options.offset) {
      const page = Math.floor(options.offset / (options.limit || 50)) + 1
      params.append('page', page.toString())
    }
    
    if (options.orderBy) {
      if (typeof options.orderBy === 'string') {
        params.append('order_by', options.orderBy.replace(' ', ':').toLowerCase())
      } else if (Array.isArray(options.orderBy) && options.orderBy.length > 0) {
        const firstOrder = options.orderBy[0]
        if (firstOrder) {
          const orderStr = `${firstOrder.column}:${firstOrder.direction}`
          params.append('order_by', orderStr)
        }
      }
    }
    
    // Add filtering (limited support for simple where conditions)
    if (options.where && Object.keys(options.where).length > 0) {
      const firstCondition = Object.entries(options.where)[0]
      if (firstCondition) {
        params.append('filter_column', firstCondition[0])
        params.append('filter_value', String(firstCondition[1]))
      }
    }

    const url = `/api/v1/tables/${table}/data${params.toString() ? `?${params.toString()}` : ''}`
    
    const response = await this.authClient.makeAuthenticatedRequest<TableDataResponse<T>>({
      method: 'GET',
      url
    })
    
    return response.data
  }

  async update<T = Record<string, unknown>>(
    table: string, 
    data: Record<string, unknown>, 
    where: Record<string, unknown>
  ): Promise<T> {
    // For now, support simple id-based updates
    const idValue = where.id
    if (!idValue) {
      throw new SelfDBError({
        message: 'Update currently only supports id-based where conditions',
        code: 'UPDATE_UNSUPPORTED_WHERE',
        suggestion: 'Use { id: value } in where clause for updates'
      })
    }

    const params = new URLSearchParams()
    params.append('id_column', 'id')

    return this.authClient.makeAuthenticatedRequest<T>({
      method: 'PUT',
      url: `/api/v1/tables/${table}/data/${idValue}?${params.toString()}`,
      data
    })
  }

  async delete(table: string, where: Record<string, unknown>): Promise<boolean> {
    // For now, support simple id-based deletes
    const idValue = where.id
    if (!idValue) {
      throw new SelfDBError({
        message: 'Delete currently only supports id-based where conditions',
        code: 'DELETE_UNSUPPORTED_WHERE',
        suggestion: 'Use { id: value } in where clause for deletes'
      })
    }

    const params = new URLSearchParams()
    params.append('id_column', 'id')

    await this.authClient.makeAuthenticatedRequest({
      method: 'DELETE',
      url: `/api/v1/tables/${table}/data/${idValue}?${params.toString()}`
    })
    
    return true
  }

  async findById<T = Record<string, unknown>>(table: string, id: string | number): Promise<T | null> {
    const results = await this.read<T>(table, { where: { id } })
    return results[0] || null
  }

  async paginate<T = Record<string, unknown>>(
    table: string, 
    page = 1, 
    limit = 10, 
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<PaginatedResponse<T>> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', limit.toString())
    
    if (options.orderBy) {
      if (typeof options.orderBy === 'string') {
        params.append('order_by', options.orderBy.replace(' ', ':').toLowerCase())
      } else if (Array.isArray(options.orderBy) && options.orderBy.length > 0) {
        const firstOrder = options.orderBy[0]
        if (firstOrder) {
          const orderStr = `${firstOrder.column}:${firstOrder.direction}`
          params.append('order_by', orderStr)
        }
      }
    }
    
    // Add filtering (limited support for simple where conditions)
    if (options.where && Object.keys(options.where).length > 0) {
      const firstCondition = Object.entries(options.where)[0]
      if (firstCondition) {
        params.append('filter_column', firstCondition[0])
        params.append('filter_value', String(firstCondition[1]))
      }
    }

    const url = `/api/v1/tables/${table}/data?${params.toString()}`
    
    const response = await this.authClient.makeAuthenticatedRequest<TableDataResponse<T>>({
      method: 'GET',
      url
    })
    
    return {
      data: response.data,
      total: response.metadata.total_count,
      page: response.metadata.page,
      limit: response.metadata.page_size,
      hasNext: response.metadata.page < response.metadata.total_pages,
      hasPrev: response.metadata.page > 1
    }
  }

  async executeSql(query: string, params?: unknown[]): Promise<SqlQueryResponse> {
    const request: SqlQueryRequest = { 
      query, 
      ...(params !== undefined && { params })
    }
    
    return this.authClient.makeAuthenticatedRequest<SqlQueryResponse>({
      method: 'POST',
      url: '/api/v1/sql/query',
      data: { query: request.query }
    })
  }

  async getTableData<T = Record<string, unknown>>(
    tableName: string, 
    options: TableDataOptions = {}
  ): Promise<TableDataResponse<T>> {
    const params = new URLSearchParams()
    
    if (options.page) params.append('page', options.page.toString())
    if (options.page_size) params.append('page_size', options.page_size.toString())
    if (options.order_by) params.append('order_by', options.order_by)
    if (options.filter_column) params.append('filter_column', options.filter_column)
    if (options.filter_value) params.append('filter_value', options.filter_value)

    const url = `/api/v1/tables/${tableName}/data${params.toString() ? `?${params.toString()}` : ''}`
    
    return this.authClient.makeAuthenticatedRequest<TableDataResponse<T>>({
      method: 'GET',
      url
    })
  }

  async insertTableData<T = Record<string, unknown>>(
    tableName: string, 
    data: Record<string, unknown>
  ): Promise<T> {
    return this.authClient.makeAuthenticatedRequest<T>({
      method: 'POST',
      url: `/api/v1/tables/${tableName}/data`,
      data
    })
  }

  async updateTableData<T = Record<string, unknown>>(
    tableName: string, 
    id: string | number,
    data: Record<string, unknown>,
    idColumn: string = 'id'
  ): Promise<T> {
    const params = new URLSearchParams()
    params.append('id_column', idColumn)

    return this.authClient.makeAuthenticatedRequest<T>({
      method: 'PUT',
      url: `/api/v1/tables/${tableName}/data/${id}?${params.toString()}`,
      data
    })
  }
}