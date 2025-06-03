import { AuthClient } from '../auth/client'
import { Config } from '../config'
import type {
  Bucket,
  CreateBucketRequest,
  UpdateBucketRequest
} from './types'

export class BucketClient {
  private authClient: AuthClient
  private config: Config

  constructor(authClient: AuthClient) {
    this.authClient = authClient
    this.config = Config.getInstance()
  }

  async createBucket(bucketData: CreateBucketRequest): Promise<Bucket> {
    return this.authClient.makeAuthenticatedRequest<Bucket>({
      method: 'POST',
      url: '/api/v1/buckets',
      data: bucketData
    })
  }

  async listBuckets(options: { limit?: number; offset?: number } = {}): Promise<Bucket[]> {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())

    const url = `/api/v1/buckets${params.toString() ? `?${params.toString()}` : ''}`
    
    return this.authClient.makeAuthenticatedRequest<Bucket[]>({
      method: 'GET',
      url
    })
  }

  async getBucket(bucketId: string): Promise<Bucket> {
    return this.authClient.makeAuthenticatedRequest<Bucket>({
      method: 'GET',
      url: `/api/v1/buckets/${bucketId}`
    })
  }

  async updateBucket(bucketId: string, updates: UpdateBucketRequest): Promise<Bucket> {
    return this.authClient.makeAuthenticatedRequest<Bucket>({
      method: 'PUT',
      url: `/api/v1/buckets/${bucketId}`,
      data: updates
    })
  }

  async deleteBucket(bucketId: string): Promise<void> {
    await this.authClient.makeAuthenticatedRequest<void>({
      method: 'DELETE',
      url: `/api/v1/buckets/${bucketId}`
    })
  }

  async findByName(bucketName: string): Promise<string | null> {
    try {
      const buckets = await this.listBuckets()
      
      // First try exact match
      let bucket = buckets.find(b => b.name === bucketName)
      
      // If no exact match, try case-insensitive match
      if (!bucket) {
        bucket = buckets.find(b => b.name.toLowerCase() === bucketName.toLowerCase())
      }
      
      return bucket ? bucket.id : null
    } catch (error) {
      console.error('Error finding bucket by name:', error)
      return null
    }
  }
}