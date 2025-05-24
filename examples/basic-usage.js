// Basic usage example for SelfDB JavaScript SDK
import { createClient } from '@selfdb/js-sdk'

// Initialize the SelfDB client
const selfdb = createClient({
  baseUrl: 'http://localhost:8000', // Your SelfDB backend URL
  storageUrl: 'http://localhost:8001', // Your SelfDB storage service URL
  anonKey: 'your-anonymous-key' // Required: for API access (get from your .env file)
})

async function main() {
  try {
    // 1. Authentication
    console.log('🔐 Authenticating...')
    const { user } = await selfdb.auth.login({
      email: 'admin@example.com',
      password: 'adminpassword'
    })
    console.log('✅ Logged in as:', user.email)

    // 2. Database Operations
    console.log('\n📊 Database Operations...')
    
    // Read users
    const users = await selfdb.db.read('users', {
      limit: 5,
      orderBy: [{ column: 'created_at', direction: 'desc' }]
    })
    console.log('✅ Found users:', users.length)

    // Create a new user
    if (users.length < 10) {
      const newUser = await selfdb.db.create('users', {
        email: `user${Date.now()}@example.com`,
        password: 'password123',
        is_active: true
      })
      console.log('✅ Created user:', newUser.email)
    }

    // 3. Storage Operations
    console.log('\n📁 Storage Operations...')
    
    // List buckets
    const buckets = await selfdb.storage.buckets.listBuckets()
    console.log('✅ Found buckets:', buckets.length)

    // Create a bucket if none exist
    if (buckets.length === 0) {
      const bucket = await selfdb.storage.buckets.createBucket({
        name: 'test-bucket',
        is_public: true,
        description: 'Test bucket for SDK demo'
      })
      console.log('✅ Created bucket:', bucket.name)
    }

    // 4. Realtime Connection
    console.log('\n⚡ Realtime Operations...')
    
    await selfdb.realtime.connect()
    console.log('✅ Connected to realtime service')

    // Subscribe to user changes
    const subscription = selfdb.realtime.subscribe('users', (payload) => {
      console.log('🔔 Realtime update:', payload)
    })
    console.log('✅ Subscribed to user changes')

    // 5. Raw SQL Query
    console.log('\n🗃️ Raw SQL Query...')
    
    const result = await selfdb.db.executeSql(
      'SELECT COUNT(*) as user_count FROM users WHERE is_active = $1',
      [true]
    )
    console.log('✅ Active users count:', result.rows[0][0])

    // Clean up
    subscription.unsubscribe()
    selfdb.realtime.disconnect()
    
    console.log('\n🎉 Demo completed successfully!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the demo
main()