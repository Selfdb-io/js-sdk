# 🚀 SelfDB JavaScript SDK - AI Assistant Guide

**Copy-paste ready guide for using SelfDB in JavaScript/TypeScript applications**

## 📋 Quick Reference for AI Assistants

```
IMPORTANT SETUP CHECKLIST:
[ ] Install: npm install @selfdb/js-sdk
[ ] Set environment variables (SELFDB_URL, SELFDB_STORAGE_URL, SELFDB_ANON_KEY)
[ ] Create client with createClient()
[ ] Export db, storage, auth from selfdb instance
[ ] Use db.from() for queries (Supabase-like syntax)
[ ] Use storage.upload() for files
[ ] Use auth.login() for authentication
[ ] Always use await (all methods are async)
```

## 🎯 1. Summary

SelfDB is a self-hosted database with a Supabase-like API. This SDK provides:
- **Database**: CRUD operations with query builder
- **Storage**: File upload/download with buckets
- **Auth**: User registration, login, session management
- **Realtime**: Live data updates (optional)

**Key Pattern**: Create client once, export individual services (db, storage, auth)

## 🔧 2. Environment Variables

### For React/Vite Projects
```bash
# .env file
VITE_SELFDB_URL=http://localhost:8000
VITE_SELFDB_STORAGE_URL=http://localhost:8001
VITE_SELFDB_ANON_KEY=your_anon_key_here
```

### For Next.js Projects
```bash
# .env.local file
NEXT_PUBLIC_SELFDB_URL=http://localhost:8000
NEXT_PUBLIC_SELFDB_STORAGE_URL=http://localhost:8001
NEXT_PUBLIC_SELFDB_ANON_KEY=your_anon_key_here
```

### For React Native/Expo Projects
```bash
# .env file
EXPO_PUBLIC_SELFDB_URL=http://localhost:8000
EXPO_PUBLIC_SELFDB_STORAGE_URL=http://localhost:8001
EXPO_PUBLIC_SELFDB_ANON_KEY=your_anon_key_here
```

### For Node.js Projects
```bash
# .env file
SELFDB_URL=http://localhost:8000
SELFDB_STORAGE_URL=http://localhost:8001
SELFDB_ANON_KEY=your_anon_key_here
```

**Getting the ANON_KEY**: Look in your SelfDB dashboard settings page. 

## 🏗️ 3. Client Setup

### Basic Setup (selfdb.ts)
```typescript
import { createClient } from '@selfdb/js-sdk'

// For Vite/React
const selfdb = createClient({
  baseUrl: import.meta.env.VITE_SELFDB_URL,
  storageUrl: import.meta.env.VITE_SELFDB_STORAGE_URL,
  anonKey: import.meta.env.VITE_SELFDB_ANON_KEY
})

// For Next.js
const selfdb = createClient({
  baseUrl: process.env.NEXT_PUBLIC_SELFDB_URL!,
  storageUrl: process.env.NEXT_PUBLIC_SELFDB_STORAGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SELFDB_ANON_KEY!
})

// For React Native/Expo
import Constants from 'expo-constants'

const SELFDB_URL = Constants.expoConfig?.extra?.SELFDB_URL || 
  process.env.EXPO_PUBLIC_SELFDB_URL || 
  'http://localhost:8000'

const SELFDB_STORAGE_URL = Constants.expoConfig?.extra?.SELFDB_STORAGE_URL || 
  process.env.EXPO_PUBLIC_SELFDB_STORAGE_URL || 
  'http://localhost:8001'

const SELFDB_ANON_KEY = Constants.expoConfig?.extra?.SELFDB_ANON_KEY || 
  process.env.EXPO_PUBLIC_SELFDB_ANON_KEY

if (!SELFDB_ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SELFDB_ANON_KEY is required. Please check your .env file.')
}

const selfdb = createClient({
  baseUrl: SELFDB_URL,
  storageUrl: SELFDB_STORAGE_URL,
  anonKey: SELFDB_ANON_KEY
})

// Export individual clients for convenience
export const auth = selfdb.auth
export const db = selfdb.db
export const storage = selfdb.storage
export const realtime = selfdb.realtime
export const functions = selfdb.functions
```

## 📊 4. CRUD Operations

### Database Types (Example)
```typescript
interface Topic {
  id: string
  title: string
  content: string
  author_name: string
  user_id?: string
  file_id?: string
  created_at: string
  updated_at: string
}

interface Comment {
  id: string
  topic_id: string
  content: string
  author_name: string
  user_id?: string
  file_id?: string
  created_at: string
  updated_at: string
}
```

