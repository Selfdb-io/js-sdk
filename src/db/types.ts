export interface DatabaseTable {
  table_name: string
  table_schema: string
  table_type: string
}

export interface TableDataResponse<T = Record<string, unknown>> {
  data: T[]
  metadata: {
    total_count: number
    page: number
    page_size: number
    total_pages: number
    columns: string[]
  }
}

export interface TableDataOptions {
  page?: number
  page_size?: number
  order_by?: string
  filter_column?: string
  filter_value?: string
}

export interface TableColumn {
  column_name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
  character_maximum_length: number | null
}

export interface CreateTableColumn {
  name: string
  type: string
  nullable?: boolean
  default?: string
  primary?: boolean
  unique?: boolean
}

export interface CreateTableRequest {
  name: string
  columns: CreateTableColumn[]
}

export interface QueryOptions {
  select?: string[]
  where?: Record<string, unknown>
  orderBy?: string | { column: string; direction: 'asc' | 'desc' }[]
  limit?: number
  offset?: number
}

export interface SqlQueryRequest {
  query: string
  params?: unknown[]
}

export interface SqlQueryResponse {
  columns: string[]
  rows: unknown[][]
  rowCount: number
  duration: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}