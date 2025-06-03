import { AuthClient } from '../auth/client'
import { Config } from '../config'
import { HttpClient } from '../utils'
import type {
  Bucket,
  FileMetadata,
  UploadFileOptions,
  FileListOptions,
  PresignedUploadResponse,
  FileUploadResponse,
  FileDownloadInfoResponse,
  FileViewInfoResponse,
  WrappedFileDownloadInfoResponse,
  WrappedFileViewInfoResponse
} from './types'

export class FileClient {
  private authClient: AuthClient
  private config: Config
  private storageHttpClient: HttpClient

  constructor(authClient: AuthClient) {
    this.authClient = authClient
    this.config = Config.getInstance()
    this.storageHttpClient = new HttpClient(this.config.storageUrl, this.config.timeout)
  }

  async uploadFile(
    bucketId: string, 
    file: File | Blob, 
    filename?: string,
    options: UploadFileOptions = {}
  ): Promise<FileUploadResponse> {
    const formData = new FormData()
    
    const actualFilename = filename || (file as File).name || 'untitled'
    formData.append('file', file, actualFilename)
    
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata))
    }

    const headers = this.authClient.getAuthHeaders()
    
    return this.storageHttpClient.post<FileUploadResponse>(
      `/files/upload/${bucketId}`,
      formData,
      { headers }
    )
  }

  async initiateUpload(
    bucketId: string,
    filename: string,
    contentType?: string,
    metadata?: Record<string, unknown>
  ): Promise<PresignedUploadResponse> {
    const headers = this.authClient.getAuthHeaders()
    
    return this.storageHttpClient.post<PresignedUploadResponse>(
      '/files/initiate-upload',
      {
        bucket_id: bucketId,
        filename,
        content_type: contentType,
        metadata
      },
      { headers }
    )
  }

  async listFiles(bucketId: string, options: FileListOptions = {}): Promise<FileMetadata[]> {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    if (options.search) params.append('search', options.search)

    const url = `/files/list/${bucketId}${params.toString() ? `?${params.toString()}` : ''}`
    const headers = this.authClient.getAuthHeaders()
    
    return this.storageHttpClient.get<FileMetadata[]>(url, { headers })
  }

  async downloadFile(bucketId: string, fileId: string): Promise<Blob> {
    const headers = this.authClient.getAuthHeaders()
    
    return this.storageHttpClient.request<Blob>({
      method: 'GET',
      url: `/files/download/${bucketId}/${fileId}`,
      headers,
      responseType: 'blob'
    })
  }

  async getFileInfo(bucketId: string, fileId: string): Promise<FileMetadata> {
    const headers = this.authClient.getAuthHeaders()
    
    return this.storageHttpClient.get<FileMetadata>(
      `/files/info/${bucketId}/${fileId}`,
      { headers }
    )
  }

  async updateFileMetadata(
    bucketId: string, 
    fileId: string, 
    metadata: Record<string, unknown>
  ): Promise<FileMetadata> {
    const headers = this.authClient.getAuthHeaders()
    
    return this.storageHttpClient.put<FileMetadata>(
      `/files/metadata/${bucketId}/${fileId}`,
      { metadata },
      { headers }
    )
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.authClient.makeAuthenticatedRequest<void>({
      method: 'DELETE',
      url: `/api/v1/files/${fileId}`
    })
  }

  getFileUrl(bucketId: string, fileId: string): string {
    return `${this.config.storageUrl}/files/download/${bucketId}/${fileId}`
  }

  // Backend API methods for file info (with signed URLs)
  async getFileViewInfo(fileId: string): Promise<WrappedFileViewInfoResponse> {
    const response = await this.authClient.makeAuthenticatedRequest<FileViewInfoResponse>({
      method: 'GET',
      url: `/api/v1/files/${fileId}/view-info`
    })
    return { data: response }
  }

  async getFileDownloadInfo(fileId: string): Promise<WrappedFileDownloadInfoResponse> {
    const response = await this.authClient.makeAuthenticatedRequest<FileDownloadInfoResponse>({
      method: 'GET',
      url: `/api/v1/files/${fileId}/download-info`
    })
    return { data: response }
  }

  async getPublicFileViewInfo(fileId: string): Promise<WrappedFileViewInfoResponse> {
    const response = await this.authClient.makeAuthenticatedRequest<FileViewInfoResponse>({
      method: 'GET',
      url: `/api/v1/files/public/${fileId}/view-info`
    })
    return { data: response }
  }

  async getPublicFileDownloadInfo(fileId: string): Promise<WrappedFileDownloadInfoResponse> {
    const response = await this.authClient.makeAuthenticatedRequest<FileDownloadInfoResponse>({
      method: 'GET',
      url: `/api/v1/files/public/${fileId}/download-info`
    })
    return { data: response }
  }

  async uploadByBucketName(
    bucketName: string,
    file: File | Blob,
    filename?: string,
    options: UploadFileOptions = {}
  ): Promise<FileUploadResponse> {
    // Get bucket ID by name
    const buckets = await this.authClient.makeAuthenticatedRequest<Bucket[]>({
      method: 'GET',
      url: '/api/v1/buckets'
    })
    
    // Find bucket by name
    let bucket = buckets.find(b => b.name === bucketName)
    if (!bucket) {
      bucket = buckets.find(b => b.name.toLowerCase() === bucketName.toLowerCase())
    }
    
    if (!bucket) {
      throw new Error(`Bucket '${bucketName}' not found. Please ensure it exists.`)
    }
    
    // Use the two-step upload process via backend API like the working version
    const actualFilename = filename || (file as File).name || 'untitled'
    
    // Step 1: Initiate upload via backend API
    const initiateResponse = await this.authClient.makeAuthenticatedRequest<{
      file_metadata: any;
      presigned_upload_info: {
        upload_url: string;
        upload_method: string;
      };
    }>({
      method: 'POST',
      url: '/api/v1/files/initiate-upload',
      data: {
        filename: actualFilename,
        content_type: (file as File).type || 'application/octet-stream',
        size: file.size,
        bucket_id: bucket.id
      }
    })
    
    const { file_metadata, presigned_upload_info } = initiateResponse
    
    // Step 2: Upload directly to storage service using presigned URL
    const uploadMethod = presigned_upload_info.upload_method.toLowerCase()
    
    // Create a simple HTTP client for the direct upload
    const response = await fetch(presigned_upload_info.upload_url, {
      method: uploadMethod.toUpperCase(),
      body: file,
      headers: {
        'Content-Type': (file as File).type || 'application/octet-stream'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }
    
    // Return the file metadata in the expected format
    return { file: file_metadata }
  }
}