### CREATE Operations
```typescript
import { db, storage } from './selfdb'

// Simple insert
const newTopic = await db.from('topics').insert({
  title: 'New Discussion',
  content: 'Topic content',
  author_name: 'Jane Doe',
  user_id: 'user123'
})

// Insert with file upload
const file = new File([blob], 'document.pdf', { type: 'application/pdf' })
const { file: uploaded } = await storage.upload('discussion', file)

const topicWithFile = await db.from('topics').insert({
  title: 'Document Review',
  content: 'Please review this document',
  author_name: 'Jane Doe',
  user_id: 'user456',
  file_id: uploaded.id
})
```

### READ Operations
```typescript
// Get all records
const topics = await db.from('topics')
  .order('created_at', 'desc')
  .execute()

// Get single record
const topic = await db.from('topics')
  .where('id', 'topic123')
  .single()

// Get with filters
const userTopics = await db.from('topics')
  .where('user_id', 'user123')
  .order('created_at', 'desc')
  .limit(10)
  .execute()

// Get with pagination
const paginatedTopics = await db.from('topics')
  .order('created_at', 'desc')
  .limit(10)
  .offset(20)
  .execute()
```

### UPDATE Operations
```typescript
// Simple update
await db.from('topics')
  .where('id', 'topic123')
  .update({ title: 'Updated Title' })

// Update multiple fields
await db.from('topics')
  .where('id', 'topic123')
  .update({
    title: 'New Title',
    content: 'Updated content',
    updated_at: new Date().toISOString()
  })

// Update with file replacement
const newFile = new File([blob], 'new-doc.pdf', { type: 'application/pdf' })
const { file: newUploaded } = await storage.upload('discussion', newFile)

await db.from('topics')
  .where('id', 'topic123')
  .update({ file_id: newUploaded.id })

// Delete old file if needed
if (oldFileId) {
  await storage.files.deleteFile(oldFileId)
}
```

### DELETE Operations
```typescript
// Delete record
await db.from('topics')
  .where('id', 'topic123')
  .delete()

// Delete with file cleanup
const topic = await db.from('topics')
  .where('id', 'topic123')
  .single()

if (topic?.file_id) {
  await storage.files.deleteFile(topic.file_id)
}

await db.from('topics')
  .where('id', 'topic123')
  .delete()
```

## 🔐 5. Authentication

### Login
```typescript
import { auth } from './selfdb'

// Simple login
const response = await auth.login({
  email: 'user@example.com',
  password: 'password123'
})
console.log('Logged in:', response.user.email)
console.log('Access token:', response.access_token)

// Login with error handling
try {
  const response = await auth.login({ email, password })
  return { success: true, data: response }
} catch (error) {
  console.error('Login failed:', error)
  return { success: false, error: error.message }
}
```

### Register
```typescript
// Register new user
const user = await auth.register({
  email: 'new@example.com',
  password: 'password123'
})

// Register with validation
const registerUser = async (email: string, password: string, confirmPassword: string) => {
  // Validate
  if (!email.includes('@')) throw new Error('Invalid email')
  if (password.length < 6) throw new Error('Password too short')
  if (password !== confirmPassword) throw new Error('Passwords do not match')
  
  // Register
  const user = await auth.register({ email, password })
  
  // Auto-login after registration
  const loginResponse = await auth.login({ email, password })
  return loginResponse
}
```

### Session Management
```typescript
// Check if authenticated
const isLoggedIn = auth.isAuthenticated()

// Get current user
const currentUser = auth.getCurrentUser()

// Get user from API
const user = await auth.getUser()

// Logout
await auth.logout()

// Check and restore session on app start
const initAuth = async () => {
  if (auth.isAuthenticated()) {
    const user = auth.getCurrentUser() || await auth.getUser()
    return user
  }
  return null
}
```

## 📁 6. Storage Operations

### File Upload
```typescript
// Simple upload
const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
const result = await storage.upload('my-bucket', file)
console.log('File ID:', result.file.id)

// Upload with progress
const result = await storage.upload('my-bucket', file, {
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`)
  }
})
```

### File Access
```typescript
// Get public URL
const url = storage.files.getFileUrl('my-bucket', fileId)

// Download file
const blob = await storage.download('my-bucket', fileId)

// List files
const files = await storage.list('my-bucket')

// Delete file
await storage.files.deleteFile(fileId)
```

## 🛡️ 7. Error Handling Patterns

```typescript
// Wrap operations for safety
const safeDbOperation = async <T>(operation: () => Promise<T>) => {
  try {
    const result = await operation()
    return { success: true, data: result }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: error.message }
  }
}

// Usage
const result = await safeDbOperation(() => 
  db.from('topics').insert({ title: 'New Topic' })
)

if (result.success) {
  console.log('Created:', result.data)
} else {
  console.error('Failed:', result.error)
}

