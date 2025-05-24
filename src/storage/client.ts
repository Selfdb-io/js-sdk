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
    bucket: string | number,
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<FileUploadResponse> {
    try {
      let bucketId: number

      if (typeof bucket === 'string') {
        const foundBucketId = await this.buckets.findByName(bucket)
        if (foundBucketId === null) {
          throw new SelfDBError({
            message: `Bucket '${bucket}' not found`,
            code: 'BUCKET_NOT_FOUND',
            suggestion: 'Create the bucket first or check the bucket name'
          })
        }
        bucketId = foundBucketId
      } else {
        bucketId = bucket
      }

      const uploadOptions: UploadFileOptions = {}
      if (options.metadata) {
        uploadOptions.metadata = options.metadata
      }

      if (typeof bucket === 'string') {
        return await this.files.uploadByBucketName(bucket, file, options.filename, uploadOptions)
      } else {
        return await this.files.uploadFile(bucketId, file, options.filename, uploadOptions)
      }
    } catch (error) {
      if (error instanceof SelfDBError) throw error
      throw new SelfDBError({
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'UPLOAD_ERROR',
        suggestion: 'Check your file and bucket permissions'
      })
    }
  }

  async download(bucket: string | number, fileId: number): Promise<Blob> {
    try {
      let bucketId: number

      if (typeof bucket === 'string') {
        const foundBucketId = await this.buckets.findByName(bucket)
        if (foundBucketId === null) {
          throw new SelfDBError({
            message: `Bucket '${bucket}' not found`,
            code: 'BUCKET_NOT_FOUND',
            suggestion: 'Check the bucket name'
          })
        }
        bucketId = foundBucketId
      } else {
        bucketId = bucket
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

  async delete(bucket: string | number, fileId: number): Promise<void> {
    try {
      let bucketId: number

      if (typeof bucket === 'string') {
        const foundBucketId = await this.buckets.findByName(bucket)
        if (foundBucketId === null) {
          throw new SelfDBError({
            message: `Bucket '${bucket}' not found`,
            code: 'BUCKET_NOT_FOUND',
            suggestion: 'Check the bucket name'
          })
        }
        bucketId = foundBucketId
      } else {
        bucketId = bucket
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

  async getUrl(bucket: string | number, fileId: number): Promise<string> {
    try {
      let bucketId: number

      if (typeof bucket === 'string') {
        const foundBucketId = await this.buckets.findByName(bucket)
        if (foundBucketId === null) {
          throw new SelfDBError({
            message: `Bucket '${bucket}' not found`,
            code: 'BUCKET_NOT_FOUND',
            suggestion: 'Check the bucket name'
          })
        }
        bucketId = foundBucketId
      } else {
        bucketId = bucket
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

  async list(bucket: string | number, options: { limit?: number; offset?: number; search?: string } = {}): Promise<FileMetadata[]> {
    try {
      let bucketId: number

      if (typeof bucket === 'string') {
        const foundBucketId = await this.buckets.findByName(bucket)
        if (foundBucketId === null) {
          throw new SelfDBError({
            message: `Bucket '${bucket}' not found`,
            code: 'BUCKET_NOT_FOUND',
            suggestion: 'Check the bucket name'
          })
        }
        bucketId = foundBucketId
      } else {
        bucketId = bucket
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