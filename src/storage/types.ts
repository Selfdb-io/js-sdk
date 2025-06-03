export interface Bucket {
  id: string
  name: string
  is_public: boolean
  description?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface CreateBucketRequest {
  name: string
  is_public?: boolean
  description?: string
}

export interface UpdateBucketRequest {
  name?: string
  is_public?: boolean
  description?: string
}

export interface FileMetadata {
  id: string
  filename: string
  content_type: string
  size: number
  bucket_id: string
  user_id: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface UploadFileOptions {
  metadata?: Record<string, unknown>
  contentType?: string
}

export interface FileListOptions {
  limit?: number
  offset?: number
  search?: string
}

export interface PresignedUploadResponse {
  upload_url: string
  file_id: string
  fields?: Record<string, string>
}

export interface FileUploadResponse {
  file: FileMetadata
  upload_url?: string
}

export interface FileDownloadInfoResponse {
  file_metadata: FileMetadata
  download_url: string
}

export interface FileViewInfoResponse {
  file_metadata: FileMetadata
  view_url: string
}

export interface WrappedFileDownloadInfoResponse {
  data: FileDownloadInfoResponse
}

export interface WrappedFileViewInfoResponse {
  data: FileViewInfoResponse
}