// Auth-aware operations
const authOperation = async <T>(operation: () => Promise<T>) => {
  if (!auth.isAuthenticated()) {
    throw new Error('User not authenticated')
  }
  
  try {
    return await operation()
  } catch (error) {
    if (error.message.includes('401')) {
      // Try token refresh
      const refreshed = await auth.refresh()
      if (refreshed) {
        return await operation() // Retry
      }
      await auth.logout()
      throw new Error('Session expired')
    }
    throw error
  }
}
```

## 💡 8. Complete Examples

### Comment System with Files
```typescript
// Create comment with optional file
const createComment = async (topicId: string, content: string, file?: File) => {
  let fileId = null
  
  // Upload file if provided
  if (file) {
    const { file: uploaded } = await storage.upload('discussion', file)
    fileId = uploaded.id
  }
  
  // Create comment
  const comment = await db.from('comments').insert({
    topic_id: topicId,
    content: content,
    author_name: auth.getCurrentUser()?.email || 'Anonymous',
    user_id: auth.getCurrentUser()?.id,
    file_id: fileId
  })
  
  return comment
}

// Get comments with file URLs
const getCommentsWithFiles = async (topicId: string) => {
  const comments = await db.from('comments')
    .where('topic_id', topicId)
    .order('created_at', 'desc')
    .execute()
  
  // Add file URLs
  return comments.map(comment => ({
    ...comment,
    fileUrl: comment.file_id 
      ? storage.files.getFileUrl('discussion', comment.file_id)
      : null
  }))
}

// Delete comment with file cleanup
const deleteComment = async (commentId: string) => {
  // Get comment first
  const comment = await db.from('comments')
    .where('id', commentId)
    .single()
  
  // Delete file if exists
  if (comment?.file_id) {
    try {
      await storage.files.deleteFile(comment.file_id)
    } catch (error) {
      console.warn('File deletion failed:', error)
    }
  }
  
  // Delete comment
  await db.from('comments')
    .where('id', commentId)
    .delete()
}
```

### React Component Pattern
```tsx
import React, { useState, useEffect } from 'react'
import { db, auth, storage } from './selfdb'

function TopicList() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      setLoading(true)
      const data = await db.from('topics')
        .order('created_at', 'desc')
        .execute()
      setTopics(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTopic = async (title: string, content: string) => {
    try {
      const topic = await db.from('topics').insert({
        title,
        content,
        author_name: auth.getCurrentUser()?.email || 'Anonymous',
        user_id: auth.getCurrentUser()?.id
      })
      
      // Refresh list
      await loadTopics()
      return { success: true, topic }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {topics.map(topic => (
        <div key={topic.id}>
          <h3>{topic.title}</h3>
          <p>{topic.content}</p>
          <small>By {topic.author_name} on {topic.created_at}</small>
        </div>
      ))}
    </div>
  )
}
```

## 🚀 9. Quick Test Script

```typescript
// Test your SelfDB setup
async function testSelfDB() {
  console.log('🧪 Testing SelfDB connection...')
  
  try {
    // Test database
    const tables = await db.getTables()
    console.log('✅ Database connected! Tables:', tables.length)
    
    // Test auth
    const isAuth = auth.isAuthenticated()
    console.log('✅ Auth client ready. Authenticated:', isAuth)
    
    // Test storage
    const buckets = await storage.listBuckets()
    console.log('✅ Storage connected! Buckets:', buckets.length)
    
    console.log('🎉 All systems operational!')
    return true
  } catch (error) {
    console.error('❌ Setup test failed:', error.message)
    console.log('📋 Check your environment variables and server status')
    return false
  }
}

// Run test
testSelfDB()
```

## 📌 Common Patterns for AI Assistants

When helping users with SelfDB:

1. **Always check client setup first** - Most errors come from missing env vars
2. **Use the exported services** - `db`, `storage`, `auth` from selfdb instance
3. **Follow Supabase patterns** - The API is intentionally similar
4. **Remember async/await** - All operations return promises
5. **Handle errors gracefully** - Wrap operations in try/catch
6. **Check authentication** - Use `auth.isAuthenticated()` before protected operations
7. **Clean up files** - Delete files when deleting records with file_id

## 🔧 Troubleshooting Checklist

```
Common Issues:
[ ] "Cannot read properties of undefined" → Check createClient() was called
[ ] "401 Unauthorized" → Check ANON_KEY is set correctly
[ ] "Network Error" → Check baseUrl and server is running
[ ] "Table does not exist" → Check table name spelling
[ ] "No such bucket" → Create bucket first with storage.createBucket()
[ ] "Invalid credentials" → Check email/password are correct
```

---

**This guide is optimized for AI assistants. Copy any section needed and adapt for your use case.**