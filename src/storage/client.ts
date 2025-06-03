import { AuthClient } from '../auth/client'
import { BucketClient } from './buckets'
import { FileClient } from './files'
import { SelfDBError } from '../errors'
import type {
  Bucket,
  FileMetadata,
  CreateBucketRequest,
  UploadFileOptions,
  FileUploadResponse
} from './types'

export interface UploadOptions {
  filename?: string
  metadata?: Record<string, any>
  onProgress?: (progress: number) => void
}

export class StorageClient {
  public readonly buckets: BucketClient
  public readonly files: FileClient
  private authClient: AuthClient

  constructor(authClient: AuthClient) {
    this.authClient = authClient
    this.buckets = new BucketClient(authClient)
    this.files = new FileClient(authClient)
  }

  async upload(
    bucket: string,
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<FileUploadResponse> {
    try {
      // Get bucket ID from bucket name
      const foundBucketId = await this.buckets.findByName(bucket)
      if (foundBucketId === null) {
        throw new SelfDBError({
          message: `Bucket '${bucket}' not found`,
          code: 'BUCKET_NOT_FOUND',
          suggestion: 'Create the bucket first or check the bucket name'
        })
      }
      
      const bucketId = foundBucketId

      const uploadOptions: UploadFileOptions = {}
      if (options.metadata) {
        uploadOptions.metadata = options.metadata
      }
      
      // We have two options: upload by bucket name directly or use the ID we found
      return await this.files.uploadByBucketName(bucket, file, options.filename, uploadOptions)
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'UPLOAD_ERROR',
        suggestion: 'Check your file and bucket permissions'
      })
    }
  }

  async download(bucket: string, fileId: string): Promise<Blob> {
    try {
      // Get bucket ID from bucket name
      const bucketId = await this.buckets.findByName(bucket)
      if (bucketId === null) {
        throw new SelfDBError({
          message: `Bucket '${bucket}' not found`,
          code: 'BUCKET_NOT_FOUND',
          suggestion: 'Check the bucket name'
        })
      }

      return await this.files.downloadFile(bucketId, fileId)
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'DOWNLOAD_ERROR',
        suggestion: 'Check the file ID and your permissions'
      })
    }
  }

  async delete(bucket: string, fileId: string): Promise<void> {
    try {
      // Get bucket ID from bucket name
      const bucketId = await this.buckets.findByName(bucket)
      if (bucketId === null) {
        throw new SelfDBError({
          message: `Bucket '${bucket}' not found`,
          code: 'BUCKET_NOT_FOUND',
          suggestion: 'Check the bucket name'
        })
      }

      await this.files.deleteFile(bucketId, fileId)
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'DELETE_ERROR',
        suggestion: 'Check the file ID and your permissions'
      })
    }
  }

  async getUrl(bucket: string, fileId: string): Promise<string> {
    try {
      // Get bucket ID from bucket name
      const bucketId = await this.buckets.findByName(bucket)
      if (bucketId === null) {
        throw new SelfDBError({
          message: `Bucket '${bucket}' not found`,
          code: 'BUCKET_NOT_FOUND',
          suggestion: 'Check the bucket name'
        })
      }

      return this.files.getFileUrl(bucketId, fileId)
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Failed to get URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'URL_ERROR',
        suggestion: 'Check the file ID and bucket name'
      })
    }
  }

  async list(bucket: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<FileMetadata[]> {
    try {
      // Get bucket ID from bucket name
      const bucketId = await this.buckets.findByName(bucket)
      if (bucketId === null) {
        throw new SelfDBError({
          message: `Bucket '${bucket}' not found`,
          code: 'BUCKET_NOT_FOUND',
          suggestion: 'Check the bucket name'
        })
      }

      return await this.files.listFiles(bucketId, options)
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'LIST_ERROR',
        suggestion: 'Check the bucket name and your permissions'
      })
    }
  }

  async createBucket(options: CreateBucketRequest): Promise<Bucket> {
    try {
      return await this.buckets.createBucket(options)
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Failed to create bucket: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'BUCKET_CREATE_ERROR',
        suggestion: 'Check your bucket configuration and permissions'
      })
    }
  }

  async listBuckets(options: { limit?: number; offset?: number } = {}): Promise<Bucket[]> {
    try {
      return await this.buckets.listBuckets(options)
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Failed to list buckets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'BUCKET_LIST_ERROR',
        suggestion: 'Check your permissions'
      })
    }
  }
}