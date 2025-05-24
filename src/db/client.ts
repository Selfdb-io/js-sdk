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

  async update(data: Partial<T>): Promise<T[]> {
    try {
      if (Object.keys(this.whereConditions).length === 0) {
        throw new SelfDBError({
          message: 'Update requires where conditions for safety',
          code: 'UPDATE_NO_WHERE',
          suggestion: 'Add where conditions to prevent updating all rows'
        })
      }

      const setClauses = Object.entries(data).map(([key, value]) => {
        if (typeof value === 'string') return `${key} = '${value.replace(/'/g, "''")}'`
        return `${key} = ${value}`
      })
      
      const query = `UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE ${this.buildWhereClause(this.whereConditions)} RETURNING *`
      const result = await this.executeSql(query)
      
      return result.rows.map(row => {
        const record: Record<string, unknown> = {}
        result.columns.forEach((col, index) => {
          record[col] = row[index]
        })
        return record as T
      })
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Update operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'UPDATE_ERROR',
        suggestion: 'Check your data types and where conditions'
      })
    }
  }

  async delete(): Promise<number> {
    try {
      if (Object.keys(this.whereConditions).length === 0) {
        throw new SelfDBError({
          message: 'Delete requires where conditions for safety',
          code: 'DELETE_NO_WHERE',
          suggestion: 'Add where conditions to prevent deleting all rows'
        })
      }

      const query = `DELETE FROM ${this.tableName} WHERE ${this.buildWhereClause(this.whereConditions)}`
      const result = await this.executeSql(query)
      return result.rowCount
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

  private async executeSql(query: string): Promise<SqlQueryResponse> {
    return this.authClient.makeAuthenticatedRequest<SqlQueryResponse>({
      method: 'POST',
      url: '/api/v1/sql/query',
      data: { query }
    })
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

  private buildWhereClause(where: Record<string, unknown>): string {
    const conditions = Object.entries(where).map(([key, value]) => {
      if (value === null) return `${key} IS NULL`
      if (Array.isArray(value)) return `${key} IN (${value.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`
      if (typeof value === 'string') return `${key} = '${value}'`
      return `${key} = ${value}`
    })
    return conditions.join(' AND ')
  }

  private buildOrderByClause(orderBy: string | { column: string; direction: 'asc' | 'desc' }[]): string {
    if (typeof orderBy === 'string') {
      return `ORDER BY ${orderBy}`
    }
    
    const clauses = orderBy.map(({ column, direction }) => `${column} ${direction.toUpperCase()}`)
    return `ORDER BY ${clauses.join(', ')}`
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
    const columns = Object.keys(data).join(', ')
    const values = Object.values(data).map(value => 
      typeof value === 'string' ? `'${value}'` : value
    ).join(', ')
    
    const query = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *`
    const result = await this.executeSql(query)
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create record')
    }
    
    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create record')
    }
    
    const record: Record<string, unknown> = {}
    result.columns.forEach((col, index) => {
      record[col] = row[index]
    })
    
    return record as T
  }

  async read<T = Record<string, unknown>>(table: string, options: QueryOptions = {}): Promise<T[]> {
    let query = `SELECT ${options.select?.join(', ') || '*'} FROM ${table}`
    
    if (options.where && Object.keys(options.where).length > 0) {
      query += ` WHERE ${this.buildWhereClause(options.where)}`
    }
    
    if (options.orderBy) {
      query += ` ${this.buildOrderByClause(options.orderBy)}`
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`
    }
    
    if (options.offset) {
      query += ` OFFSET ${options.offset}`
    }
    
    const result = await this.executeSql(query)
    
    return result.rows.map(row => {
      const record: Record<string, unknown> = {}
      result.columns.forEach((col, index) => {
        record[col] = row[index]
      })
      return record as T
    })
  }

  async update<T = Record<string, unknown>>(
    table: string, 
    data: Record<string, unknown>, 
    where: Record<string, unknown>
  ): Promise<T[]> {
    const setClauses = Object.entries(data).map(([key, value]) => {
      if (typeof value === 'string') return `${key} = '${value}'`
      return `${key} = ${value}`
    })
    
    const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${this.buildWhereClause(where)} RETURNING *`
    const result = await this.executeSql(query)
    
    return result.rows.map(row => {
      const record: Record<string, unknown> = {}
      result.columns.forEach((col, index) => {
        record[col] = row[index]
      })
      return record as T
    })
  }

  async delete(table: string, where: Record<string, unknown>): Promise<number> {
    const query = `DELETE FROM ${table} WHERE ${this.buildWhereClause(where)}`
    const result = await this.executeSql(query)
    return result.rowCount
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
    const offset = (page - 1) * limit
    
    const countQuery = `SELECT COUNT(*) as total FROM ${table}${
      options.where ? ` WHERE ${this.buildWhereClause(options.where)}` : ''
    }`
    const countResult = await this.executeSql(countQuery)
    const total = Number(countResult.rows[0]?.[0] || 0)
    
    const data = await this.read<T>(table, {
      ...options,
      limit,
      offset
    })
    
    return {
      data,
      total,
      page,
      limit,
      hasNext: page * limit < total,
      hasPrev: page > 1
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
    data: Record<string, unknown>
  ): Promise<T> {
    return this.authClient.makeAuthenticatedRequest<T>({
      method: 'PUT',
      url: `/api/v1/tables/${tableName}/data/${id}`,
      data
    })
  }
}